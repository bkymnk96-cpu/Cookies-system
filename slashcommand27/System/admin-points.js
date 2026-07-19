const { SlashCommandBuilder, ChannelType, EmbedBuilder } = require('discord.js');
const { getAdminConfig, saveAdminConfig, getPoints, setPoints } = require('../../utils/adminPointsUtils');

module.exports = {
  adminsOnly: true,
  data: new SlashCommandBuilder()
    .setName('admin-points').setDescription('نظام نقاط وترقيات الإدارة')
    .addSubcommand((s)=>s.setName('setup').setDescription('تسطيب النظام').addChannelOption((o)=>o.setName('log').setDescription('روم اللوق').addChannelTypes(ChannelType.GuildText).setRequired(false)))
    .addSubcommand((s)=>s.setName('rank-add').setDescription('إضافة حد ترقية').addRoleOption((o)=>o.setName('role').setDescription('الرتبة').setRequired(true)).addIntegerOption((o)=>o.setName('points').setDescription('النقاط المطلوبة').setRequired(true).setMinValue(1)))
    .addSubcommand((s)=>s.setName('rank-remove').setDescription('حذف رتبة من الخطة').addRoleOption((o)=>o.setName('role').setDescription('الرتبة').setRequired(true)))
    .addSubcommand((s)=>s.setName('add').setDescription('إضافة نقاط لإداري').addUserOption((o)=>o.setName('user').setDescription('الإداري').setRequired(true)).addIntegerOption((o)=>o.setName('points').setDescription('النقاط').setRequired(true).setMinValue(1)).addStringOption((o)=>o.setName('reason').setDescription('السبب').setRequired(false)))
    .addSubcommand((s)=>s.setName('remove').setDescription('خصم نقاط').addUserOption((o)=>o.setName('user').setDescription('الإداري').setRequired(true)).addIntegerOption((o)=>o.setName('points').setDescription('النقاط').setRequired(true).setMinValue(1)).addStringOption((o)=>o.setName('reason').setDescription('السبب').setRequired(false)))
    .addSubcommand((s)=>s.setName('profile').setDescription('عرض نقاط إداري').addUserOption((o)=>o.setName('user').setDescription('الإداري').setRequired(false)))
    .addSubcommand((s)=>s.setName('leaderboard').setDescription('توب الإدارة'))
    .addSubcommand((s)=>s.setName('toggle').setDescription('تشغيل/إيقاف').addBooleanOption((o)=>o.setName('enabled').setDescription('الحالة').setRequired(true))),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    const config = await getAdminConfig(guildId);
    if (sub === 'setup') {
      await saveAdminConfig(guildId, { enabled: true, logChannelId: interaction.options.getChannel('log')?.id || config.logChannelId });
      return interaction.reply({ content: '✅ تم تسطيب نظام نقاط الإدارة. أضف الرتب عبر `/admin-points rank-add`.', ephemeral: true });
    }
    if (sub === 'toggle') { await saveAdminConfig(guildId, { enabled: interaction.options.getBoolean('enabled') }); return interaction.reply({ content: '✅ تم تحديث الحالة.', ephemeral: true }); }
    if (sub === 'rank-add') {
      const role = interaction.options.getRole('role'); const pts = interaction.options.getInteger('points');
      const ranks = config.ranks.filter((r)=>r.roleId !== role.id); ranks.push({ roleId: role.id, points: pts }); ranks.sort((a,b)=>a.points-b.points);
      await saveAdminConfig(guildId, { ranks }); return interaction.reply({ content: `✅ رتبة ${role} عند ${pts} نقطة.`, ephemeral: true });
    }
    if (sub === 'rank-remove') {
      const role = interaction.options.getRole('role'); await saveAdminConfig(guildId, { ranks: config.ranks.filter((r)=>r.roleId !== role.id) }); return interaction.reply({ content: '✅ تم حذف الرتبة من الخطة.', ephemeral: true });
    }
    const points = await getPoints(guildId);
    if (sub === 'profile') {
      const user = interaction.options.getUser('user') || interaction.user; const total = points[user.id]?.total || 0;
      const next = config.ranks.filter((r)=>r.points > total).sort((a,b)=>a.points-b.points)[0];
      return interaction.reply({ content: `📊 نقاط ${user}: **${total}**${next ? `\nالترقية القادمة: <@&${next.roleId}> عند ${next.points} نقطة.` : '\nلا توجد ترقية قادمة.'}`, ephemeral: true });
    }
    if (sub === 'leaderboard') {
      const rows = Object.entries(points).sort((a,b)=>(b[1].total||0)-(a[1].total||0)).slice(0,10).map(([id,v],i)=>`${i+1}. <@${id}> — **${v.total||0}**`).join('\n') || 'لا توجد نقاط.';
      return interaction.reply({ content: rows, ephemeral: true });
    }
    if (!config.enabled) return interaction.reply({ content: '❌ نظام نقاط الإدارة متوقف.', ephemeral: true });
    const user = interaction.options.getUser('user'); const amount = interaction.options.getInteger('points'); const reason = interaction.options.getString('reason') || 'بدون سبب';
    const current = points[user.id]?.total || 0; const total = sub === 'add' ? current + amount : Math.max(0, current - amount);
    points[user.id] = { total, updatedAt: Date.now() }; await setPoints(guildId, points);
    const reached = config.ranks.filter((r)=>current < r.points && total >= r.points).sort((a,b)=>b.points-a.points)[0];
    if (reached && config.notifyAtMax) await user.send(`🎉 وصلت إلى **${total}** نقطة في **${interaction.guild.name}** وتستطيع طلب ترقية رتبة <@&${reached.roleId}> بعد التواصل مع مسؤول الإدارة.`).catch(()=>null);
    const log = config.logChannelId ? interaction.guild.channels.cache.get(config.logChannelId) : null;
    if (log) log.send({ embeds: [new EmbedBuilder().setTitle('نقاط الإدارة').setDescription(`${interaction.user} ${sub === 'add' ? 'أضاف' : 'خصم'} **${amount}** نقطة لـ ${user}\nالمجموع: **${total}**\nالسبب: ${reason}`).setTimestamp()] }).catch(()=>null);
    return interaction.reply({ content: `✅ أصبح رصيد ${user} هو **${total}** نقطة.${reached ? ' تم تنبيهه بالخاص لاستلام الترقية.' : ''}`, ephemeral: true });
  },
};
