import { loadConfig } from "@bot/config";
import { type AppContext, AppRegistries, EventBus } from "@bot/core";
import { DatabaseService } from "@bot/database";
import { createLogger } from "@bot/logger";
import { BotClient } from "../discord/bot-client";

export async function createAppContext(): Promise<AppContext> {
  const config = loadConfig();
  const logger = createLogger(config.logLevel);
  const database = new DatabaseService(config.databaseUrl);

  await database.connect();

  return {
    client: new BotClient(),
    config,
    database,
    eventBus: new EventBus(),
    logger,
    registries: new AppRegistries(),
    startedAt: new Date(),
  };
}
