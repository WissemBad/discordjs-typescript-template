CREATE TABLE "GuildConfig" (
  "guildId" TEXT NOT NULL PRIMARY KEY,
  "prefix" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "CommandLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "commandName" TEXT NOT NULL,
  "guildId" TEXT,
  "userId" TEXT NOT NULL,
  "success" BOOLEAN NOT NULL,
  "errorMessage" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "FeatureFlag" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "guildId" TEXT NOT NULL,
  "featureName" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "BotSetting" (
  "key" TEXT NOT NULL PRIMARY KEY,
  "value" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE INDEX "CommandLog_commandName_idx" ON "CommandLog"("commandName");
CREATE INDEX "CommandLog_guildId_idx" ON "CommandLog"("guildId");
CREATE INDEX "CommandLog_createdAt_idx" ON "CommandLog"("createdAt");
CREATE UNIQUE INDEX "FeatureFlag_guildId_featureName_key" ON "FeatureFlag"("guildId", "featureName");
CREATE INDEX "FeatureFlag_guildId_idx" ON "FeatureFlag"("guildId");
