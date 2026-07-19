const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { saveWelcomeConfig } = require('../../utils/welcomeUtils');

module.exports = {
  adminsOnly: true,
  data: new SlashCommandBuilder()
    .setName('setup-welcome')
    .setDescription('إعداد سريع للترحيب')
    .addChannelOption((option) => option.setName('channel').setDescription('روم الترحيب').addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement).setRequired(true))
    .addRoleOption((option) => option.setName('role').setDescription('رتبة تعطى للعضو عند الدخول').setRequired(false))
    .addStringOption((option) => option.setName('image').setDescription('رابط صورة الترحيب').setRequired(false))
    .addStringOption((option) => option.setName('message').setDescription('نص الترحيب مع المتغيرات').setRequired(false)),
  async execute(interaction) {
    const channel = interaction.options.getChannel('channel');
    const role = interaction.options.getRole('role');
    const image = interaction.options.getString('image');
    const message = interaction.options.getString('message');

    await saveWelcomeConfig(interaction.guild.id, {
      enabled: true,
      channelId: channel.id,
      roleId: role?.id || null,
      image: image || null,
      ...(message ? { message } : {}),
    });

    await interaction.reply({ content: '✅ تم تحديث إعدادات الترحيب السريعة. استخدم `/welcome` للتحكم الكامل والمعاينة والمتغيرات.', ephemeral: true });
  },
};
