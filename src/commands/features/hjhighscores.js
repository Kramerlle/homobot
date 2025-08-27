const { SlashCommandBuilder } = require("discord.js");
require("dotenv").config();
const config = require("../../../config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("hjhighscores")
    .setDescription("Zeige die Top 10 von High Jump (Max Handyspiel)"),
  async execute(interaction, client) {
    if (interaction.user.id == config.blacklist) {
      await interaction.reply({
        content: "Du hast Auszeit mein Freundchen...",
        ephemeral: true,
      });
      return;
    }

    let fields;
    await fetch("http://dreamlo.com/lb/640e380f8f42037680b1228b/json/10")
      .then((response) => response.json())
      .then((data) => {
        let counter = 1;
        fields = data.dreamlo.leaderboard.entry.map((entry) => {
          const prefix = `${counter}. `;
          counter++;
          return {
            name: prefix + entry.name.slice(0, -3),
            value:
              "**" +
              entry.score +
              "** - _" +
              convertDateFormat(entry.date, 120) +
              "_",
          };
        });
      })
      .catch((error) => {
        console.error("Error fetching JSON: ", error);
      });

    function convertDateFormat(dateStr, timezoneOffset) {
      const date = new Date(dateStr);

      const day = date.getUTCDate().toString().padStart(2, "0");
      const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
      const year = date.getUTCFullYear();
      const hours = (date.getUTCHours() + timezoneOffset / 60)
        .toString()
        .padStart(2, "0");
      const minutes = date.getUTCMinutes().toString().padStart(2, "0");
      const seconds = date.getUTCSeconds().toString().padStart(2, "0");

      const newDateStr = `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;

      return newDateStr;
    }

    const embed = {
      title: "High Jump Highscores",
      type: "rich",
      color: 0xc63dfd,
      description: "\u200b",
      fields: fields,
    };

    await interaction.reply({ embeds: [embed] });
  },
};
