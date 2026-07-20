const express = require('express');
const path = require('path');
const crypto = require('crypto');
const keyValueService = require('../services/keyValueService');
const { SECTIONS, SECTION_MAP, scopedKey } = require('./registry');
const { botTokens, owner } = require('../config');

const COOKIE = 'zeus_session';
const SECRET = process.env.DASHBOARD_SESSION_SECRET || process.env.SESSION_SECRET || 'zeus-dashboard-dev-secret-change-me';
const API = 'https://discord.com/api/v10';

function sign(value) { return crypto.createHmac('sha256', SECRET).update(value).digest('base64url'); }
function encodeSession(data) { const payload = Buffer.from(JSON.stringify(data)).toString('base64url'); return `${payload}.${sign(payload)}`; }
function decodeSession(raw) {
  if (!raw || !raw.includes('.')) return null;
  const [payload, sig] = raw.split('.');
  if (sign(payload) !== sig) return null;
  try { return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')); } catch { return null; }
}
function getCookie(req, name) { return Object.fromEntries((req.headers.cookie || '').split(';').map((v) => v.trim().split('=').map(decodeURIComponent)).filter((v) => v[0]))[name]; }
function setCookie(res, data) { res.setHeader('Set-Cookie', `${COOKIE}=${encodeURIComponent(encodeSession(data))}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`); }
function clearCookie(res) { res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`); }
function publicBaseUrl(req) { return process.env.DASHBOARD_BASE_URL || `${req.protocol}://${req.get('host')}`; }
function clientId(clients) { return process.env.DISCORD_CLIENT_ID || process.env.CLIENT_ID || clients[0]?.user?.id; }
function inviteUrl(req, clients, guildId) {
  const id = clientId(clients);
  return `https://discord.com/oauth2/authorize?client_id=${id}&permissions=8&scope=bot%20applications.commands&guild_id=${guildId || ''}&disable_guild_select=${guildId ? 'true' : 'false'}`;
}
async function discordFetch(session, endpoint) {
  const res = await fetch(`${API}${endpoint}`, { headers: { Authorization: `Bearer ${session.accessToken}` } });
  if (!res.ok) throw new Error(`Discord API ${res.status}`);
  return res.json();
}
function canManage(guild) { return guild.owner || (BigInt(guild.permissions || 0) & BigInt(0x20)) === BigInt(0x20) || (BigInt(guild.permissions || 0) & BigInt(0x8)) === BigInt(0x8); }
function getBotGuild(clients, guildId) { return clients.map((client) => client.guilds.cache.get(guildId)).find(Boolean); }
async function ensureAuth(req, res, next) {
  const session = decodeSession(getCookie(req, COOKIE));
  if (!session?.accessToken) return res.status(401).json({ error: 'AUTH_REQUIRED' });
  req.session = session;
  next();
}
function serializeChannel(channel) { return { id: channel.id, name: channel.name, type: channel.type, parentId: channel.parentId || null }; }
function serializeRole(role) { return { id: role.id, name: role.name, color: role.hexColor, position: role.position, managed: role.managed }; }
async function assertGuildAccess(req, clients, guildId) {
  const botGuild = getBotGuild(clients, guildId);
  if (!botGuild) { const err = new Error('BOT_NOT_IN_GUILD'); err.status = 403; throw err; }
  if (req.session.user?.id === owner) return botGuild;
  const guilds = await discordFetch(req.session, '/users/@me/guilds');
  const guild = guilds.find((item) => item.id === guildId);
  if (!guild || !canManage(guild)) { const err = new Error('NO_PERMISSION'); err.status = 403; throw err; }
  return botGuild;
}
async function readSection(guildId, section) {
  const values = {};
  for (const field of section.fields || []) {
    const value = await keyValueService.get(field.ns, scopedKey(field, guildId));
    values[field.key] = value === undefined ? field.default ?? null : value;
  }
  return values;
}
async function writeSection(guildId, section, payload) {
  const saved = {};
  for (const field of section.fields || []) {
    if (!(field.key in payload)) continue;
    await keyValueService.set(field.ns, scopedKey(field, guildId), payload[field.key]);
    saved[field.key] = payload[field.key];
  }
  await keyValueService.set('systemDB', `dashboard_last_update_${guildId}`, { section: section.id, at: Date.now() });
  return saved;
}
async function overviewFor(guild, clients) {
  const checks = [
    ['ticketDB', `LogsRoom_${guild.id}`], ['applyDB', `apply_settings_${guild.id}`], ['BroadcastDB', `tokens_${guild.id}`],
    ['giveawayDB', `giveaways_${guild.id}`], ['suggestionsDB', `suggestions_room_${guild.id}`], ['feedbackDB', `feedback_room_${guild.id}`],
    ['autolineDB', `line_channels_${guild.id}`], ['systemDB', `welcome_config_${guild.id}`], ['protectDB', `protectLog_room_${guild.id}`],
    ['logsDB', `log_messagedelete_${guild.id}`], ['taxDB', `tax_room_${guild.id}`], ['shortcutDB', `shortcuts_${guild.id}`],
  ];
  const active = (await Promise.all(checks.map(([ns, key]) => keyValueService.has(ns, key).catch(() => false)))).filter(Boolean).length;
  const giveaways = await keyValueService.get('giveawayDB', `giveaways_${guild.id}`) || [];
  const ticketsOpen = guild.channels.cache.filter((channel) => channel.name?.startsWith('ticket') || channel.name?.includes('تذكرة')).size;
  const protection = await Promise.all(['ban_status', 'antibots_status', 'antideleteroles_status', 'antideleterooms_status'].map((key) => keyValueService.get('protectDB', `${key}_${guild.id}`)));
  return {
    guild: { id: guild.id, name: guild.name, icon: guild.iconURL({ dynamic: true }), members: guild.memberCount, channels: guild.channels.cache.size, roles: guild.roles.cache.size },
    bot: { tag: guild.client.user.tag, id: guild.client.user.id, status: guild.client.ws.status === 0 ? 'متصل' : 'يعيد الاتصال', uptime: guild.client.uptime, bots: clients.length },
    database: { status: 'متصلة', activeSettings: active },
    stats: {
      servers: clients.reduce((sum, client) => sum + client.guilds.cache.size, 0), activeSettings: active, openTickets: ticketsOpen,
      protections: protection.filter((v) => v === 'on').length, logChannels: checks.filter(([ns]) => ns === 'logsDB').length,
      openApplications: await keyValueService.has('applyDB', `apply_${guild.id}`), broadcasts: (await keyValueService.get('BroadcastDB', `tokens_${guild.id}`) || []).length,
      giveaways: giveaways.length,
    },
    lastUpdate: await keyValueService.get('systemDB', `dashboard_last_update_${guild.id}`) || null,
  };
}
function startDashboard(clients) {
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '2mb' }));
  app.use(express.static(path.join(__dirname, 'public')));

  app.get('/auth/discord', (req, res) => {
    const id = clientId(clients); const secret = process.env.DISCORD_CLIENT_SECRET || process.env.CLIENT_SECRET;
    if (!id || !secret) return res.redirect('/?oauth=missing');
    const state = crypto.randomBytes(16).toString('hex');
    setCookie(res, { state });
    const redirectUri = `${publicBaseUrl(req)}/auth/discord/callback`;
    res.redirect(`https://discord.com/oauth2/authorize?client_id=${id}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify%20guilds&state=${state}`);
  });
  app.get('/auth/discord/callback', async (req, res) => {
    try {
      const base = decodeSession(getCookie(req, COOKIE));
      if (!base?.state || base.state !== req.query.state) return res.redirect('/?oauth=state');
      const id = clientId(clients); const secret = process.env.DISCORD_CLIENT_SECRET || process.env.CLIENT_SECRET;
      const redirectUri = `${publicBaseUrl(req)}/auth/discord/callback`;
      const tokenRes = await fetch(`${API}/oauth2/token`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: id, client_secret: secret, grant_type: 'authorization_code', code: req.query.code, redirect_uri: redirectUri }) });
      if (!tokenRes.ok) throw new Error('TOKEN_EXCHANGE_FAILED');
      const token = await tokenRes.json();
      const session = { accessToken: token.access_token, refreshToken: token.refresh_token, expiresAt: Date.now() + (token.expires_in * 1000) };
      session.user = await discordFetch(session, '/users/@me');
      setCookie(res, session); res.redirect('/guilds');
    } catch (error) { res.redirect('/?oauth=failed'); }
  });
  app.get('/auth/logout', (req, res) => { clearCookie(res); res.redirect('/'); });
  app.get('/api/me', ensureAuth, (req, res) => res.json({ user: req.session.user }));
  app.get('/api/guilds', ensureAuth, async (req, res) => {
    const guilds = (await discordFetch(req.session, '/users/@me/guilds')).filter(canManage);
    const botGuildIds = new Set(clients.flatMap((client) => Array.from(client.guilds.cache.keys())));
    res.json({ guilds: guilds.map((guild) => ({ ...guild, iconUrl: guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : null, hasBot: botGuildIds.has(guild.id), inviteUrl: inviteUrl(req, clients, guild.id) })) });
  });
  app.get('/api/guilds/:guildId/meta', ensureAuth, async (req, res, next) => { try {
    const guild = await assertGuildAccess(req, clients, req.params.guildId);
    res.json({ sections: SECTIONS, channels: guild.channels.cache.filter((c) => [0,5,13,15].includes(c.type)).map(serializeChannel), roles: guild.roles.cache.filter((r) => r.id !== guild.id).sort((a,b)=>b.position-a.position).map(serializeRole), overview: await overviewFor(guild, clients), inviteUrl: inviteUrl(req, clients, guild.id) });
  } catch (e) { next(e); } });
  app.get('/api/guilds/:guildId/sections/:sectionId', ensureAuth, async (req, res, next) => { try {
    await assertGuildAccess(req, clients, req.params.guildId); const section = SECTION_MAP.get(req.params.sectionId); if (!section) return res.status(404).json({ error: 'SECTION_NOT_FOUND' });
    res.json({ section, values: section.id === 'overview' ? {} : await readSection(req.params.guildId, section) });
  } catch (e) { next(e); } });
  app.post('/api/guilds/:guildId/sections/:sectionId', ensureAuth, async (req, res, next) => { try {
    await assertGuildAccess(req, clients, req.params.guildId); const section = SECTION_MAP.get(req.params.sectionId); if (!section) return res.status(404).json({ error: 'SECTION_NOT_FOUND' });
    const saved = await writeSection(req.params.guildId, section, req.body || {}); res.json({ ok: true, saved });
  } catch (e) { next(e); } });
  app.get('/api/guilds/:guildId/export', ensureAuth, async (req, res, next) => { try {
    await assertGuildAccess(req, clients, req.params.guildId); const data = {}; for (const section of SECTIONS.filter((s) => s.fields?.length)) data[section.id] = await readSection(req.params.guildId, section); res.json({ guildId: req.params.guildId, exportedAt: new Date().toISOString(), data });
  } catch (e) { next(e); } });
  app.post('/api/guilds/:guildId/import', ensureAuth, async (req, res, next) => { try {
    await assertGuildAccess(req, clients, req.params.guildId); const input = req.body?.data || {}; for (const section of SECTIONS.filter((s) => input[s.id])) await writeSection(req.params.guildId, section, input[s.id]); res.json({ ok: true });
  } catch (e) { next(e); } });
  app.get(['/guilds', '/dashboard/:guildId', '/dashboard/:guildId/:section'], (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
  app.use((err, req, res, next) => res.status(err.status || 500).json({ error: err.message || 'SERVER_ERROR' }));
  const port = Number(process.env.PORT || process.env.DASHBOARD_PORT || 3000);
  app.listen(port, () => console.log(`[ZEUS Dashboard] يعمل على المنفذ ${port} (${botTokens.length} bot token(s))`));
}
module.exports = { startDashboard };