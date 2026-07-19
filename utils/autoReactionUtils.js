const keyValueService = require('../services/keyValueService');

async function getReactionConfigs(guildId) {
  return (await keyValueService.get('systemDB', `auto_reactions_${guildId}`)) || [];
}
async function saveReactionConfigs(guildId, configs) {
  return keyValueService.set('systemDB', `auto_reactions_${guildId}`, configs);
}
async function handleAutoReactions(message) {
  if (!message.guild || message.author.bot) return;
  const configs = await getReactionConfigs(message.guild.id);
  const config = configs.find((item) => item.channelId === message.channel.id && item.enabled !== false);
  if (!config) return;
  for (const emoji of config.emojis.slice(0, 20)) {
    await message.react(emoji).catch(() => null);
  }
}
module.exports = { getReactionConfigs, saveReactionConfigs, handleAutoReactions };
