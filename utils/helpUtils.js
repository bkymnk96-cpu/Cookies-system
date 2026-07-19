const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const path = require("path");
const { getGuildShortcuts } = require("./shortcutUtils");

const CATEGORY_LABELS = {
  "Auto-reply": "الردود التلقائية",
  "Auto-role": "الرتب التلقائية",
  Autoline: "الخط التلقائي",
  Broadcast: "البرودكاست",
  Feedback: "الآراء والتقييم",
  General: "عامة",
  Giveaway: "القيف أواي",
  Logs: "اللوق",
  Nadeko: "ناديكو",
  Suggestions: "الاقتراحات",
  System: "النظام العام",
  Welcome: "نظام الترحيب",
  AdminPoints: "نقاط الإدارة",
  Tax: "الضريبة",
  Ticket: "التذاكر",
  apply: "التقديمات",
  protection: "الحماية",
};

const CATEGORY_EMOJIS = {
  "Auto-reply": "💎",
  "Auto-role": "⚡",
  Autoline: "🤖",
  Broadcast: "📢",
  Feedback: "💭",
  General: "✨",
  Giveaway: "🎁",
  Logs: "📜",
  Nadeko: "⏳",
  Suggestions: "💡",
  System: "⚙️",
  Welcome: "👋",
  AdminPoints: "🏅",
  Tax: "💰",
  Ticket: "🎫",
  apply: "📝",
  protection: "🛡️",
};

function getCategoryFromCommand(command) {
  if (command.category) return command.category;
  if (command.filePath) return path.basename(path.dirname(command.filePath));
  return "General";
}

function getCommandsByCategory(client) {
  const grouped = new Map();
  const commands = Array.from(client.CookiesSlashCommands?.values?.() || []);
  for (const command of commands) {
    if (!command?.data?.name) continue;
    const category = getCategoryFromCommand(command);
    if (!grouped.has(category)) grouped.set(category, []);
    grouped.get(category).push(command);
  }
  for (const list of grouped.values()) {
    list.sort((a, b) => a.data.name.localeCompare(b.data.name));
  }
  return grouped;
}

function getCategoryLabel(category) {
  return CATEGORY_LABELS[category] || category;
}

function formatCommandHelpValue(command, shortcuts) {
  const shortcut = shortcuts?.[command.data.name];
  const lines = [command.data.description || "لا يوجد وصف متوفر."];
  if (shortcut) lines.push(`**الاختصار:** \`${shortcut}\``);
  return lines.join("\n");
}

function buildCommandHelpFields(commands, shortcuts, limit = 25) {
  return commands.slice(0, limit).map((command) => ({
    name: `\`/${command.data.name}\``,
    value: formatCommandHelpValue(command, shortcuts),
    inline: false,
  }));
}

function buildHelpButtons(client, activeCategory = null) {
  const categories = Array.from(getCommandsByCategory(client).keys()).sort((a, b) => getCategoryLabel(a).localeCompare(getCategoryLabel(b)));
  const rows = [];
  let current = new ActionRowBuilder();
  categories.slice(0, 25).forEach((category, index) => {
    if (index > 0 && index % 5 === 0) {
      rows.push(current);
      current = new ActionRowBuilder();
    }
    current.addComponents(
      new ButtonBuilder()
        .setCustomId(`help_dynamic_${category}`)
        .setLabel(getCategoryLabel(category).slice(0, 80))
        .setEmoji(CATEGORY_EMOJIS[category] || "📌")
        .setStyle(category === activeCategory ? ButtonStyle.Primary : ButtonStyle.Secondary)
        .setDisabled(category === activeCategory)
    );
  });
  if (current.components.length) rows.push(current);
  return rows;
}

async function buildMainHelpEmbed(interaction, client) {
  const grouped = getCommandsByCategory(client);
  const shortcuts = await getGuildShortcuts(interaction.guild.id);
  const total = Array.from(grouped.values()).reduce((sum, list) => sum + list.length, 0);
  const lines = Array.from(grouped.keys())
    .sort((a, b) => getCategoryLabel(a).localeCompare(getCategoryLabel(b)))
    .map((category) => `${CATEGORY_EMOJIS[category] || "📌"} **${getCategoryLabel(category)}**: ${grouped.get(category).length} أمر`);

  const shortcutEntries = Object.entries(shortcuts);
  if (shortcutEntries.length) {
    lines.push("", `**الاختصارات المسجلة:** ${shortcutEntries.length} اختصار`);
  }

  return new EmbedBuilder()
    .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
    .setTitle("قائمة أوامر البوت")
    .setDescription(`اختر قسمًا من الأزرار بالأسفل لعرض أوامره.\n\n${lines.join("\n")}`)
    .addFields({ name: "عدد الأوامر", value: `\`${total}\` أمر مسجل تلقائيًا`, inline: false })
    .setTimestamp()
    .setFooter({ text: `طلب بواسطة ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
    .setColor("DarkButNotBlack");
}

async function buildCategoryHelpEmbed(interaction, client, category) {
  const grouped = getCommandsByCategory(client);
  const shortcuts = await getGuildShortcuts(interaction.guild.id);
  const commands = grouped.get(category) || [];
  const embed = new EmbedBuilder()
    .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
    .setTitle(`أوامر ${getCategoryLabel(category)}`)
    .setColor("DarkButNotBlack")
    .setFooter({ text: `طلب بواسطة ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
    .setTimestamp();

  if (!commands.length) {
    embed.setDescription("لا توجد أوامر مسجلة داخل هذا القسم.");
    return embed;
  }

  embed.addFields(buildCommandHelpFields(commands, shortcuts));
  if (commands.length > 25) embed.setDescription(`تم عرض أول 25 أمرًا من أصل ${commands.length}.`);
  return embed;
}

async function handleDynamicHelpInteraction(interaction) {
  if (!interaction.isButton() || !interaction.customId.startsWith("help_dynamic_")) return false;
  const category = interaction.customId.replace("help_dynamic_", "");
  await interaction.update({
    embeds: [await buildCategoryHelpEmbed(interaction, interaction.client, category)],
    components: buildHelpButtons(interaction.client, category),
  });
  return true;
}

module.exports = {
  CATEGORY_LABELS,
  getCommandsByCategory,
  buildHelpButtons,
  buildMainHelpEmbed,
  buildCategoryHelpEmbed,
  handleDynamicHelpInteraction,
};
