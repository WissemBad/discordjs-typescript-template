import { ephemeral, type ModalDefinition } from "@bot/core";

export const demoModal: ModalDefinition = {
  route: { action: "submit", feature: "examples", scope: "modal" },
  execute: async (_ctx, interaction) => {
    const message = interaction.fields.getTextInputValue("message").trim();

    if (message.length < 3) {
      await interaction.reply(
        ephemeral({ content: "Message must contain at least 3 characters." }),
      );
      return;
    }

    await interaction.reply(
      ephemeral({
        content: `Modal submitted successfully: ${message}`,
      }),
    );
  },
};
