let client = null;
function registerClient(discordClient) { client = discordClient; }
function getClient() { return client; }
function invalidateGuildConfig(guildId) { if (client) client.emit('zeus:dashboardConfigChanged', guildId); }
module.exports = { registerClient, getClient, invalidateGuildConfig };
