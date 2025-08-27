const { SlashCommandBuilder } = require("discord.js");
require("dotenv").config();
const config = require("../../../config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("homozitat")
    .setDescription("Lasse dich erleuchten"),
  async execute(interaction, client) {
    if(interaction.user.id == config.blacklist){
      await interaction.reply({
        content: "Du hast Auszeit mein Freundchen...",
        ephemeral: true,
      });
      return;
    }
    async function fetchAllMessages() {
      const channel = client.channels.cache.get(config.quoteChannel);
      let messages = [];

      // Create message pointer
      let message = await channel.messages.fetch({ limit: 1, after: "0" });

      while (message) {
        await channel.messages
          .fetch({ limit: 100, before: message.id })
          .then((messagePage) => {
            messagePage.forEach((msg) => messages.push(msg));

            // Update our message pointer to be last message in page of messages
            message =
              0 < messagePage.size
                ? messagePage.at(messagePage.size - 1)
                : null;
          });
      }

      const contentsRaw = messages.map((object) => object.content);
      const contents = contentsRaw.filter((elem) => {
        return elem !== "";
      });
      return contents;
    }

    const allMessages = await fetchAllMessages();
    const randomIndex = Math.floor(Math.random() * allMessages.length);
    const randomMessage = allMessages[randomIndex];

    await interaction.reply({
      content: randomMessage,
      ephemeral: false,
    });
   },
};
