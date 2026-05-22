import { ephemeral, type SelectMenuDefinition } from "@bot/core";

export const demoSelectComponent: SelectMenuDefinition = {
  route: { action: "choose", feature: "examples", scope: "select" },
  execute: async (_ctx, interaction, customId) => {
    const selectedValues =
      "values" in interaction ? interaction.values.join(", ") : (customId.id ?? "none");

    await interaction.reply(
      ephemeral({
        content: `Select handled by ${customId.feature}:${customId.scope}:${customId.action}. Value: ${selectedValues}`,
      }),
    );
  },
};
