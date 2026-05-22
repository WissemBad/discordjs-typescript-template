import type { DiscordEventDefinition } from "@bot/core";
import { Events } from "discord.js";

export const readyEvent: DiscordEventDefinition<typeof Events.ClientReady> = {
  name: Events.ClientReady,
  once: true,
  execute: (ctx) => {
    ctx.logger.info(
      {
        guildCount: ctx.client.guilds.cache.size,
        user: ctx.client.user?.tag,
      },
      "Discord client is ready",
    );
  },
};
