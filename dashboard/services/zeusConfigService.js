const fs = require('fs');
const path = require('path');
const keyValueService = require('../../services/keyValueService');
const { getGuildShortcuts, saveGuildShortcuts } = require('../../utils/shortcutUtils');
const { getWelcomeConfig, saveWelcomeConfig, DEFAULT_WELCOME } = require('../../utils/welcomeUtils');
const { getGuildReplies, saveGuildReplies } = require('../../utils/autoReplyUtils');
const { getTextScores, getVoiceScores, getTopEntries } = require('../../utils/activityUtils');
const { getAdminConfig, saveAdminConfig, getPoints, setPoints } = require('../../utils/adminPointsUtils');

const ROOT = path.join(__dirname, '..', '..');
const COMMAND_ROOT = path.join(ROOT, 'slashcommand27');

const KV = {
  tickets: 'ticketDB', applications: 'applyDB', suggestions: 'suggestionsDB', feedback: 'feedbackDB',
  giveaways: 'giveawayDB', autoline: 'autolineDB', tax: 'taxDB', logs: 'logsDB', protect: 'protectDB',
  broadcast: 'BroadcastDB', system: 'systemDB'
};

function listCommandFiles(dir = COMMAND_ROOT) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listCommandFiles(full);
    return entry.isFile() && entry.name.endsWith('.js') ? [full] : [];
  });
}

function readCommandCatalog() {
  return listCommandFiles().map((file) => {
    delete require.cache[require.resolve(file)];
    const mod = require(file);
    const json = mod.data?.toJSON?.() || {};
    const category = path.basename(path.dirname(file));
    return {
      name: json.name || path.basename(file, '.js'), description: json.description || 'No description available.',
      category, options: json.options || [], file: path.relative(ROOT, file), ownersOnly: Boolean(mod.ownersOnly), adminsOnly: Boolean(mod.adminsOnly)
    };
  }).sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
}

function defaultsForCommand(command) {
  return { enabled: true, aliases: [], cooldown: 0, allowedRoles: [], deniedRoles: [], allowedChannels: [], deniedChannels: [], extras: {}, ...command };
}

async function getCommandSettings(guildId) {
  const stored = await keyValueService.get(KV.system, `command_settings_${guildId}`) || {};
  const shortcuts = await getGuildShortcuts(guildId);
  return readCommandCatalog().map((command) => defaultsForCommand({
    ...command,
    ...(stored[command.name] || {}),
    aliases: Array.from(new Set([...(stored[command.name]?.aliases || []), ...(shortcuts[command.name] ? [shortcuts[command.name]] : [])]))
  }));
}

async function saveCommandSettings(guildId, commands) {
  const catalog = new Map(readCommandCatalog().map((c) => [c.name, c]));
  const next = {};
  const shortcuts = {};
  for (const item of Array.isArray(commands) ? commands : []) {
    if (!catalog.has(item.name)) continue;
    const aliases = Array.isArray(item.aliases) ? item.aliases.map(String).map((v) => v.trim()).filter(Boolean).slice(0, 10) : [];
    next[item.name] = defaultsForCommand({
      enabled: item.enabled !== false, aliases, cooldown: Math.max(0, Number(item.cooldown) || 0),
      allowedRoles: cleanIdList(item.allowedRoles), deniedRoles: cleanIdList(item.deniedRoles),
      allowedChannels: cleanIdList(item.allowedChannels), deniedChannels: cleanIdList(item.deniedChannels), extras: item.extras || {}
    });
    if (aliases[0]) shortcuts[item.name] = aliases[0];
  }
  await keyValueService.set(KV.system, `command_settings_${guildId}`, next);
  await saveGuildShortcuts(guildId, shortcuts);
  return getCommandSettings(guildId);
}

function cleanIdList(value) { return Array.isArray(value) ? value.map(String).filter((id) => /^\d{5,25}$/.test(id)).slice(0, 100) : []; }
async function getMany(namespace, guildId, names) { const out = {}; for (const [name, key] of Object.entries(names)) out[name] = await keyValueService.get(namespace, `${key}_${guildId}`); return out; }
async function setMany(namespace, guildId, patch, names) { for (const [name, key] of Object.entries(names)) if (Object.prototype.hasOwnProperty.call(patch, name)) await keyValueService.set(namespace, `${key}_${guildId}`, patch[name]); return getMany(namespace, guildId, names); }

const LOG_KEYS = { messageDelete:'log_messagedelete', messageEdit:'log_messageupdate', roleCreate:'log_rolecreate', roleDelete:'log_roledelete', roleAdd:'log_rolegive', roleRemove:'log_roleremove', channelCreate:'log_channelcreate', channelDelete:'log_channeldelete', botAdd:'log_botadd', ban:'log_banadd', unban:'log_bandelete', kick:'log_kickadd' };
const PROTECT_KEYS = { antiBotStatus:'antibots_status', antiBanStatus:'ban_status', antiBanLimit:'ban_limit', antiRoleDeleteStatus:'antideleteroles_status', antiRoleDeleteLimit:'antideleteroles_limit', antiChannelDeleteStatus:'antideleterooms_status', antiChannelDeleteLimit:'antideleterooms_limit', logChannelId:'protectLog_room' };

async function getSystem(guildId, system) {
  if (system === 'welcome') return getWelcomeConfig(guildId);
  if (system === 'commands') return getCommandSettings(guildId);
  if (system === 'autoReply') return getGuildReplies(guildId);
  if (system === 'logs') return getMany(KV.logs, guildId, LOG_KEYS);
  if (system === 'protection') return getMany(KV.protect, guildId, PROTECT_KEYS);
  if (system === 'adminPoints') return { config: await getAdminConfig(guildId), points: await getPoints(guildId) };
  if (system === 'activity') return { text: await getTopEntries(await getTextScores(guildId), 50), voice: await getTopEntries(await getVoiceScores(guildId), 50) };
  return (await keyValueService.get(KV[system] || KV.system, `${system}_config_${guildId}`)) || {};
}

async function saveSystem(guildId, system, patch) {
  if (system === 'welcome') return saveWelcomeConfig(guildId, normalizeWelcome(patch));
  if (system === 'commands') return saveCommandSettings(guildId, patch.commands || patch);
  if (system === 'autoReply') return saveGuildReplies(guildId, patch.replies || patch);
  if (system === 'logs') return setMany(KV.logs, guildId, patch, LOG_KEYS);
  if (system === 'protection') return setMany(KV.protect, guildId, patch, PROTECT_KEYS);
  if (system === 'adminPoints') { if (patch.config) await saveAdminConfig(guildId, patch.config); if (patch.points) await setPoints(guildId, patch.points); return getSystem(guildId, system); }
  const namespace = KV[system] || KV.system;
  const current = await getSystem(guildId, system);
  const next = { ...current, ...patch, guildId };
  await keyValueService.set(namespace, `${system}_config_${guildId}`, next);
  return next;
}

function normalizeWelcome(patch) {
  return { ...patch, enabled: patch.enabled !== false, imageEditor: { x: 50, y: 50, size: 160, zoom: 1, radius: 50, borderWidth: 4, borderColor: '#ffffff', ...(patch.imageEditor || {}) } };
}

async function dashboardSummary(client, guildId) {
  const guild = client.guilds.cache.get(guildId);
  const commands = await getCommandSettings(guildId);
  const systems = ['welcome','tickets','applications','suggestions','feedback','giveaways','autoReply','broadcast','activity','protection'];
  const cards = [];
  for (const system of systems) { const data = await getSystem(guildId, system); cards.push({ system, enabled: Array.isArray(data) ? data.length > 0 : data?.enabled !== false && Object.keys(data || {}).length > 0, count: Array.isArray(data) ? data.length : Object.keys(data || {}).length }); }
  return { bot: { online: Boolean(client.user), ping: Math.round(client.ws.ping), uptime: client.uptime || 0, guilds: client.guilds.cache.size, members: client.guilds.cache.reduce((s,g)=>s+(g.memberCount||0),0) }, guild: guild ? { id:guild.id, name:guild.name, memberCount:guild.memberCount } : { id:guildId }, commands: { total: commands.length, enabled: commands.filter(c=>c.enabled).length, disabled: commands.filter(c=>!c.enabled).length, withAliases: commands.filter(c=>c.aliases?.length).length, customPermissions: commands.filter(c=>c.allowedRoles.length||c.deniedRoles.length||c.allowedChannels.length||c.deniedChannels.length).length }, systems: cards, activity: await getSystem(guildId, 'activity') };
}

module.exports = { readCommandCatalog, getSystem, saveSystem, dashboardSummary, DEFAULT_WELCOME };
