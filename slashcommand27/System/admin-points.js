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
  UserSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessageFlags,
} = require('discord.js');
const { getAdminConfig, saveAdminConfig, getPoints, setPoints } = require('../../utils/adminPointsUtils');

function panelRows(config) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('admin_toggle').setLabel(config.enabled ? '✅ النظام مفعل' : '❌ النظام متوقف').setStyle(config.enabled ? ButtonStyle.Success : ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('admin_log').setLabel('📜 قناة اللوق').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('admin_rank_add').setLabel('➕ إضافة رتبة ترقية').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('admin_rank_remove').setLabel('➖ حذف رتبة').setStyle(ButtonStyle.Secondary),
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('admin_points_add').setLabel('⭐ إضافة نقاط').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('admin_points_remove').setLabel('🔻 خصم نقاط').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('admin_profile').setLabel('👤 ملف إداري').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('admin_top').setLabel('🏆 التوب').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('admin_close').setLabel('إغلاق').setStyle(ButtonStyle.Danger),
    ),
  ];
}

function panelEmbed(interaction, config) {
  const ranks = config.ranks.length
    ? config.ranks.sort((a, b) => a.points - b.points).map((r) => `<@&${r.roleId}> — **${r.points}** نقطة`).join('\n')
    : 'لم يتم تحديد رتب ترقية بعد.';
  return new EmbedBuilder()
    .setColor(config.enabled ? '#00AA66' : '#AA0000')
    .setTitle('لوحة تسطيب وإدارة نقاط الإدارة')
    .setDescription('استخدم الأزرار والقوائم لإعداد النظام وإدارة نقاط الإداريين بدون كتابة خيارات داخل أمر السلاش.')
    .addFields(
      { name: 'الحالة', value: config.enabled ? 'مفعل' : 'متوقف', inline: true },
      { name: 'قناة اللوق', value: config.logChannelId ? `<#${config.logChannelId}>` : 'غير محددة', inline: true },
      { name: 'خطة الترقيات', value: ranks.slice(0, 1024), inline: false },
    )
    .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL() })
    .setTimestamp();
}

async function pickUser(i, filter, text) {
  const row = new ActionRowBuilder().addComponents(new UserSelectMenuBuilder().setCustomId(`admin_user_${Date.now()}`).setPlaceholder('اختر الإداري'));
  await i.reply({ content: text, components: [row], flags: MessageFlags.Ephemeral });
  const selected = await i.channel.awaitMessageComponent({ filter, time: 120_000 });
  await selected.update({ content: '✅ تم اختيار الإداري.', components: [] });
  return selected.values[0];
}

async function askAmountReason(i, filter, title) {
  const modal = new ModalBuilder().setCustomId(`admin_amount_${Date.now()}`).setTitle(title);
  modal.addComponents(
    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('amount').setLabel('عدد النقاط').setStyle(TextInputStyle.Short).setRequired(true)),
    new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('reason').setLabel('السبب').setStyle(TextInputStyle.Paragraph).setRequired(false)),
  );
  await i.showModal(modal);
  const m = await i.awaitModalSubmit({ filter, time: 180_000 });
  const amount = Number(m.fields.getTextInputValue('amount'));
  const reason = m.fields.getTextInputValue('reason') || 'بدون سبب';
  await m.deferUpdate();
  return { amount: Number.isFinite(amount) && amount > 0 ? amount : 0, reason };
}

module.exports = {
  adminsOnly: true,
  category: 'AdminPoints',
  data: new SlashCommandBuilder()
    .setName('admin-points')
    .setDescription('تسطيب وإدارة نظام نقاط الإدارة من لوحة تفاعلية واحدة'),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({ content: '❌ تحتاج صلاحية الإدارة.', flags: MessageFlags.Ephemeral });
    }

    let config = await getAdminConfig(interaction.guild.id);
    await interaction.reply({ embeds: [panelEmbed(interaction, config)], components: panelRows(config), fetchReply: true });
    const filter = (i) => i.user.id === interaction.user.id;

    while (true) {
      try {
        const i = await interaction.channel.awaitMessageComponent({ filter, time: 900_000 });
        if (i.customId === 'admin_close') {
          await i.deferUpdate();
          return i.editReply({ embeds: [panelEmbed(interaction, config).setDescription('✅ تم إغلاق لوحة نظام الإدارة.')], components: [] });
        }
        if (i.customId === 'admin_toggle') {
          config = await saveAdminConfig(interaction.guild.id, { enabled: !config.enabled });
          await i.deferUpdate();
        } else if (i.customId === 'admin_log') {
          const row = new ActionRowBuilder().addComponents(new ChannelSelectMenuBuilder().setCustomId('admin_select_log').setPlaceholder('اختر قناة اللوق').setChannelTypes(ChannelType.GuildText));
          await i.reply({ content: 'اختر قناة لوق نقاط الإدارة:', components: [row], flags: MessageFlags.Ephemeral });
          const selected = await i.channel.awaitMessageComponent({ filter, time: 120_000 });
          config = await saveAdminConfig(interaction.guild.id, { enabled: true, logChannelId: selected.values[0] });
          await selected.update({ content: `✅ تم اختيار <#${selected.values[0]}>`, components: [] });
        } else if (i.customId === 'admin_rank_add') {
          const row = new ActionRowBuilder().addComponents(new RoleSelectMenuBuilder().setCustomId('admin_select_rank').setPlaceholder('اختر رتبة الترقية'));
          await i.reply({ content: 'اختر رتبة الترقية:', components: [row], flags: MessageFlags.Ephemeral });
          const selected = await i.channel.awaitMessageComponent({ filter, time: 120_000 });
          await selected.update({ content: '✅ تم اختيار الرتبة، اكتب النقاط المطلوبة في النافذة.', components: [] });
          const modal = new ModalBuilder().setCustomId('admin_rank_points').setTitle('نقاط رتبة الترقية');
          modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('points').setLabel('النقاط المطلوبة للترقية').setStyle(TextInputStyle.Short).setRequired(true)));
          await i.followUp({ content: 'اضغط الزر التالي لإدخال عدد النقاط.', components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('admin_rank_points_open').setLabel('إدخال النقاط').setStyle(ButtonStyle.Primary))], flags: MessageFlags.Ephemeral });
          const open = await i.channel.awaitMessageComponent({ filter, time: 120_000 });
          await open.showModal(modal);
          const m = await open.awaitModalSubmit({ filter, time: 180_000 });
          const points = Number(m.fields.getTextInputValue('points'));
          await m.deferUpdate();
          if (Number.isFinite(points) && points > 0) {
            const ranks = config.ranks.filter((r) => r.roleId !== selected.values[0]);
            ranks.push({ roleId: selected.values[0], points });
            ranks.sort((a, b) => a.points - b.points);
            config = await saveAdminConfig(interaction.guild.id, { enabled: true, ranks });
          }
        } else if (i.customId === 'admin_rank_remove') {
          if (!config.ranks.length) { await i.reply({ content: 'لا توجد رتب لحذفها.', flags: MessageFlags.Ephemeral }); continue; }
          const row = new ActionRowBuilder().addComponents(new RoleSelectMenuBuilder().setCustomId('admin_remove_rank').setPlaceholder('اختر رتبة لحذفها'));
          await i.reply({ content: 'اختر الرتبة التي تريد حذفها من خطة الترقيات:', components: [row], flags: MessageFlags.Ephemeral });
          const selected = await i.channel.awaitMessageComponent({ filter, time: 120_000 });
          config = await saveAdminConfig(interaction.guild.id, { ranks: config.ranks.filter((r) => r.roleId !== selected.values[0]) });
          await selected.update({ content: '✅ تم حذف الرتبة من الخطة.', components: [] });
        } else if (i.customId === 'admin_points_add' || i.customId === 'admin_points_remove') {
          if (!config.enabled) { await i.reply({ content: '❌ فعّل النظام أولاً من زر الحالة.', flags: MessageFlags.Ephemeral }); continue; }
          const userId = await pickUser(i, filter, 'اختر الإداري:');
          await i.followUp({ content: 'اضغط الزر لإدخال عدد النقاط والسبب.', components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('admin_amount_open').setLabel('إدخال النقاط').setStyle(ButtonStyle.Primary))], flags: MessageFlags.Ephemeral });
          const open = await i.channel.awaitMessageComponent({ filter, time: 120_000 });
          const { amount, reason } = await askAmountReason(open, filter, i.customId === 'admin_points_add' ? 'إضافة نقاط' : 'خصم نقاط');
          if (!amount) continue;
          const allPoints = await getPoints(interaction.guild.id);
          const current = allPoints[userId]?.total || 0;
          const total = i.customId === 'admin_points_add' ? current + amount : Math.max(0, current - amount);
          allPoints[userId] = { total, updatedAt: Date.now() };
          await setPoints(interaction.guild.id, allPoints);
          const reached = config.ranks.filter((r) => current < r.points && total >= r.points).sort((a, b) => b.points - a.points)[0];
          const user = await interaction.client.users.fetch(userId).catch(() => null);
          if (user && reached && config.notifyAtMax) await user.send(`🎉 وصلت إلى **${total}** نقطة في **${interaction.guild.name}** وتستطيع طلب ترقية رتبة <@&${reached.roleId}> بعد التواصل مع مسؤول الإدارة.`).catch(() => null);
          const log = config.logChannelId ? interaction.guild.channels.cache.get(config.logChannelId) : null;
          if (log) await log.send({ embeds: [new EmbedBuilder().setTitle('نقاط الإدارة').setDescription(`${interaction.user} ${i.customId === 'admin_points_add' ? 'أضاف' : 'خصم'} **${amount}** نقطة لـ <@${userId}>\nالمجموع: **${total}**\nالسبب: ${reason}`).setTimestamp()] }).catch(() => null);
        } else if (i.customId === 'admin_profile') {
          const userId = await pickUser(i, filter, 'اختر الإداري لعرض ملفه:');
          const allPoints = await getPoints(interaction.guild.id);
          const total = allPoints[userId]?.total || 0;
          const next = config.ranks.filter((r) => r.points > total).sort((a, b) => a.points - b.points)[0];
          await i.followUp({ content: `📊 نقاط <@${userId}>: **${total}**${next ? `\nالترقية القادمة: <@&${next.roleId}> عند ${next.points} نقطة.` : '\nلا توجد ترقية قادمة.'}`, flags: MessageFlags.Ephemeral });
        } else if (i.customId === 'admin_top') {
          await i.deferUpdate();
          const allPoints = await getPoints(interaction.guild.id);
          const rows = Object.entries(allPoints).sort((a, b) => (b[1].total || 0) - (a[1].total || 0)).slice(0, 10).map(([id, v], index) => `${index + 1}. <@${id}> — **${v.total || 0}**`).join('\n') || 'لا توجد نقاط.';
          await interaction.followUp({ content: rows, flags: MessageFlags.Ephemeral });
        }
        config = await getAdminConfig(interaction.guild.id);
        await interaction.editReply({ embeds: [panelEmbed(interaction, config)], components: panelRows(config) });
      } catch (error) {
        return interaction.editReply({ components: [], embeds: [new EmbedBuilder().setColor('#FF0000').setDescription('⌛ انتهى وقت لوحة الإدارة. اكتب الأمر مرة أخرى للمتابعة.')] }).catch(() => null);
      }
    }
  },
};