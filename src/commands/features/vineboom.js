const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
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
    .setName("vineboom")
    .setDescription("BOOM")
    .addUserOption((option) =>
      option
        .setName("ziel")
        .setDescription("BOOME jemaden weg")
    )
    .addBooleanOption((option) =>
      option
        .setName("warte")
        .setDescription("Mach es spannend...")
    ),
  async execute(interaction, client) {
    if(interaction.user.id == config.blacklist){
      await interaction.reply({
        content: "Du hast Auszeit mein Freundchen...",
        ephemeral: true,
      });
      return;
    }
    const target = interaction.options.getMember("ziel") ?? interaction.member;
    const random = interaction.options.getBoolean("warte");
    if(target !== interaction.member && !interaction.member.roles.cache.has(config.otherOutroRole)){
      await interaction.reply({
        content: "Hast keine Rechte dafür du kek",
        ephemeral: true,
      });
    }else{
      const voiceChannelId = target.voice.channelId;
      if (voiceChannelId == null) {
        await interaction.reply({
          content: "Der GEBOOMTE ist nicht in einem VC",
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: "BOOM incoming",
          ephemeral: true,
        });

        const voiceChannel = client.channels.cache.get(voiceChannelId);
        const guildId = config.guildId;

        const player = createAudioPlayer();

        const resource = createAudioResource(
          createReadStream(join("src/audio", "vineboom.ogg"), {
            inputType: StreamType.OggOpus,
          })
        );

        const connection = joinVoiceChannel({
          channelId: voiceChannelId,
          guildId: guildId,
          adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        });

        let randomTime = 0;
        if(random) randomTime = Math.floor((Math.random() * 30) + 10) * 1000;

        console.log(randomTime);
        setTimeout(() => player.play(resource), randomTime);

        player.on(AudioPlayerStatus.Playing, () => {
          console.log("The audio player has started playing");
        });

        player.on("error", (error) => {
          console.error(`Error: ${error.message}`);
        });

        const subscription = connection.subscribe(player);

        player.on(AudioPlayerStatus.Idle, () => {
          subscription.unsubscribe();
          player.stop();
          connection.destroy();
        });
      }
    }
  },
};
