const { EmbedBuilder } = require('discord.js');
const keyValueService = require('../services/keyValueService');

const DEFAULT_WELCOME = {
  enabled: true,
  mode: 'embed',
  color: '#787575',
  title: 'مرحبا بك في {server}',
  message: 'مرحبا {member}، نورت **{server}**! أنت العضو رقم **{member_count}**.',
  footer: '{server}',
  dmEnabled: false,
  dmMessage: 'أهلا {user} في {server}.',
};

function applyVariables(template = '', member, inviteData = {}) {
  const inviter = inviteData.inviter;
  const replacements = {
    member: `<@${member.id}>`,
    user: member.user.username,
    username: member.user.username,
    tag: member.user.tag,
    user_id: member.id,
    server: member.guild.name,
    server_id: member.guild.id,
    member_count: String(member.guild.memberCount),
    inviter: inviter ? `<@${inviter.id}>` : 'غير معروف',
    inviter_name: inviter ? inviter.username : 'غير معروف',
    invite_code: inviteData.code || 'دخول مباشر',
    invite_uses: String(inviteData.uses || 0),
    created_at: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`,
    joined_at: `<t:${Math.floor(Date.now() / 1000)}:F>`,
  };
  return String(template).replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) => replacements[key] ?? `{${key}}`);
}

async function getWelcomeConfig(guildId) {
  const stored = await keyValueService.get('systemDB', `welcome_config_${guildId}`);
  if (stored) return { ...DEFAULT_WELCOME, ...stored };
  const channelId = await keyValueService.get('systemDB', `welcome_channel_${guildId}`);
  const roleId = await keyValueService.get('systemDB', `welcome_role_${guildId}`);
  const image = await keyValueService.get('systemDB', `welcome_image_${guildId}`);
  return { ...DEFAULT_WELCOME, channelId, roleId, image };
}

async function saveWelcomeConfig(guildId, patch) {
  const current = await getWelcomeConfig(guildId);
  const next = { ...current, ...patch };
  await keyValueService.set('systemDB', `welcome_config_${guildId}`, next);
  return next;
}

function buildWelcomePayload(config, member, inviteData) {
  const content = applyVariables(config.message, member, inviteData);
  if (config.mode === 'text') return { content };
  const embed = new EmbedBuilder()
    .setColor(config.color || DEFAULT_WELCOME.color)
    .setTitle(applyVariables(config.title, member, inviteData).slice(0, 256))
    .setDescription(content.slice(0, 4096))
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .setTimestamp();
  if (config.footer) embed.setFooter({ text: applyVariables(config.footer, member, inviteData).slice(0, 2048), iconURL: member.guild.iconURL({ dynamic: true }) || undefined });
  if (config.image) embed.setImage(applyVariables(config.image, member, inviteData));
  return { content: config.mentionOutside ? `<@${member.id}>` : undefined, embeds: [embed] };
}

module.exports = { DEFAULT_WELCOME, applyVariables, getWelcomeConfig, saveWelcomeConfig, buildWelcomePayload };