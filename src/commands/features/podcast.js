const { SlashCommandBuilder } = require("discord.js");
const { createReadStream } = require("node:fs");
const { join } = require("node:path");
const {
  AudioPlayerStatus,
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  StreamType,
} = require("@discordjs/voice");
const config = require("../../../config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("podcast")
    .setDescription("Höre die Weisheiten vom weisen (Achtung 2-mal Wortspiel) Meister"),
  async execute(interaction, client) {
    if(interaction.user.id == config.blacklist){
      await interaction.reply({
        content: "Du hast Auszeit mein Freundchen...",
        ephemeral: true,
      });
      return;
    }
    const voiceChannelId = interaction.member.voice.channelId;
    if (voiceChannelId == null) {
      await interaction.reply({
        content: "Du musst in einem VC sein, um dich zu beweisen (Auchtung noch ein Wortspiel)",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "Du wirst nun bergeweise (WORTSPIEL) Wahrheiten hören",
        ephemeral: true,
      });

      const voiceChannel = client.channels.cache.get(voiceChannelId);
      const guildId = config.guildId;

      const player = createAudioPlayer();

      const resource = createAudioResource(
        createReadStream(
          join(
            "src/audio",
            "podcast.ogg"
          ),
          {
            inputType: StreamType.OggOpus,
          }
        )
      );
      player.play(resource);

      const connection = joinVoiceChannel({
        channelId: voiceChannelId,
        guildId: guildId,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
      });

      player.on(AudioPlayerStatus.Playing, () => {
        console.log("The audio player has started playing");
      });

      player.on("error", (error) => {
        console.error(
          `Error: ${error.message}`
        );
      });

      const subscription = connection.subscribe(player);

      player.on(AudioPlayerStatus.Idle, () => {
        subscription.unsubscribe();
        player.stop();
        connection.destroy();
      });
    }
  },
};
