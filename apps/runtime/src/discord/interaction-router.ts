import {
  type AppContext,
  AppError,
  ephemeral,
  parseCustomId,
  routeKey,
  runInteractionGuards,
  safeReply,
} from "@bot/core";
import { type ChatInputCommandInteraction, Events } from "discord.js";

export function installDiscordRouter(ctx: AppContext): void {
  for (const event of ctx.registries.events) {
    const listener = (...args: unknown[]) => event.execute(ctx, ...args);
    if (event.once) {
      ctx.client.once(event.name, listener);
    } else {
      ctx.client.on(event.name, listener);
    }
  }

  ctx.client.on(Events.InteractionCreate, async (interaction) => {
    try {
      if (interaction.isChatInputCommand()) {
        await handleCommand(ctx, interaction);
        return;
      }

      if (interaction.isButton()) {
        const customId = parseCustomId(interaction.customId);
        const component = ctx.registries.components.get(routeKey(customId));
        if (!component) {
          throw new AppError(
            "No button handler found for this interaction.",
            "UNKNOWN_COMPONENT",
            404,
          );
        }
        await assertFeatureEnabled(ctx, customId.feature, interaction.guildId);
        const guardResult = await runInteractionGuards(ctx, interaction, component.guards);
        if (!guardResult.allowed) {
          await safeReply(interaction, ephemeral({ content: guardResult.reason }));
          return;
        }
        await component.execute(ctx, interaction, customId);
        return;
      }

      if (interaction.isAnySelectMenu()) {
        const customId = parseCustomId(interaction.customId);
        const select = ctx.registries.selects.get(routeKey(customId));
        if (!select) {
          throw new AppError(
            "No select menu handler found for this interaction.",
            "UNKNOWN_SELECT",
            404,
          );
        }
        await assertFeatureEnabled(ctx, customId.feature, interaction.guildId);
        const guardResult = await runInteractionGuards(ctx, interaction, select.guards);
        if (!guardResult.allowed) {
          await safeReply(interaction, ephemeral({ content: guardResult.reason }));
          return;
        }
        await select.execute(ctx, interaction, customId);
        return;
      }

      if (interaction.isModalSubmit()) {
        const customId = parseCustomId(interaction.customId);
        const modal = ctx.registries.modals.get(routeKey(customId));
        if (!modal) {
          throw new AppError("No modal handler found for this interaction.", "UNKNOWN_MODAL", 404);
        }
        await assertFeatureEnabled(ctx, customId.feature, interaction.guildId);
        const guardResult = await runInteractionGuards(ctx, interaction, modal.guards);
        if (!guardResult.allowed) {
          await safeReply(interaction, ephemeral({ content: guardResult.reason }));
          return;
        }
        await modal.execute(ctx, interaction, customId);
      }
    } catch (error) {
      ctx.logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          interactionId: interaction.id,
        },
        "Interaction failed",
      );

      if (interaction.isRepliable()) {
        const message =
          error instanceof AppError && error.statusCode < 500
            ? error.message
            : "Something went wrong while handling this interaction.";
        await safeReply(interaction, ephemeral({ content: message }));
      }
    }
  });
}

async function handleCommand(
  ctx: AppContext,
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const command = ctx.registries.commands.get(interaction.commandName);
  if (!command) {
    throw new AppError("Unknown command.", "UNKNOWN_COMMAND", 404);
  }

  const featureName = ctx.registries.commandFeatures.get(interaction.commandName);
  if (featureName) {
    await assertFeatureEnabled(ctx, featureName, interaction.guildId);
  }

  const guardResult = await runInteractionGuards(ctx, interaction, command.guards);
  if (!guardResult.allowed) {
    await safeReply(interaction, ephemeral({ content: guardResult.reason }));
    return;
  }

  try {
    await command.execute(ctx, interaction);
    if (command.persistLog) {
      await ctx.database.repositories.commandLogs.create({
        commandName: interaction.commandName,
        guildId: interaction.guildId,
        success: true,
        userId: interaction.user.id,
      });
    }
  } catch (error) {
    if (command.persistLog) {
      await ctx.database.repositories.commandLogs.create({
        commandName: interaction.commandName,
        errorMessage: error instanceof Error ? error.message : String(error),
        guildId: interaction.guildId,
        success: false,
        userId: interaction.user.id,
      });
    }
    throw error;
  }
}

async function assertFeatureEnabled(
  ctx: AppContext,
  featureName: string,
  guildId: string | null,
): Promise<void> {
  if (!guildId) {
    return;
  }

  const enabled = await ctx.database.repositories.featureFlags.isEnabled(guildId, featureName);
  if (!enabled) {
    throw new AppError(
      `Feature "${featureName}" is disabled for this server.`,
      "FEATURE_DISABLED",
      403,
    );
  }
}
