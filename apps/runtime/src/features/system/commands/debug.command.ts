import { type CommandDefinition, ephemeral, guards } from "@bot/core";
import { SlashCommandBuilder } from "discord.js";

/** Admin diagnostics command. Add operational subcommands here, not in feature examples. */
export const debugCommand: CommandDefinition = {
  data: new SlashCommandBuilder()
    .setName("debug")
    .setDescription("Inspect bot diagnostics.")
    .addSubcommand((subcommand) =>
      subcommand.setName("features").setDescription("List feature flags for this server."),
    ),
  guards: [guards.guildOnly(), guards.adminOnly()],
  persistLog: true,
  execute: async (ctx, interaction) => {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "features") {
      const guildId = interaction.guildId;
      if (!guildId) {
        await interaction.reply(ephemeral({ content: "This command can only run in a server." }));
        return;
      }

      const flags = await ctx.database.repositories.featureFlags.listForGuild(guildId);
      const knownFeatures = [...ctx.registries.features.keys()];
      const lines = knownFeatures.map((featureName) => {
        const flag = flags.find((item) => item.featureName === featureName);
        return `- ${featureName}: ${flag?.enabled === false ? "disabled" : "enabled"}`;
      });

      await interaction.reply(
        ephemeral({
          content: lines.length > 0 ? lines.join("\n") : "No features are registered.",
        }),
      );
    }
  },
};
