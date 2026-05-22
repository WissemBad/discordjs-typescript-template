import { type CommandDefinition, ephemeral } from "@bot/core";
import { SlashCommandBuilder } from "discord.js";

export const echoCommand: CommandDefinition = {
  data: new SlashCommandBuilder()
    .setName("echo")
    .setDescription("Echo a message.")
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("Message to echo.")
        .setMaxLength(500)
        .setRequired(true),
    ),
  persistLog: true,
  execute: async (_ctx, interaction) => {
    await interaction.reply(
      ephemeral({
        content: interaction.options.getString("message", true),
      }),
    );
  },
};
