import type { AppContext } from "@bot/core";
import { EmbedBuilder } from "discord.js";

/** Shared embed factory for the example feature. Copy this pattern for feature-specific branding. */
export function createExampleEmbed(ctx: AppContext): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(0x2f855a)
    .setTitle("Discord Bot Template")
    .setDescription("A feature-first example using commands, components, modals and Prisma.")
    .setFooter({ text: `Guilds: ${ctx.client.guilds.cache.size}` })
    .setTimestamp();
}

/** Small Prisma-backed service used by the examples without exposing Prisma to commands. */
export async function touchGuildConfig(ctx: AppContext, guildId: string): Promise<string | null> {
  const config = await ctx.database.repositories.guildConfigs.findByGuildId(guildId);
  if (!config) {
    await ctx.database.repositories.guildConfigs.upsertPrefix(guildId, "!");
    return "!";
  }

  return config.prefix;
}
