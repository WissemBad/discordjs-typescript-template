import { timingSafeEqual } from "node:crypto";
import type {
  AnySelectMenuInteraction,
  APIApplicationCommandOptionChoice,
  Awaitable,
  ButtonInteraction,
  ChatInputCommandInteraction,
  Client,
  ClientEvents,
  InteractionEditReplyOptions,
  InteractionReplyOptions,
  InteractionResponse,
  Message,
  ModalSubmitInteraction,
  PermissionResolvable,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";
import { MessageFlags, PermissionsBitField } from "discord.js";
import type { ErrorRequestHandler, RequestHandler, Router } from "express";

export type RuntimeMode = "development" | "test" | "production";

export type BotConfig = {
  nodeEnv: RuntimeMode;
  logLevel: string;
  discordToken: string;
  discordClientId: string;
  discordGuildId?: string;
  databaseUrl: string;
  apiPort: number;
  apiKey: string;
};

/** Minimal logger shape shared across packages and features. */
export type Logger = {
  debug: (obj: object | string, message?: string) => void;
  info: (obj: object | string, message?: string) => void;
  warn: (obj: object | string, message?: string) => void;
  error: (obj: object | string, message?: string) => void;
  child: (bindings: object) => Logger;
};

export type GuildFeatureFlag = {
  guildId: string;
  featureName: string;
  enabled: boolean;
};

/** Stable database contract exposed to features. Features should use repositories, not Prisma directly. */
export type Database = {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  repositories: {
    guildConfigs: GuildConfigRepository;
    commandLogs: CommandLogRepository;
    featureFlags: FeatureFlagRepository;
    botSettings: BotSettingRepository;
  };
};

export type GuildConfigRepository = {
  upsertPrefix: (guildId: string, prefix: string) => Promise<void>;
  findByGuildId: (guildId: string) => Promise<{ guildId: string; prefix: string | null } | null>;
};

export type CommandLogRepository = {
  create: (input: {
    commandName: string;
    guildId?: string | null;
    userId: string;
    success: boolean;
    errorMessage?: string | null;
  }) => Promise<void>;
};

export type FeatureFlagRepository = {
  listForGuild: (guildId: string) => Promise<GuildFeatureFlag[]>;
  isEnabled: (guildId: string, featureName: string) => Promise<boolean>;
  setEnabled: (guildId: string, featureName: string, enabled: boolean) => Promise<GuildFeatureFlag>;
};

export type BotSettingRepository = {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<void>;
};

export type EventBusEventMap = Record<string, unknown>;

export class EventBus {
  private readonly handlers = new Map<string, Set<(payload: unknown) => Awaitable<void>>>();

  on<TPayload>(eventName: string, handler: (payload: TPayload) => Awaitable<void>): () => void {
    const handlers =
      this.handlers.get(eventName) ?? new Set<(payload: unknown) => Awaitable<void>>();
    const wrapped = handler as (payload: unknown) => Awaitable<void>;
    handlers.add(wrapped);
    this.handlers.set(eventName, handlers);

    return () => {
      handlers.delete(wrapped);
    };
  }

  async emit<TPayload>(eventName: string, payload: TPayload): Promise<void> {
    const handlers = this.handlers.get(eventName);
    if (!handlers) {
      return;
    }

    await Promise.all([...handlers].map((handler) => handler(payload)));
  }
}

export type AppContext = {
  client: Client;
  config: BotConfig;
  database: Database;
  eventBus: EventBus;
  logger: Logger;
  registries: AppRegistries;
  startedAt: Date;
};

export class AppError extends Error {
  constructor(
    message: string,
    readonly code = "APP_ERROR",
    readonly statusCode = 500,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You are not allowed to use this action.") {
    super(message, "FORBIDDEN", 403);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found.") {
    super(message, "NOT_FOUND", 404);
    this.name = "NotFoundError";
  }
}

export type GuardResult = { allowed: true } | { allowed: false; reason: string };
export type InteractionGuard<TInteraction extends GuardableInteraction = GuardableInteraction> = (
  ctx: AppContext,
  interaction: TInteraction,
) => Awaitable<GuardResult>;

export type GuardableInteraction =
  | ChatInputCommandInteraction
  | ButtonInteraction
  | AnySelectMenuInteraction
  | ModalSubmitInteraction;

export type ApiGuard = RequestHandler;

export const allow: GuardResult = { allowed: true };

export const deny = (reason: string): GuardResult => ({ allowed: false, reason });

export const guards = {
  /** Requires Discord Administrator permission in the current guild. */
  adminOnly: (): InteractionGuard<GuardableInteraction> => (_ctx, interaction) => {
    const permissions = interaction.memberPermissions;
    if (!permissions?.has(PermissionsBitField.Flags.Administrator)) {
      return deny("Administrator permission is required.");
    }

    return allow;
  },
  /** Allows a command/component only while NODE_ENV is development. */
  devOnly: (): InteractionGuard<GuardableInteraction> => (ctx, interaction) => {
    if (ctx.config.nodeEnv !== "development") {
      return deny("This action is available only in development.");
    }

    if (ctx.config.discordGuildId && interaction.guildId !== ctx.config.discordGuildId) {
      return deny("This action is limited to the configured development guild.");
    }

    return allow;
  },
  /** Rejects interactions executed outside a guild. */
  guildOnly: (): InteractionGuard<GuardableInteraction> => (_ctx, interaction) => {
    if (!interaction.inGuild()) {
      return deny("This action can only be used in a server.");
    }

    return allow;
  },
  dmAllowed:
    (allowed = true): InteractionGuard<GuardableInteraction> =>
    (_ctx, interaction) => {
      if (!allowed && !interaction.inGuild()) {
        return deny("This action is not available in direct messages.");
      }

      return allow;
    },
  requiredPermissions:
    (permissions: PermissionResolvable): InteractionGuard<GuardableInteraction> =>
    (_ctx, interaction) => {
      if (!interaction.memberPermissions?.has(permissions)) {
        return deny("Missing required permissions.");
      }

      return allow;
    },
};

export async function runInteractionGuards<TInteraction extends GuardableInteraction>(
  ctx: AppContext,
  interaction: TInteraction,
  interactionGuards: InteractionGuard<TInteraction>[] = [],
): Promise<GuardResult> {
  for (const guard of interactionGuards) {
    const result = await guard(ctx, interaction);
    if (!result.allowed) {
      return result;
    }
  }

  return allow;
}

export const apiKeyRequired = (config: Pick<BotConfig, "apiKey">): RequestHandler => {
  return (req, res, next) => {
    const apiKey = req.header("x-api-key");
    if (!apiKey || !constantTimeEqual(apiKey, config.apiKey)) {
      res.status(401).json({ error: "Invalid or missing API key." });
      return;
    }

    next();
  };
};

const customIdSegmentPattern = /^[a-z0-9][a-z0-9_-]{0,31}$/;

export type CustomIdParts = {
  feature: string;
  scope: string;
  action: string;
  id?: string;
};

export type CustomIdRoute = Pick<CustomIdParts, "action" | "feature" | "scope">;

/** Builds Discord custom_id values as feature:scope:action[:id] and enforces Discord's 100 char limit. */
export function formatCustomId(parts: CustomIdParts): string {
  for (const [key, value] of Object.entries(parts)) {
    if (value && !customIdSegmentPattern.test(value)) {
      throw new AppError(`Invalid custom id segment "${key}".`, "INVALID_CUSTOM_ID", 400);
    }
  }

  const value = [parts.feature, parts.scope, parts.action, parts.id].filter(Boolean).join(":");
  if (value.length > 100) {
    throw new AppError(
      "Discord custom_id cannot exceed 100 characters.",
      "CUSTOM_ID_TOO_LONG",
      400,
    );
  }

  return value;
}

/** Parses a Discord custom_id back into route parts for registry dispatch. */
export function parseCustomId(customId: string): CustomIdParts {
  if (customId.length > 100) {
    throw new AppError(
      "Discord custom_id cannot exceed 100 characters.",
      "CUSTOM_ID_TOO_LONG",
      400,
    );
  }

  const [feature, scope, action, id, ...extra] = customId.split(":");
  if (!feature || !scope || !action || extra.length > 0) {
    throw new AppError("Invalid custom_id format.", "INVALID_CUSTOM_ID", 400);
  }

  for (const [key, value] of Object.entries({ action, feature, id, scope })) {
    if (value && !customIdSegmentPattern.test(value)) {
      throw new AppError(`Invalid custom id segment "${key}".`, "INVALID_CUSTOM_ID", 400);
    }
  }

  return {
    feature,
    scope,
    action,
    id,
  };
}

function constantTimeEqual(value: string, expected: string): boolean {
  const valueBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);
  if (valueBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(valueBuffer, expectedBuffer);
}

export function routeKey(route: CustomIdRoute): string {
  return `${route.feature}:${route.scope}:${route.action}`;
}

export type CommandBuilder =
  | SlashCommandBuilder
  | SlashCommandOptionsOnlyBuilder
  | SlashCommandSubcommandsOnlyBuilder;

export type CommandDefinition = {
  /** discord.js SlashCommandBuilder data sent by the deployment scripts. */
  data: CommandBuilder;
  /** Reusable authorization and environment checks run before execute. */
  guards?: InteractionGuard<ChatInputCommandInteraction>[];
  /** Persists success/failure into CommandLog when true. */
  persistLog?: boolean;
  execute: (ctx: AppContext, interaction: ChatInputCommandInteraction) => Awaitable<void>;
};

export type DiscordEventDefinition<K extends keyof ClientEvents = keyof ClientEvents> = {
  name: K;
  once?: boolean;
  execute: (ctx: AppContext, ...args: unknown[]) => Awaitable<void>;
};

export type ComponentDefinition = {
  route: CustomIdRoute;
  guards?: InteractionGuard<ButtonInteraction>[];
  execute: (
    ctx: AppContext,
    interaction: ButtonInteraction,
    customId: CustomIdParts,
  ) => Awaitable<void>;
};

export type SelectMenuDefinition = {
  route: CustomIdRoute;
  guards?: InteractionGuard<AnySelectMenuInteraction>[];
  execute: (
    ctx: AppContext,
    interaction: AnySelectMenuInteraction,
    customId: CustomIdParts,
  ) => Awaitable<void>;
};

export type ModalDefinition = {
  route: CustomIdRoute;
  guards?: InteractionGuard<ModalSubmitInteraction>[];
  execute: (
    ctx: AppContext,
    interaction: ModalSubmitInteraction,
    customId: CustomIdParts,
  ) => Awaitable<void>;
};

export type ApiRouteDefinition = {
  basePath: string;
  guards?: ApiGuard[];
  buildRouter: (ctx: AppContext) => Router;
};

export type JobDefinition = {
  name: string;
  start: (ctx: AppContext) => Awaitable<void>;
  stop?: (ctx: AppContext) => Awaitable<void>;
};

export type FeatureModule = {
  /** Stable feature namespace. Also used as the first segment of custom ids. */
  name: string;
  description: string;
  /** Runs once after the feature is registered and before Discord login. */
  setup?: (ctx: AppContext) => Awaitable<void>;
  /** Runs during shutdown in reverse feature order. */
  teardown?: (ctx: AppContext) => Awaitable<void>;
  commands?: CommandDefinition[];
  events?: DiscordEventDefinition[];
  components?: ComponentDefinition[];
  selects?: SelectMenuDefinition[];
  modals?: ModalDefinition[];
  routes?: ApiRouteDefinition[];
  jobs?: JobDefinition[];
};

export class AppRegistries {
  readonly commandFeatures = new Map<string, string>();
  readonly commands = new Map<string, CommandDefinition>();
  readonly components = new Map<string, ComponentDefinition>();
  readonly events: DiscordEventDefinition[] = [];
  readonly features = new Map<string, FeatureModule>();
  readonly jobs = new Map<string, JobDefinition>();
  readonly modals = new Map<string, ModalDefinition>();
  readonly routes: ApiRouteDefinition[] = [];
  readonly selects = new Map<string, SelectMenuDefinition>();

  registerFeature(feature: FeatureModule): void {
    if (this.features.has(feature.name)) {
      throw new AppError(
        `Feature "${feature.name}" is already registered.`,
        "REGISTRY_COLLISION",
        500,
      );
    }

    this.features.set(feature.name, feature);
    for (const command of feature.commands ?? []) {
      this.registerCommand(command, feature.name);
    }
    for (const event of feature.events ?? []) {
      this.events.push(event);
    }
    for (const component of feature.components ?? []) {
      this.registerByRoute(this.components, component.route, component, "component");
    }
    for (const select of feature.selects ?? []) {
      this.registerByRoute(this.selects, select.route, select, "select");
    }
    for (const modal of feature.modals ?? []) {
      this.registerByRoute(this.modals, modal.route, modal, "modal");
    }
    for (const route of feature.routes ?? []) {
      this.routes.push(route);
    }
    for (const job of feature.jobs ?? []) {
      if (this.jobs.has(job.name)) {
        throw new AppError(`Job "${job.name}" is already registered.`, "REGISTRY_COLLISION", 500);
      }
      this.jobs.set(job.name, job);
    }
  }

  toCommandPayloads(): RESTPostAPIChatInputApplicationCommandsJSONBody[] {
    return [...this.commands.values()].map((command) => command.data.toJSON());
  }

  private registerCommand(command: CommandDefinition, featureName: string): void {
    const payload = command.data.toJSON();
    if (this.commands.has(payload.name)) {
      throw new AppError(
        `Command "${payload.name}" is already registered.`,
        "REGISTRY_COLLISION",
        500,
      );
    }
    this.commands.set(payload.name, command);
    this.commandFeatures.set(payload.name, featureName);
  }

  private registerByRoute<TDefinition extends { route: CustomIdRoute }>(
    registry: Map<string, TDefinition>,
    route: CustomIdRoute,
    definition: TDefinition,
    kind: string,
  ): void {
    const key = routeKey(route);
    if (registry.has(key)) {
      throw new AppError(
        `${kind} route "${key}" is already registered.`,
        "REGISTRY_COLLISION",
        500,
      );
    }
    registry.set(key, definition);
  }
}

export async function loadFeatures(
  ctx: AppContext,
  features: FeatureModule[],
): Promise<FeatureModule[]> {
  for (const feature of features) {
    ctx.registries.registerFeature(feature);
    await feature.setup?.(ctx);
  }

  return features;
}

type SafeReplyInteraction = {
  deferred: boolean;
  editReply: (options: InteractionEditReplyOptions) => Promise<Message | InteractionResponse>;
  followUp: (options: InteractionReplyOptions) => Promise<Message | InteractionResponse>;
  replied: boolean;
  reply: (options: InteractionReplyOptions) => Promise<InteractionResponse | Message>;
};

export function ephemeral(options: InteractionReplyOptions): InteractionReplyOptions {
  return {
    ...options,
    flags: MessageFlags.Ephemeral,
  };
}

export async function safeReply(
  interaction: SafeReplyInteraction,
  options: InteractionReplyOptions,
): Promise<Message | InteractionResponse> {
  if (interaction.deferred) {
    return interaction.editReply(options as InteractionEditReplyOptions);
  }

  if (interaction.replied) {
    return interaction.followUp(options);
  }

  return interaction.reply(options);
}

export function choice<TName extends string, TValue extends string | number>(
  name: TName,
  value: TValue,
): APIApplicationCommandOptionChoice<TValue> {
  return { name, value };
}

export function createApiErrorMiddleware(logger: Logger): ErrorRequestHandler {
  return (error, req, res, _next) => {
    const statusCode = error instanceof AppError ? error.statusCode : 500;
    const requestId = req.header("x-request-id");
    logger.error(
      {
        error: error instanceof Error ? error.message : String(error),
        requestId,
        statusCode,
      },
      "API request failed",
    );

    res.status(statusCode).json({
      error: statusCode === 500 ? "Internal server error." : String(error.message),
      requestId,
    });
  };
}
