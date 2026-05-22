import type { DiscordEventDefinition } from "@bot/core";
import { Events, type Guild } from "discord.js";

export const guildCreateEvent: DiscordEventDefinition<typeof Events.GuildCreate> = {
  name: Events.GuildCreate,
  execute: (ctx, guild) => {
    const joinedGuild = guild as Guild;
    ctx.logger.info(
      {
        guildId: joinedGuild.id,
        guildName: joinedGuild.name,
      },
      "Joined a new guild",
    );
  },
};
