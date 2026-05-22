import type { FeatureModule } from "@bot/core";
import { debugCommand } from "./commands/debug.command";
import { guildCreateEvent } from "./events/guild-create.event";
import { readyEvent } from "./events/ready.event";

/** Core lifecycle feature. Keep bot-wide diagnostics here instead of mixing them into examples. */
export const systemFeature: FeatureModule = {
  commands: [debugCommand],
  description: "Core bot lifecycle and diagnostics.",
  events: [readyEvent, guildCreateEvent],
  name: "system",
};
