import { type ComponentDefinition, ephemeral } from "@bot/core";
import {
  ActionRowBuilder,
  type ModalActionRowComponentBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { exampleIds } from "./ids";

export const demoButtonComponent: ComponentDefinition = {
  route: { action: "open", feature: "examples", scope: "button" },
  execute: async (_ctx, interaction) => {
    if (!interaction.customId.startsWith(exampleIds.button)) {
      await interaction.reply(ephemeral({ content: "Unknown button action." }));
      return;
    }

    const modal = new ModalBuilder()
      .setCustomId(exampleIds.modal)
      .setTitle("Template modal")
      .addComponents(
        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
          new TextInputBuilder()
            .setCustomId("message")
            .setLabel("Message")
            .setMaxLength(200)
            .setMinLength(3)
            .setRequired(true)
            .setStyle(TextInputStyle.Paragraph),
        ),
      );

    await interaction.showModal(modal);
  },
};
