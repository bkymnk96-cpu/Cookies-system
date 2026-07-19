const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { getReactionConfigs, saveReactionConfigs } = require('../../utils/autoReactionUtils');

function parseEmojis(input) { return input.split(/[\s,]+/).map((v) => v.trim()).filter(Boolean).slice(0, 20); }

module.exports = {
  adminsOnly: true,
  data: new SlashCommandBuilder()
    .setName('auto-reactions')
    .setDescription('إضافة رياكشنات تلقائية لأي رسالة في قناة محددة')
    .addSubcommand((sub) => sub.setName('add').setDescription('إضافة/تحديث قناة')
      .addChannelOption((o) => o.setName('channel').setDescription('القناة').addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement).setRequired(true))
      .addStringOption((o) => o.setName('emojis').setDescription('الإيموجيات مفصولة بمسافة أو فاصلة').setRequired(true)))
    .addSubcommand((sub) => sub.setName('remove').setDescription('حذف قناة من النظام')
      .addChannelOption((o) => o.setName('channel').setDescription('القناة').setRequired(true)))
    .addSubcommand((sub) => sub.setName('toggle').setDescription('تشغيل/إيقاف قناة')
      .addChannelOption((o) => o.setName('channel').setDescription('القناة').setRequired(true))
      .addBooleanOption((o) => o.setName('enabled').setDescription('الحالة').setRequired(true)))
    .addSubcommand((sub) => sub.setName('list').setDescription('عرض القنوات المضبوطة')),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const configs = await getReactionConfigs(interaction.guild.id);
    if (sub === 'list') {
      const text = configs.length ? configs.map((c, i) => `${i + 1}. <#${c.channelId}>: ${c.emojis.join(' ')} (${c.enabled === false ? 'متوقف' : 'مفعل'})`).join('\n') : 'لا توجد قنوات.';
      return interaction.reply({ content: text, ephemeral: true });
    }
    const channel = interaction.options.getChannel('channel');
    const index = configs.findIndex((c) => c.channelId === channel.id);
    if (sub === 'remove') {
      if (index !== -1) configs.splice(index, 1);
      await saveReactionConfigs(interaction.guild.id, configs);
      return interaction.reply({ content: `✅ تم حذف ${channel} من الرياكشن التلقائي.`, ephemeral: true });
    }
    if (sub === 'toggle') {
      if (index === -1) return interaction.reply({ content: '❌ هذه القناة غير مضافة.', ephemeral: true });
      configs[index].enabled = interaction.options.getBoolean('enabled');
      await saveReactionConfigs(interaction.guild.id, configs);
      return interaction.reply({ content: '✅ تم تحديث الحالة.', ephemeral: true });
    }
    const emojis = parseEmojis(interaction.options.getString('emojis'));
    if (!emojis.length) return interaction.reply({ content: '❌ اكتب إيموجي واحد على الأقل.', ephemeral: true });
    const next = { channelId: channel.id, emojis, enabled: true };
    if (index === -1) configs.push(next); else configs[index] = next;
    await saveReactionConfigs(interaction.guild.id, configs);
    return interaction.reply({ content: `✅ أي رسالة جديدة في ${channel} سيضاف لها: ${emojis.join(' ')}`, ephemeral: true });
  },
};
