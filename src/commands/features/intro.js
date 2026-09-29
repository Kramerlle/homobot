const { SlashCommandBuilder, AttachmentBuilder } = require("discord.js");
const config = require("../../../config.json");
const {
  introPath,
  hasIntro,
  removeIntro,
  saveIntro,
  maxSeconds,
} = require("../../intro/introStore");

const maxFileSize = 10 * 1024 * 1024;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("intro")
    .setDescription("Deine Intro-Musik, wenn du einen Voice-Channel betrittst")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("hochladen")
        .setDescription(`Lade deine Intro-Musik hoch (max. ${maxSeconds} Sekunden werden gespielt)`)
        .addAttachmentOption((option) =>
          option
            .setName("datei")
            .setDescription("Audiodatei (mp3, ogg, wav, m4a, ...)")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("anhören").setDescription("Hör dir dein aktuelles Intro an")
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("entfernen").setDescription("Lösche dein Intro")
    ),
  async execute(interaction, client) {
    if (interaction.user.id == config.blacklist) {
      await interaction.reply({
        content: "Du hast Auszeit mein Freundchen...",
        ephemeral: true,
      });
      return;
    }

    const userId = interaction.user.id;

    switch (interaction.options.getSubcommand()) {
      case "hochladen": {
        const attachment = interaction.options.getAttachment("datei");
        const isMedia =
          attachment.contentType?.startsWith("audio/") ||
          attachment.contentType?.startsWith("video/");
        if (!isMedia) {
          await interaction.reply({
            content: "Das ist keine Audiodatei du kek",
            ephemeral: true,
          });
          return;
        }
        if (attachment.size > maxFileSize) {
          await interaction.reply({
            content: "Die Datei ist zu groß (max. 10 MB)",
            ephemeral: true,
          });
          return;
        }

        await interaction.deferReply({ ephemeral: true });
        try {
          const response = await fetch(attachment.url);
          if (!response.ok) throw new Error(`Download failed: ${response.status}`);
          const buffer = Buffer.from(await response.arrayBuffer());
          await saveIntro(userId, buffer);
          await interaction.editReply(
            `Intro gespeichert! Ab jetzt wirst du beim Joinen gebührend angekündigt (max. ${maxSeconds} Sekunden).`
          );
        } catch (error) {
          console.error(error);
          await interaction.editReply(
            "Konnte die Datei nicht verarbeiten. Ist das wirklich Audio?"
          );
        }
        break;
      }

      case "anhören": {
        if (!hasIntro(userId)) {
          await interaction.reply({
            content: "Du hast noch kein Intro. Lade eins mit `/intro hochladen` hoch.",
            ephemeral: true,
          });
          return;
        }
        await interaction.reply({
          content: "Dein aktuelles Intro:",
          files: [new AttachmentBuilder(introPath(userId), { name: "intro.ogg" })],
          ephemeral: true,
        });
        break;
      }

      case "entfernen": {
        const removed = removeIntro(userId);
        await interaction.reply({
          content: removed ? "Intro gelöscht." : "Du hattest gar kein Intro.",
          ephemeral: true,
        });
        break;
      }
    }
  },
};
