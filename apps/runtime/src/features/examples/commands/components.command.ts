import { type CommandDefinition, ephemeral, formatCustomId } from "@bot/core";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  ContainerBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  MentionableSelectMenuBuilder,
  MessageFlags,
  RoleSelectMenuBuilder,
  SectionBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
  UserSelectMenuBuilder,
} from "discord.js";
import { exampleIds } from "../components/ids";
import { createExampleEmbed, touchGuildConfig } from "../services/example.service";

/** Demonstrates classic components, select menus, modals and Components V2 in one command. */
export const componentsCommand: CommandDefinition = {
  data: new SlashCommandBuilder()
    .setName("components")
    .setDescription("Show modern Discord component examples."),
  persistLog: true,
  execute: async (ctx, interaction) => {
    const prefix = interaction.guildId ? await touchGuildConfig(ctx, interaction.guildId) : null;

    const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(exampleIds.button)
        .setLabel("Open modal")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setLabel("discord.js docs")
        .setStyle(ButtonStyle.Link)
        .setURL("https://discord.js.org/docs/packages/discord.js/14.26.4"),
    );

    const stringSelectRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(exampleIds.select)
        .setPlaceholder("Choose an example")
        .addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel("Embeds")
            .setDescription("Classic EmbedBuilder example.")
            .setValue("embeds"),
          new StringSelectMenuOptionBuilder()
            .setLabel("Components V2")
            .setDescription("Container and display components.")
            .setValue("components-v2"),
        ),
    );

    await interaction.reply(
      ephemeral({
        components: [buttonRow, stringSelectRow],
        embeds: [createExampleEmbed(ctx)],
        content: `Classic components and embed example. Stored guild prefix: ${prefix ?? "n/a"}`,
      }),
    );

    await interaction.followUp(
      ephemeral({
        components: [
          new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(
            new UserSelectMenuBuilder()
              .setCustomId(selectCustomId("user"))
              .setPlaceholder("Pick a user"),
          ),
          new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
            new RoleSelectMenuBuilder()
              .setCustomId(selectCustomId("role"))
              .setPlaceholder("Pick a role"),
          ),
          new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
            new ChannelSelectMenuBuilder()
              .setCustomId(selectCustomId("channel"))
              .setPlaceholder("Pick a channel"),
          ),
          new ActionRowBuilder<MentionableSelectMenuBuilder>().addComponents(
            new MentionableSelectMenuBuilder()
              .setCustomId(selectCustomId("mentionable"))
              .setPlaceholder("Pick anything mentionable"),
          ),
        ],
        content: "Additional select menu examples.",
      }),
    );

    await interaction.followUp({
      components: [createComponentsV2Demo()],
      flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    });
  },
};

function createComponentsV2Demo(): ContainerBuilder {
  return new ContainerBuilder()
    .setAccentColor(0x2f855a)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        "## Components V2\nThis message uses display components.",
      ),
    )
    .addSeparatorComponents(
      new SeparatorBuilder().setDivider(true).setSpacing(SeparatorSpacingSize.Small),
    )
    .addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(
            "Sections can combine text displays with an accessory, such as a thumbnail.",
          ),
        )
        .setThumbnailAccessory(
          new ThumbnailBuilder()
            .setDescription("discord.js logo")
            .setURL("https://discord.js.org/favicon.ico"),
        ),
    )
    .addMediaGalleryComponents(
      new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder()
          .setDescription("Discord developer documentation")
          .setURL("https://discord.com/assets/847541504914fd33810e70a0ea73177e.ico"),
      ),
    )
    .addActionRowComponents(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(exampleIds.button)
          .setLabel("V2 button")
          .setStyle(ButtonStyle.Secondary),
      ),
    );
}

/** Dynamic select ids keep one handler route while preserving the selected component kind. */
function selectCustomId(id: string): string {
  return formatCustomId({
    action: "choose",
    feature: "examples",
    id,
    scope: "select",
  });
}
