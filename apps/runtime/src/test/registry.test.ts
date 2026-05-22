import { expect, test } from "bun:test";
import { AppRegistries, type FeatureModule } from "@bot/core";
import { SlashCommandBuilder } from "discord.js";

test("detects command collisions", () => {
  const registries = new AppRegistries();
  const feature: FeatureModule = {
    commands: [
      {
        data: new SlashCommandBuilder().setName("ping").setDescription("Ping."),
        execute: async () => {},
      },
      {
        data: new SlashCommandBuilder().setName("ping").setDescription("Ping again."),
        execute: async () => {},
      },
    ],
    description: "Collision fixture.",
    name: "fixture",
  };

  expect(() => registries.registerFeature(feature)).toThrow("already registered");
});

test("detects component route collisions", () => {
  const registries = new AppRegistries();
  const feature: FeatureModule = {
    components: [
      {
        route: { action: "open", feature: "fixture", scope: "button" },
        execute: async () => {},
      },
      {
        route: { action: "open", feature: "fixture", scope: "button" },
        execute: async () => {},
      },
    ],
    description: "Collision fixture.",
    name: "fixture",
  };

  expect(() => registries.registerFeature(feature)).toThrow("already registered");
});
