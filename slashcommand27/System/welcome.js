const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { saveWelcomeConfig, getWelcomeConfig, buildWelcomePayload } = require('../../utils/welcomeUtils');

module.exports = {
  adminsOnly: true,
  data: new SlashCommandBuilder()
    .setName('welcome')
    .setDescription('نظام ترحيب تفاعلي ومرن')
    .addSubcommand((sub) => sub.setName('setup').setDescription('تسطيب/تحديث الترحيب')
      .addChannelOption((o) => o.setName('channel').setDescription('قناة الترحيب').addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement).setRequired(true))
      .addStringOption((o) => o.setName('message').setDescription('النص مع المتغيرات مثل {member} {server} {inviter}').setRequired(true))
      .addStringOption((o) => o.setName('title').setDescription('عنوان الإمبد').setRequired(false))
      .addStringOption((o) => o.setName('mode').setDescription('طريقة الإرسال').addChoices({ name: 'Embed', value: 'embed' }, { name: 'Text', value: 'text' }).setRequired(false))
      .addStringOption((o) => o.setName('color').setDescription('لون الإمبد مثل #00ff99').setRequired(false))
      .addStringOption((o) => o.setName('image').setDescription('رابط صورة الترحيب').setRequired(false))
      .addRoleOption((o) => o.setName('role').setDescription('رتبة تلقائية عند الدخول').setRequired(false)))
    .addSubcommand((sub) => sub.setName('dm').setDescription('تفعيل/تعطيل رسالة الخاص')
      .addBooleanOption((o) => o.setName('enabled').setDescription('تفعيل الخاص؟').setRequired(true))
      .addStringOption((o) => o.setName('message').setDescription('رسالة الخاص مع المتغيرات').setRequired(false)))
    .addSubcommand((sub) => sub.setName('toggle').setDescription('تشغيل/إيقاف الترحيب')
      .addBooleanOption((o) => o.setName('enabled').setDescription('الحالة').setRequired(true)))
    .addSubcommand((sub) => sub.setName('preview').setDescription('معاينة الترحيب عليك'))
    .addSubcommand((sub) => sub.setName('variables').setDescription('عرض المتغيرات المتاحة')),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === 'setup') {
      const channel = interaction.options.getChannel('channel');
      const role = interaction.options.getRole('role');
      await saveWelcomeConfig(interaction.guild.id, {
        enabled: true,
        channelId: channel.id,
        roleId: role?.id || null,
        message: interaction.options.getString('message'),
        title: interaction.options.getString('title') || undefined,
        mode: interaction.options.getString('mode') || 'embed',
        color: interaction.options.getString('color') || undefined,
        image: interaction.options.getString('image') || null,
      });
      return interaction.reply({ content: `✅ تم إعداد الترحيب في ${channel}.`, ephemeral: true });
    }
    if (sub === 'dm') {
      await saveWelcomeConfig(interaction.guild.id, { dmEnabled: interaction.options.getBoolean('enabled'), dmMessage: interaction.options.getString('message') || undefined });
      return interaction.reply({ content: '✅ تم تحديث إعدادات رسالة الخاص.', ephemeral: true });
    }
    if (sub === 'toggle') {
      await saveWelcomeConfig(interaction.guild.id, { enabled: interaction.options.getBoolean('enabled') });
      return interaction.reply({ content: '✅ تم تحديث حالة الترحيب.', ephemeral: true });
    }
    if (sub === 'variables') {
      return interaction.reply({ content: '`{member}` منشن، `{user}` الاسم، `{tag}` التاق، `{user_id}` الآيدي، `{server}` السيرفر، `{member_count}` عدد الأعضاء، `{inviter}` منشن الداعي، `{inviter_name}` اسمه، `{invite_code}` كود الدعوة، `{invite_uses}` الاستخدامات، `{created_at}` عمر الحساب، `{joined_at}` وقت الدخول.', ephemeral: true });
    }
    const config = await getWelcomeConfig(interaction.guild.id);
    return interaction.reply({ ...buildWelcomePayload(config, interaction.member, {}), ephemeral: true });
  },
};
