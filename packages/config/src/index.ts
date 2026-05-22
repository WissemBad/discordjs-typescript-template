import type { BotConfig } from "@bot/core";
import { config as loadDotenv } from "dotenv";
import { z } from "zod";

loadDotenv({ quiet: true });

export type LoadConfigOptions = {
  /** Overrides process.env in tests and scripts. Runtime code normally leaves this unset. */
  env?: Record<string, string | undefined>;
  /** Set to true for guild-only command deployment, where DISCORD_GUILD_ID is mandatory. */
  requireGuildId?: boolean;
};

const envSchema = z.object({
  API_KEY: z.string().min(16, "API_KEY must be at least 16 characters."),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.string().min(1),
  DISCORD_CLIENT_ID: z.string().min(1),
  DISCORD_GUILD_ID: z
    .string()
    .min(1)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  DISCORD_TOKEN: z.string().min(1),
  LOG_LEVEL: z.string().default("info"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export function loadConfig(options: LoadConfigOptions = {}): BotConfig {
  const parsed = envSchema.safeParse(options.env ?? process.env);

  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
    throw new Error(`Invalid environment configuration:\n${details.join("\n")}`);
  }

  if (options.requireGuildId && !parsed.data.DISCORD_GUILD_ID) {
    throw new Error("DISCORD_GUILD_ID is required for guild command deployment.");
  }

  return {
    apiKey: parsed.data.API_KEY,
    apiPort: parsed.data.API_PORT,
    databaseUrl: parsed.data.DATABASE_URL,
    discordClientId: parsed.data.DISCORD_CLIENT_ID,
    discordGuildId: parsed.data.DISCORD_GUILD_ID,
    discordToken: parsed.data.DISCORD_TOKEN,
    logLevel: parsed.data.LOG_LEVEL,
    nodeEnv: parsed.data.NODE_ENV,
  };
}
