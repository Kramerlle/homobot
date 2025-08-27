const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const config = require("../../../config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("suggestfeature")
    .setDescription("Schlage neue Befehle oder anderes für den HomoBot vor")
    .addStringOption((option) =>
      option
        .setName("feature")
        .setDescription("Schlag was vor")
        .setRequired(true)
    ),
  async execute(interaction, client) {
    if (interaction.user.id == config.blacklist) {
      await interaction.reply({
        content: "Du hast Auszeit mein Freundchen...",
        ephemeral: true,
      });
      return;
    }

    let today = new Date();
    let day = today.getDate();
    let month = today.getMonth() + 1;
    let year = today.getFullYear().toString().substr(-2);
    month = month < 10 ? "0" + month : month;
    let formattedDate = `${day}.${month}.${year}`;

    const feature = interaction.options.getString("feature");
    fs.appendFile(
      "featureSuggestions.txt",
      formattedDate +
        " | " +
        interaction.user.tag +
        " (" +
        interaction.user.id +
        "): " +
        feature +
        "\n",
      function (err) {
        if (err) throw err;
      }
    );

    await interaction.reply({
      content: "Danke für deinen hoffentlich wertvollen Beitrag <3",
      ephemeral: true,
    });
  },
};
