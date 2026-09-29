const { createReadStream } = require("node:fs");
const {
  AudioPlayerStatus,
  NoSubscriberBehavior,
  VoiceConnectionStatus,
  createAudioPlayer,
  createAudioResource,
  entersState,
  getVoiceConnection,
  joinVoiceChannel,
  StreamType,
} = require("@discordjs/voice");
const { introPath } = require("./introStore");

const queues = new Map();
const players = new Map();

const getPlayer = (guildId) => {
  if (!players.has(guildId)) {
    const player = createAudioPlayer({
      behaviors: { noSubscriber: NoSubscriberBehavior.Play },
    });
    player.on("error", (error) => console.error(`Intro error: ${error.message}`));
    players.set(guildId, player);
  }
  return players.get(guildId);
};

// Verbindet sich mit dem Channel, falls der Bot nicht schon drin ist.
// Ist er schon drin, bleibt die bestehende Verbindung einfach bestehen.
const connectTo = async (channel) => {
  let connection = getVoiceConnection(channel.guild.id);
  if (
    !connection ||
    connection.state.status !== VoiceConnectionStatus.Ready ||
    connection.joinConfig.channelId !== channel.id
  ) {
    // Baut eine neue Verbindung auf bzw. verschiebt/reconnectet die bestehende
    connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
    });
  }
  await entersState(connection, VoiceConnectionStatus.Ready, 15_000);
  return connection;
};

const playNext = async (guildId) => {
  const queue = queues.get(guildId);
  const next = queue?.shift();
  if (!next) {
    queues.delete(guildId);
    return;
  }

  try {
    // Ist der User noch da, wo er gejoint ist?
    if (next.member.voice.channelId === next.channel.id) {
      const connection = await connectTo(next.channel);
      const player = getPlayer(guildId);
      connection.subscribe(player);

      player.play(
        createAudioResource(createReadStream(introPath(next.member.id)), {
          inputType: StreamType.OggOpus,
        })
      );
      await entersState(player, AudioPlayerStatus.Playing, 5_000);
      await entersState(player, AudioPlayerStatus.Idle, 30_000);
    }
  } catch (error) {
    console.error(`Intro für ${next.member.user.tag} fehlgeschlagen: ${error.message}`);
    getPlayer(guildId).stop(true);
  }

  playNext(guildId);
};

const queueIntro = (member, channel) => {
  const guildId = channel.guild.id;
  const queue = queues.get(guildId);
  if (queue) {
    // Mehrfaches Joinen/Leaven spammt die Queue nicht voll
    if (!queue.some((item) => item.member.id === member.id))
      queue.push({ member, channel });
    return;
  }
  queues.set(guildId, [{ member, channel }]);
  playNext(guildId);
};

module.exports = { queueIntro };
