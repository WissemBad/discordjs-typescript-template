import { expect, test } from "bun:test";
import {
  type AppContext,
  AppRegistries,
  EventBus,
  type FeatureModule,
  loadFeatures,
} from "@bot/core";

test("loads features and runs setup", async () => {
  let setupCalled = false;
  const registries = new AppRegistries();
  const feature: FeatureModule = {
    description: "Fixture.",
    name: "fixture",
    setup: () => {
      setupCalled = true;
    },
  };

  await loadFeatures(
    {
      client: {} as AppContext["client"],
      config: {
        apiKey: "1234567890123456",
        apiPort: 3000,
        databaseUrl: "file:./dev.db",
        discordClientId: "client-id",
        discordToken: "token",
        logLevel: "silent",
        nodeEnv: "test",
      },
      database: {} as AppContext["database"],
      eventBus: new EventBus(),
      logger: {
        child: () => {
          throw new Error("Not used in this test.");
        },
        debug: () => {},
        error: () => {},
        info: () => {},
        warn: () => {},
      },
      registries,
      startedAt: new Date(),
    },
    [feature],
  );

  expect(setupCalled).toBe(true);
  expect(registries.features.has("fixture")).toBe(true);
});
