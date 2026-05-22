import { loadConfig } from "@bot/config";
import { DatabaseService } from "../src/index";

const config = loadConfig({
  env: {
    ...process.env,
    API_KEY: process.env.API_KEY ?? "seed-api-key-value",
    DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID ?? "seed-client-id",
    DISCORD_TOKEN: process.env.DISCORD_TOKEN ?? "seed-token",
  },
});

const database = new DatabaseService(config.databaseUrl);
await database.connect();

await database.repositories.botSettings.set("template.seeded", new Date().toISOString());

if (config.discordGuildId) {
  await database.repositories.featureFlags.setEnabled(config.discordGuildId, "examples", true);
  await database.repositories.featureFlags.setEnabled(config.discordGuildId, "system", true);
}

await database.disconnect();
