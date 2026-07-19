const {
  SlashCommandBuilder,
  ChannelType,
  PermissionsBitField,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  RoleSelectMenuBuilder,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessageFlags,
} = require('discord.js');
const { getWelcomeConfig, saveWelcomeConfig, buildWelcomePayload } = require('../../utils/welcomeUtils');

function controlRows(config) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('welcome_channel').setLabel('📢 قناة الترحيب').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('welcome_role').setLabel('🎖️ الرتبة التلقائية').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('welcome_text').setLabel('📝 النص والعنوان').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('welcome_style').setLabel('🎨 المظهر').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('welcome_dm').setLabel('📩 رسالة الخاص').setStyle(ButtonStyle.Secondary),
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('welcome_toggle').setLabel(config.enabled ? '✅ النظام مفعل' : '❌ النظام متوقف').setStyle(config.enabled ? ButtonStyle.Success : ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('welcome_variables').setLabel('🏷️ المتغيرات').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('welcome_save').setLabel('💾 حفظ وإنهاء').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('welcome_cancel').setLabel('إلغاء').setStyle(ButtonStyle.Danger),
    ),
  ];
}

function settingsEmbed(interaction, config) {
  return new EmbedBuilder()
    .setColor(config.color || '#787575')
    .setTitle('معالج تسطيب الترحيب')
    .setDescription('عدّل الترحيب من الأزرار والقوائم بالأسفل. المعاينة تتحدث مباشرة، وعند الانتهاء اضغط **حفظ وإنهاء**.')
    .addFields(
      { name: 'القناة', value: config.channelId ? `<#${config.channelId}>` : 'لم يتم اختيارها', inline: true },
      { name: 'الرتبة التلقائية', value: config.roleId ? `<@&${config.roleId}>` : 'بدون رتبة', inline: true },
      { name: 'نوع الرسالة', value: config.mode === 'text' ? 'نصية' : 'إمبد', inline: true },
      { name: 'رسالة الخاص', value: config.dmEnabled ? 'مفعلة' : 'متوقفة', inline: true },
      { name: 'الحالة', value: config.enabled ? 'مفعل' : 'متوقف', inline: true },
      { name: 'أهم المتغيرات', value: '`{member}` `{user}` `{server}` `{member_count}` `{inviter}` `{invite_code}`', inline: false },
    )
    .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() })
    .setTimestamp();
}

module.exports = {
  adminsOnly: true,
  category: 'Welcome',
  data: new SlashCommandBuilder()
    .setName('setup-welcome')
    .setDescription('تسطيب نظام الترحيب برسالة تفاعلية خطوة بخطوة'),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({ content: '❌ تحتاج صلاحية الإدارة.', flags: MessageFlags.Ephemeral });
    }

    let config = await getWelcomeConfig(interaction.guild.id);
    await interaction.reply({ embeds: [settingsEmbed(interaction, config), new EmbedBuilder(buildWelcomePayload(config, interaction.member, {}).embeds?.[0]?.data || {}).setTitle('معاينة الترحيب')], components: controlRows(config), fetchReply: true });

    const filter = (i) => i.user.id === interaction.user.id;
    while (true) {
      try {
        const i = await interaction.channel.awaitMessageComponent({ filter, time: 900_000 });
        if (i.customId === 'welcome_cancel') {
          await i.deferUpdate();
          return i.editReply({ embeds: [new EmbedBuilder().setColor('#FF0000').setDescription('❌ تم إلغاء تسطيب الترحيب بدون حفظ تغييرات جديدة.')], components: [] });
        }
        if (i.customId === 'welcome_save') {
          await saveWelcomeConfig(interaction.guild.id, config);
          await i.deferUpdate();
          return i.editReply({ embeds: [settingsEmbed(interaction, config).setDescription('✅ تم حفظ نظام الترحيب بنجاح.')], components: [] });
        }
        if (i.customId === 'welcome_toggle') {
          config.enabled = !config.enabled;
          await i.deferUpdate();
        } else if (i.customId === 'welcome_variables') {
          await i.reply({ content: '`{member}` منشن العضو\n`{user}` اسم العضو\n`{tag}` التاق\n`{user_id}` آيدي العضو\n`{server}` اسم السيرفر\n`{member_count}` عدد الأعضاء\n`{inviter}` منشن الداعي\n`{inviter_name}` اسم الداعي\n`{invite_code}` كود الدعوة\n`{invite_uses}` استخدامات الدعوة\n`{created_at}` عمر الحساب\n`{joined_at}` وقت الدخول', flags: MessageFlags.Ephemeral });
          continue;
        } else if (i.customId === 'welcome_channel') {
          const row = new ActionRowBuilder().addComponents(new ChannelSelectMenuBuilder().setCustomId('welcome_select_channel').setPlaceholder('اختر قناة الترحيب').setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement));
          await i.reply({ content: 'اختر قناة الترحيب:', components: [row], flags: MessageFlags.Ephemeral });
          const selected = await i.channel.awaitMessageComponent({ filter, time: 120_000 });
          config.channelId = selected.values[0];
          await selected.update({ content: `✅ تم اختيار <#${config.channelId}>`, components: [] });
        } else if (i.customId === 'welcome_role') {
          const row = new ActionRowBuilder().addComponents(new RoleSelectMenuBuilder().setCustomId('welcome_select_role').setPlaceholder('اختر الرتبة التلقائية'));
          await i.reply({ content: 'اختر رتبة تعطى للعضو عند الدخول:', components: [row], flags: MessageFlags.Ephemeral });
          const selected = await i.channel.awaitMessageComponent({ filter, time: 120_000 });
          config.roleId = selected.values[0];
          await selected.update({ content: `✅ تم اختيار <@&${config.roleId}>`, components: [] });
        } else if (i.customId === 'welcome_text') {
          const modal = new ModalBuilder().setCustomId('welcome_text_modal').setTitle('نص الترحيب');
          modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('title').setLabel('عنوان الإمبد').setStyle(TextInputStyle.Short).setRequired(false).setValue(config.title || '')),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('message').setLabel('نص الترحيب').setStyle(TextInputStyle.Paragraph).setRequired(true).setValue(config.message || '')),
          );
          await i.showModal(modal);
          const m = await i.awaitModalSubmit({ filter, time: 180_000 });
          config.title = m.fields.getTextInputValue('title') || 'مرحبا بك في {server}';
          config.message = m.fields.getTextInputValue('message');
          await m.deferUpdate();
        } else if (i.customId === 'welcome_style') {
          const modal = new ModalBuilder().setCustomId('welcome_style_modal').setTitle('مظهر الترحيب');
          modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('color').setLabel('اللون مثل #00ff99').setStyle(TextInputStyle.Short).setRequired(false).setValue(config.color || '')),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('image').setLabel('رابط الصورة - اختياري').setStyle(TextInputStyle.Short).setRequired(false).setValue(config.image || '')),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('mode').setLabel('اكتب embed أو text').setStyle(TextInputStyle.Short).setRequired(true).setValue(config.mode || 'embed')),
          );
          await i.showModal(modal);
          const m = await i.awaitModalSubmit({ filter, time: 180_000 });
          config.color = m.fields.getTextInputValue('color') || '#787575';
          config.image = m.fields.getTextInputValue('image') || null;
          config.mode = m.fields.getTextInputValue('mode').toLowerCase() === 'text' ? 'text' : 'embed';
          await m.deferUpdate();
        } else if (i.customId === 'welcome_dm') {
          const modal = new ModalBuilder().setCustomId('welcome_dm_modal').setTitle('رسالة الخاص');
          modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('enabled').setLabel('تفعيل الخاص؟ اكتب نعم أو لا').setStyle(TextInputStyle.Short).setRequired(true).setValue(config.dmEnabled ? 'نعم' : 'لا')),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('message').setLabel('رسالة الخاص').setStyle(TextInputStyle.Paragraph).setRequired(false).setValue(config.dmMessage || '')),
          );
          await i.showModal(modal);
          const m = await i.awaitModalSubmit({ filter, time: 180_000 });
          config.dmEnabled = ['نعم', 'yes', 'on', 'true'].includes(m.fields.getTextInputValue('enabled').toLowerCase());
          config.dmMessage = m.fields.getTextInputValue('message') || config.dmMessage;
          await m.deferUpdate();
        }
        await interaction.editReply({ embeds: [settingsEmbed(interaction, config), new EmbedBuilder(buildWelcomePayload(config, interaction.member, {}).embeds?.[0]?.data || {}).setTitle('معاينة الترحيب')], components: controlRows(config) });
      } catch (error) {
        return interaction.editReply({ components: [], embeds: [new EmbedBuilder().setColor('#FF0000').setDescription('⌛ انتهى وقت معالج الترحيب. اكتب الأمر مرة أخرى للمتابعة.')] }).catch(() => null);
      }
    }
  },
};