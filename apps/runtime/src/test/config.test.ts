import { expect, test } from "bun:test";
import { loadConfig } from "@bot/config";

const validEnv = {
  API_KEY: "1234567890123456",
  API_PORT: "3000",
  DATABASE_URL: "file:./dev.db",
  DISCORD_CLIENT_ID: "client-id",
  DISCORD_TOKEN: "token",
  LOG_LEVEL: "debug",
  NODE_ENV: "test",
};

test("loads valid config", () => {
  expect(loadConfig({ env: validEnv }).nodeEnv).toBe("test");
});

test("requires guild id only when requested", () => {
  expect(() => loadConfig({ env: validEnv, requireGuildId: true })).toThrow("DISCORD_GUILD_ID");
});

test("fails fast on invalid env", () => {
  expect(() => loadConfig({ env: {} })).toThrow("Invalid environment configuration");
});
