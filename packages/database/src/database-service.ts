import type { Database, GuildFeatureFlag } from "@bot/core";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "./generated/prisma/client";

export class DatabaseService implements Database {
  readonly client: PrismaClient;
  readonly repositories: Database["repositories"];

  constructor(databaseUrl: string) {
    const adapter = new PrismaLibSql({ url: databaseUrl });
    this.client = new PrismaClient({ adapter });
    this.repositories = {
      botSettings: {
        get: async (key) => {
          const setting = await this.client.botSetting.findUnique({ where: { key } });
          return setting?.value ?? null;
        },
        set: async (key, value) => {
          await this.client.botSetting.upsert({
            create: { key, value },
            update: { value },
            where: { key },
          });
        },
      },
      commandLogs: {
        create: async (input) => {
          await this.client.commandLog.create({ data: input });
        },
      },
      featureFlags: {
        isEnabled: async (guildId, featureName) => {
          const flag = await this.client.featureFlag.findUnique({
            where: { guildId_featureName: { featureName, guildId } },
          });
          return flag?.enabled ?? true;
        },
        listForGuild: async (guildId) => {
          const flags = await this.client.featureFlag.findMany({
            orderBy: { featureName: "asc" },
            where: { guildId },
          });
          return flags.map(toGuildFeatureFlag);
        },
        setEnabled: async (guildId, featureName, enabled) => {
          const flag = await this.client.featureFlag.upsert({
            create: { enabled, featureName, guildId },
            update: { enabled },
            where: { guildId_featureName: { featureName, guildId } },
          });
          return toGuildFeatureFlag(flag);
        },
      },
      guildConfigs: {
        findByGuildId: async (guildId) => {
          return this.client.guildConfig.findUnique({ where: { guildId } });
        },
        upsertPrefix: async (guildId, prefix) => {
          await this.client.guildConfig.upsert({
            create: { guildId, prefix },
            update: { prefix },
            where: { guildId },
          });
        },
      },
    };
  }

  async connect(): Promise<void> {
    await this.client.$connect();
  }

  async disconnect(): Promise<void> {
    await this.client.$disconnect();
  }
}

function toGuildFeatureFlag(flag: {
  enabled: boolean;
  featureName: string;
  guildId: string;
}): GuildFeatureFlag {
  return {
    enabled: flag.enabled,
    featureName: flag.featureName,
    guildId: flag.guildId,
  };
}
