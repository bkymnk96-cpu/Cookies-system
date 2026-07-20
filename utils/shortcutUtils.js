const keyValueService = require("../services/keyValueService");
const { PermissionsBitField } = require("discord.js");
const { enforceCommandPolicy } = require("./commandPolicyUtils");

function getMessageArgs(message, trigger) {
  return message.content.slice(trigger.length).trim().split(/\s+/).filter(Boolean);
}

function getCommandOptions(command) {
  try {
    return command?.data?.toJSON?.()?.options || [];
  } catch {
    return [];
  }
}

function cleanDiscordId(raw) {
  return String(raw || "").replace(/[<@#&!>]/g, "");
}

function mapArgsToOptions(command, args, message) {
  const mapped = {};
  for (const option of getCommandOptions(command)) {
    if ([1, 2].includes(option.type)) continue;
    const raw = args.length ? args.shift() : undefined;
    if (raw === undefined) continue;
    if (option.type === 3) {
      const allOptions = getCommandOptions(command);
      const index = allOptions.findIndex((opt) => opt.name === option.name);
      const remainingStringOptions = allOptions.slice(index + 1).filter((opt) => opt.type === 3).length;
      const shouldConsumeRest = remainingStringOptions === 0 || ["text", "content", "message", "reason", "reply", "description", "name"].includes(option.name);
      mapped[option.name] = shouldConsumeRest ? [raw, ...args.splice(0)].join(" ").trim() : raw;
      if (shouldConsumeRest) break;
    }
    else if (option.type === 4 || option.type === 10) mapped[option.name] = Number(raw);
    else if (option.type === 5) mapped[option.name] = ["true", "on", "yes", "1", "تشغيل", "نعم"].includes(String(raw).toLowerCase());
    else if (option.type === 6) mapped[option.name] = message.mentions.users.first() || message.guild.members.cache.get(cleanDiscordId(raw))?.user || null;
    else if (option.type === 7) mapped[option.name] = message.mentions.channels.first() || message.guild.channels.cache.get(cleanDiscordId(raw)) || message.channel;
    else if (option.type === 8) mapped[option.name] = message.mentions.roles.first() || message.guild.roles.cache.get(cleanDiscordId(raw)) || null;
    else if (option.type === 11) mapped[option.name] = message.attachments.first() || null;
  }
  return mapped;
}

function firstUnusedArg(args) {
  return args.shift() || null;
}

function createOptionResolver(command, args, message) {
  const mapped = mapArgsToOptions(command, [...args], message);
  return {
    getSubcommand() {
      return null;
    },
    getString(name) {
      if (Object.prototype.hasOwnProperty.call(mapped, name)) return mapped[name];
      if (["number", "amount", "count"].includes(name)) return args.join(" ") || null;
      if (["text", "content", "message", "reason"].includes(name)) return args.join(" ") || null;
      if (["name"].includes(name)) return args.join(" ") || null;
      return firstUnusedArg(args);
    },
    getInteger(name) {
      if (Object.prototype.hasOwnProperty.call(mapped, name)) return mapped[name];
      const value = args.shift();
      const number = Number(value);
      return Number.isFinite(number) ? number : null;
    },
    getNumber(name) {
      if (Object.prototype.hasOwnProperty.call(mapped, name)) return mapped[name];
      const value = args.shift();
      const number = Number(value);
      return Number.isFinite(number) ? number : null;
    },
    getUser(name) {
      if (Object.prototype.hasOwnProperty.call(mapped, name)) return mapped[name];
      return message.mentions.users.first() || null;
    },
    getMember(name) {
      if (Object.prototype.hasOwnProperty.call(mapped, name)) return mapped[name]?.id ? message.guild.members.cache.get(mapped[name].id) : null;
      return message.mentions.members.first() || null;
    },
    getChannel(name) {
      if (Object.prototype.hasOwnProperty.call(mapped, name)) return mapped[name];
      return message.mentions.channels.first() || message.channel;
    },
    getRole(name) {
      if (Object.prototype.hasOwnProperty.call(mapped, name)) return mapped[name];
      return message.mentions.roles.first() || null;
    },
    getBoolean(name) {
      if (Object.prototype.hasOwnProperty.call(mapped, name)) return mapped[name];
      const value = (args.shift() || "").toLowerCase();
      if (["true", "on", "yes", "1", "تشغيل", "نعم"].includes(value)) return true;
      if (["false", "off", "no", "0", "ايقاف", "إيقاف", "لا"].includes(value)) return false;
      return null;
    },
    getFocused() {
      return args.join(" ") || "";
    },
    getAttachment(name) {
      if (Object.prototype.hasOwnProperty.call(mapped, name)) return mapped[name];
      return message.attachments.first() || null;
    },
  };
}

function createShortcutInteraction(message, command, args) {
  const replyState = { replied: false, deferred: false, lastReply: null };
  const interaction = {
    id: message.id,
    commandName: command.data.name,
    client: message.client,
    guild: message.guild,
    guildId: message.guild?.id,
    channel: message.channel,
    channelId: message.channel?.id,
    user: message.author,
    member: message.member,
    message,
    createdTimestamp: message.createdTimestamp,
    replied: false,
    deferred: false,
    options: createOptionResolver(command, [...args], message),
    isChatInputCommand: () => true,
    inGuild: () => Boolean(message.guild),
    deferReply: async (options = {}) => {
      replyState.deferred = true;
      interaction.deferred = true;
      if (options.fetchReply) {
        return replyState.lastReply;
      }
      return undefined;
    },
    reply: async (payload) => {
      replyState.replied = true;
      interaction.replied = true;
      replyState.lastReply = await message.reply(payload);
      if (payload?.ephemeral) {
        replyState.lastReply.deleteReply = () => replyState.lastReply.delete?.().catch(() => {});
      }
      return replyState.lastReply;
    },
    editReply: async (payload) => {
      if (replyState.lastReply?.edit) {
        const edited = await replyState.lastReply.edit(payload);
        if (payload?.ephemeral) {
          replyState.lastReply.deleteReply = () => replyState.lastReply.delete?.().catch(() => {});
        }
        return edited;
      }
      replyState.replied = true;
      interaction.replied = true;
      replyState.lastReply = await message.reply(payload);
      if (payload?.ephemeral) {
        replyState.lastReply.deleteReply = () => replyState.lastReply.delete?.().catch(() => {});
      }
      return replyState.lastReply;
    },
    deleteReply: async () => {
      if (replyState.lastReply?.delete) return replyState.lastReply.delete().catch(() => {});
      return undefined;
    },
    followUp: async (payload) => message.reply(payload),
    fetchReply: async () => replyState.lastReply,
    deferUpdate: async () => {},
  };
  return interaction;
}

async function getGuildShortcuts(guildId) {
  return (await keyValueService.get("shortcutDB", `shortcuts_${guildId}`)) || {};
}

async function saveGuildShortcuts(guildId, shortcuts) {
  await keyValueService.set("shortcutDB", `shortcuts_${guildId}`, shortcuts);
  return shortcuts;
}

async function resolveShortcut(guildId, content) {
  const shortcuts = await getGuildShortcuts(guildId);
  const entries = Object.entries(shortcuts).sort((a, b) => b[1].length - a[1].length);
  for (const [commandName, shortcut] of entries) {
    if (!shortcut) continue;
    if (content === shortcut || content.startsWith(`${shortcut} `)) {
      return { commandName, shortcut };
    }
  }
  return null;
}

async function executeSlashCommandFromMessage(message, commandName, trigger) {
  const command = message.client.CookiesSlashCommands?.get(commandName);
  if (!command) return false;
  if (command.ownersOnly === true) {
    await message.reply("❗ **لا تستطيع استخدام هذا الأمر.**");
    return true;
  }
  if (command.adminsOnly === true && !message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
    await message.reply("❗ **يجب أن تمتلك صلاحية الأدمن لاستخدام هذا الأمر.**");
    return true;
  }
  const args = getMessageArgs(message, trigger);
  const fakeInteraction = createShortcutInteraction(message, command, args);
  const policy = await enforceCommandPolicy(fakeInteraction);
  if (!policy.allowed) {
    await message.reply(`❗ **${policy.reason}**`);
    return true;
  }
  await command.execute(fakeInteraction);
  return true;
}

async function handleShortcutMessage(message) {
  if (!message.guild || message.author.bot) return false;
  const resolved = await resolveShortcut(message.guild.id, message.content);
  if (!resolved) return false;
  return executeSlashCommandFromMessage(message, resolved.commandName, resolved.shortcut);
}

module.exports = {
  getGuildShortcuts,
  saveGuildShortcuts,
  resolveShortcut,
  executeSlashCommandFromMessage,
  handleShortcutMessage,
};
