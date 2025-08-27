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
const cooldowns = new Map();
const cooldownTime = config.outroCooldown * 1000;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("outro")
    .setDescription("Spiele ein Outro vor dem gehen")
    .addUserOption((option) =>
      option.setName("ziel").setDescription("Verabschiede jemand anderen")
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
    if (
      target !== interaction.member &&
      !interaction.member.roles.cache.has(config.otherOutroRole)
    ) {
      await interaction.reply({
        content: "Hast keine Rechte dafür du kek",
        ephemeral: true,
      });
    } else {
      if (cooldowns.has(interaction.user.id)) {
        const remainingTime = cooldowns.get(interaction.user.id) - Date.now();
        const remainingSeconds = Math.ceil(remainingTime / 1000);
        
        await interaction.reply({
          content: `Warte noch ${remainingSeconds} Sekunden. (Sonst kicked mich Lennart)`,
          ephemeral: true,
        });
      } else {
        const voiceChannelId = target.voice.channelId;
        if (voiceChannelId == null) {
          await interaction.reply({
            content: "Der, der uns verlassen wird, ist nicht in einem VC",
            ephemeral: true,
          });
        } else {
          await interaction.reply({
            content: "Hier kommt die Verabschiedung ...",
            ephemeral: true,
          });

          const voiceChannel = client.channels.cache.get(voiceChannelId);
          const guildId = config.guildId;

          const player = createAudioPlayer();

          const resource = createAudioResource(
            createReadStream(join("src/audio", "outro.ogg"), {
              inputType: StreamType.OggOpus,
            })
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
            console.error(`Error: ${error.message}`);
          });

          const subscription = connection.subscribe(player);
          if (subscription) {
            setTimeout(() => target.voice.disconnect(), 26_470);
          }

          player.on(AudioPlayerStatus.Idle, () => {
            subscription.unsubscribe();
            player.stop();
            connection.destroy();
          });

          cooldowns.set(interaction.user.id, Date.now() + cooldownTime);
          setTimeout(() => {
            cooldowns.delete(interaction.user.id);
          }, cooldownTime);
        }
      }
    }
  },
};
