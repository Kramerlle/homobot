const config = require("../../../config.json");
const { hasIntro } = require("../../intro/introStore");
const { queueIntro } = require("../../intro/introPlayer");

module.exports = {
  name: "voiceStateUpdate",
  async execute(oldState, newState, client) {
    const member = newState.member;
    if (!member || member.user.bot) return;
    if (member.id == config.blacklist) return;
    // Nur echtes Joinen bzw. Channel-Wechsel, kein Muten/Deafen usw.
    if (!newState.channelId || oldState.channelId === newState.channelId) return;
    if (newState.channelId === newState.guild.afkChannelId) return;
    if (!hasIntro(member.id)) return;

    queueIntro(member, newState.channel);
  },
};
