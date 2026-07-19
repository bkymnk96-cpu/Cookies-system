const keyValueService = require('../services/keyValueService');
const DEFAULT_CONFIG = { enabled: false, ranks: [], managers: [], logChannelId: null, notifyAtMax: true };
async function getAdminConfig(guildId) { return { ...DEFAULT_CONFIG, ...((await keyValueService.get('systemDB', `admin_points_config_${guildId}`)) || {}) }; }
async function saveAdminConfig(guildId, patch) { const next = { ...(await getAdminConfig(guildId)), ...patch }; await keyValueService.set('systemDB', `admin_points_config_${guildId}`, next); return next; }
async function getPoints(guildId) { return (await keyValueService.get('systemDB', `admin_points_${guildId}`)) || {}; }
async function setPoints(guildId, points) { await keyValueService.set('systemDB', `admin_points_${guildId}`, points); return points; }
function nextRank(config, total) { return [...config.ranks].sort((a,b)=>a.points-b.points).find((rank)=>total >= rank.points); }
module.exports = { getAdminConfig, saveAdminConfig, getPoints, setPoints, nextRank };
