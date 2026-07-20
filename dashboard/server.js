const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');
const { PermissionsBitField, ChannelType } = require('discord.js');
const { dashboardSummary, getSystem, saveSystem } = require('./services/zeusConfigService');

const PUBLIC = path.join(__dirname, 'public');
const sessions = new Map();
const DISCORD_API = 'https://discord.com/api/v10';
const MANAGE_GUILD = 0x20n;
const ADMINISTRATOR = 0x8n;

function json(res, status, data) { res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(data)); }
function redirect(res, location) { res.writeHead(302, { location }); res.end(); }
function parseCookies(header='') { return Object.fromEntries(header.split(';').map(v=>v.trim()).filter(Boolean).map(v=>{const i=v.indexOf('='); return [v.slice(0,i), decodeURIComponent(v.slice(i+1))];})); }
function setSession(res, data) { const id = crypto.randomBytes(24).toString('hex'); sessions.set(id, { ...data, createdAt: Date.now() }); res.setHeader('Set-Cookie', `zeus_sid=${id}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800`); return id; }
function getSession(req) { return sessions.get(parseCookies(req.headers.cookie).zeus_sid); }
async function body(req) { const chunks=[]; for await (const c of req) chunks.push(c); const raw=Buffer.concat(chunks).toString('utf8'); return raw ? JSON.parse(raw) : {}; }
function sendFile(res, file) { const ext=path.extname(file); const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'application/javascript','.json':'application/json','.svg':'image/svg+xml'}; fs.readFile(file,(e,b)=>{ if(e) return json(res,404,{error:'not_found'}); res.writeHead(200,{'content-type':types[ext]||'application/octet-stream'}); res.end(b); }); }
function hasManageGuild(permissions) { const bits = BigInt(permissions || 0); return (bits & MANAGE_GUILD) === MANAGE_GUILD || (bits & ADMINISTRATOR) === ADMINISTRATOR; }
async function discordFetch(pathname, token) { const r = await fetch(`${DISCORD_API}${pathname}`, { headers: { authorization: `Bearer ${token}` } }); if (!r.ok) throw new Error(`Discord API ${r.status}`); return r.json(); }
async function ensureAccess(req, res, client, guildId) { const session = getSession(req); if (!session) { json(res,401,{error:'login_required'}); return null; } const guild = client.guilds.cache.get(guildId); if (!guild) { json(res,404,{error:'bot_not_in_guild'}); return null; } if (session.devOwner) return { session, guild }; const managed = (session.guilds || []).find(g=>g.id===guildId && hasManageGuild(g.permissions)); if (!managed) { json(res,403,{error:'missing_manage_guild'}); return null; } return { session, guild }; }
function guildResources(guild) { return { channels: guild.channels.cache.map(c=>({id:c.id,name:c.name,type:c.type,parentId:c.parentId, manageable:c.manageable})).sort((a,b)=>String(a.name).localeCompare(b.name)), textChannels: guild.channels.cache.filter(c=>[ChannelType.GuildText,ChannelType.GuildAnnouncement].includes(c.type)).map(c=>({id:c.id,name:c.name,type:c.type})), categories: guild.channels.cache.filter(c=>c.type===ChannelType.GuildCategory).map(c=>({id:c.id,name:c.name})), roles: guild.roles.cache.filter(r=>r.id!==guild.id).map(r=>({id:r.id,name:r.name,color:r.hexColor,position:r.position,managed:r.managed})).sort((a,b)=>b.position-a.position) }; }
async function exchangeCode(code, req) { const redirectUri = process.env.DASHBOARD_REDIRECT_URI || `${process.env.DASHBOARD_BASE_URL || `http://localhost:${process.env.DASHBOARD_PORT || 3000}`}/auth/callback`; const params = new URLSearchParams({ client_id: process.env.DISCORD_CLIENT_ID, client_secret: process.env.DISCORD_CLIENT_SECRET, grant_type:'authorization_code', code, redirect_uri: redirectUri }); const tokenRes = await fetch(`${DISCORD_API}/oauth2/token`, { method:'POST', headers:{'content-type':'application/x-www-form-urlencoded'}, body: params }); if(!tokenRes.ok) throw new Error('oauth_exchange_failed'); const token = await tokenRes.json(); const [user, guilds] = await Promise.all([discordFetch('/users/@me', token.access_token), discordFetch('/users/@me/guilds', token.access_token)]); return { user, guilds: guilds.filter(g=>hasManageGuild(g.permissions)), accessToken: token.access_token }; }

function startDashboard(client) {
  if (process.env.DASHBOARD_ENABLED === 'false') return null;
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      if (url.pathname === '/auth/login') {
        if (!process.env.DISCORD_CLIENT_ID || !process.env.DISCORD_CLIENT_SECRET) {
          if (process.env.DASHBOARD_DEV_USER_ID) { setSession(res,{ user:{id:process.env.DASHBOARD_DEV_USER_ID, username:'Developer'}, guilds: client.guilds.cache.map(g=>({id:g.id,name:g.name,permissions:String(PermissionsBitField.Flags.Administrator)})), devOwner:true }); return redirect(res,'/'); }
          return json(res,500,{error:'missing_oauth_env'});
        }
        const redirectUri = process.env.DASHBOARD_REDIRECT_URI || `${process.env.DASHBOARD_BASE_URL || `http://localhost:${process.env.DASHBOARD_PORT || 3000}`}/auth/callback`;
        const qs = new URLSearchParams({ client_id:process.env.DISCORD_CLIENT_ID, redirect_uri:redirectUri, response_type:'code', scope:'identify guilds' });
        return redirect(res, `https://discord.com/oauth2/authorize?${qs}`);
      }
      if (url.pathname === '/auth/callback') { const data = await exchangeCode(url.searchParams.get('code'), req); setSession(res, data); return redirect(res, '/'); }
      if (url.pathname === '/auth/logout') { const sid=parseCookies(req.headers.cookie).zeus_sid; if(sid) sessions.delete(sid); res.setHeader('Set-Cookie','zeus_sid=; Max-Age=0; Path=/'); return redirect(res,'/'); }
      if (url.pathname === '/api/me') { const s=getSession(req); return json(res, s?200:401, s?{user:s.user,guilds:s.guilds.filter(g=>client.guilds.cache.has(g.id))}:{error:'login_required'}); }
      const api = url.pathname.match(/^\/api\/guilds\/([^/]+)(?:\/(summary|resources|systems\/([^/]+)))?$/);
      if (api) { const guildId=api[1]; const access=await ensureAccess(req,res,client,guildId); if(!access) return; if(!api[2]||api[2]==='summary') return json(res,200,await dashboardSummary(client,guildId)); if(api[2]==='resources') return json(res,200,guildResources(access.guild)); if(api[3]) { if(req.method==='GET') return json(res,200,await getSystem(guildId, api[3])); if(req.method==='PUT') return json(res,200,await saveSystem(guildId, api[3], await body(req))); } }
      if (url.pathname.startsWith('/api/')) return json(res,404,{error:'api_not_found'});
      const file = url.pathname === '/' ? path.join(PUBLIC,'index.html') : path.join(PUBLIC, url.pathname.replace(/^\//,''));
      if (!file.startsWith(PUBLIC)) return json(res,403,{error:'forbidden'});
      return sendFile(res, file);
    } catch (error) { console.error('[Dashboard]', error); return json(res,500,{error:error.message}); }
  });
  const port = Number(process.env.DASHBOARD_PORT || 3000);
  server.listen(port, () => console.log(`[Dashboard] ZEUS dashboard running on :${port}`));
  return server;
}
module.exports = { startDashboard };
