import { type CommandDefinition, ephemeral } from "@bot/core";
import { SlashCommandBuilder } from "discord.js";

export const pingCommand: CommandDefinition = {
  data: new SlashCommandBuilder().setName("ping").setDescription("Check bot latency."),
  persistLog: true,
  execute: async (_ctx, interaction) => {
    await interaction.reply(
      ephemeral({
        content: `Pong. Gateway latency: ${interaction.client.ws.ping}ms`,
      }),
    );
  },
};
