const { SlashCommandBuilder } = require("discord.js");
require("dotenv").config();
const changelog = require("../../../changelog.json");
const config = require("../../../config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("changelog")
    .setDescription("Zeige Änderungen/Updates"),
  async execute(interaction, client) {
    if(interaction.user.id == config.blacklist){
      await interaction.reply({
        content: "Du hast Auszeit mein Freundchen...",
        ephemeral: true,
      });
      return;
    }
    const fields = changelog.map((item, index) => ({
        name: changelog[changelog.length - 1 - index].date,
        value: "_" + changelog[changelog.length - 1 - index].content + "_",
      }));

    const embed = {
      title: "Changelog",
      type: "rich",
      color: 0xe14d42,
      description: "\u200b",
      fields: fields,
    };

    await interaction.reply({ embeds: [embed] });
  },
};
