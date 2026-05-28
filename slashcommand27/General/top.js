const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    StringSelectMenuBuilder, 
    StringSelectMenuOptionBuilder 
} = require("discord.js");

const { 
    getTextScores, 
    getVoiceScores, 
    getTopEntries, 
    getUserRankAndScore, 
    getNextResetTimestamp, 
    formatVoiceDuration 
} = require("../../utils/activityUtils");

// مسميات وإيموجيات الواجهة لكل فترة زمنية
const TIMEFRAME_DETAILS = {
    alltime: { label: "الشامل", emoji: "🏆", sub: "كل الوقت" },
    daily: { label: "اليومي", emoji: "📅", sub: "إعادة ضبط كل يوم" },
    weekly: { label: "الأسبوعي", emoji: "📆", sub: "إعادة ضبط كل أسبوع" },
    monthly: { label: "الشهري", emoji: "🌙", sub: "إعادة ضبط كل شهر" }
};

// دالة لتنسيق أسطر المراكز بشكل جمالي متطابق مع التصميم المطلوب
function formatLeaderboardRows(entries, type) {
    if (!entries.length) return "*لا توجد بيانات نشاط في هذه الفترة حتى الآن.*";
    return entries
        .map(([userId, value], index) => {
            let badge = "";
            if (index === 0) badge = "🥇 ";
            else if (index === 1) badge = "🥈 ";
            else if (index === 2) badge = "🥉 ";
            else badge = `\`#${index + 1}\` `;

            const formattedValue = type === "text" 
                ? `\`${value.toLocaleString()}\` رسالة` 
                : `\`${formatVoiceDuration(value)}\``;

            return `${badge}<@${userId}> — ${formattedValue}`;
        })
        .join("\n");
}

// دالة بناء الإمبيد والقائمة المنسدلة بناءً على الفترة الزمنية المحددة
async function buildLeaderboardResponse(interaction, timeframe) {
    const textScores = await getTextScores(interaction.guild.id, timeframe);
    const voiceScores = await getVoiceScores(interaction.guild.id, timeframe);

    const topText = getTopEntries(textScores, 5);
    const topVoice = getTopEntries(voiceScores, 5);

    const details = TIMEFRAME_DETAILS[timeframe];
    const resetTime = getNextResetTimestamp(timeframe);
    
    // بناء نص الوصف الأساسي مع الوقت الديناميكي للتصفير إذا توفر
    let description = `الأعضاء الأكثر تفاعلاً في **${interaction.guild.name}**\n`;
    if (resetTime) {
        description += `🔄 يُعاد الضبط: <t:${resetTime}:F> — (<t:${resetTime}:R>)\n`;
    }
    
    description += `\n**💬 TOP TEXT**\n${formatLeaderboardRows(topText, "text")}\n`;
    description += `\n───────────────────\n`;
    description += `\n**🎙️ TOP VOICE**\n${formatLeaderboardRows(topVoice, "voice")}\n`;
    description += `\n───────────────────\n`;

    // حساب رتبة المستدعي الحالي لإظهارها في الأسفل بدقة
    const textRankObj = getUserRankAndScore(textScores, interaction.user.id);
    const voiceRankObj = getUserRankAndScore(voiceScores, interaction.user.id);
    
    const formattedUserVoice = voiceRankObj.score > 0 ? formatVoiceDuration(voiceRankObj.score) : "0 دقيقة";
    
    description += `📍 <@${interaction.user.id}> — 💬 #${textRankObj.rank} — \`${textRankObj.score.toLocaleString()}\` رسالة | 🎙️ #${voiceRankObj.rank} — \`${formattedUserVoice}\``;

    const embed = new EmbedBuilder()
        .setTitle(`👑 قائمة المتصدرين — ${details.label} ${details.emoji}`)
        .setDescription(description)
        .setColor("#FFC0CB") // اللون الوردي الجمالي المريح للعين المتطابق مع الصورة
        .setTimestamp();

    // إنشاء القائمة المنسدلة وضبط الخيار النشط حالياً كخيار افتراضي
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("leaderboard_select")
        .setPlaceholder("📅 اختاري الفترة الزمنية...")
        .addOptions(
            Object.entries(TIMEFRAME_DETAILS).map(([key, data]) => 
                new StringSelectMenuOptionBuilder()
                    .setLabel(data.label)
                    .setDescription(data.sub)
                    .setValue(key)
                    .setEmoji(data.emoji)
                    .setDefault(key === timeframe)
            )
        );

    const row = new ActionRowBuilder().addComponents(selectMenu);

    return { embeds: [embed], components: [row] };
}

module.exports = {
    ownersOnly: false,
    data: new SlashCommandBuilder()
        .setName("top")
        .setDescription("عرض قائمة المتصدرين التفاعلية للنشاط الكتابي والصوتي"),
        
    async execute(interaction) {
        // تأخير الرد لتفادي مشاكل الـ Timeout أثناء جلب البيانات
        const reply = await interaction.deferReply({ fetchReply: true });

        // العرض الافتراضي المبدئي يكون للتوب "الشهري" كما في الصورة الأولى
        const initialResponse = await buildLeaderboardResponse(interaction, "monthly");
        await interaction.editReply(initialResponse);

        // إنشاء مجمع التفاعلات للقائمة المنسدلة (يعمل لمدة 5 دقائق)
        const collector = reply.createMessageComponentCollector({
            filter: (i) => i.user.id === interaction.user.id,
            time: 60000 * 5
        });

        collector.on("collect", async (i) => {
            // تحديث فوري داخلي لمنع ظهور "This interaction failed"
            await i.deferUpdate(); 
            
            const selectedTimeframe = i.values[0];
            const updatedResponse = await buildLeaderboardResponse(interaction, selectedTimeframe);
            
            // تعديل الرسالة نفسها بالبيانات الجديدة والفترة المختارة بسلاسة
            await interaction.editReply(updatedResponse);
        });

        // عند انتهاء وقت التفاعل، يتم تعطيل القائمة المنسدلة لحفظ موارد البوت
        collector.on("end", async () => {
            const currentEmbeds = (await interaction.fetchReply()).embeds;
            const disabledMenu = new StringSelectMenuBuilder()
                .setCustomId("leaderboard_select_disabled")
                .setPlaceholder("انتهت صلاحية قائمة التفاعل الحالية.")
                .addOptions(new StringSelectMenuOptionBuilder().setLabel("منتهي").setValue("disabled"))
                .setDisabled(true);

            const disabledRow = new ActionRowBuilder().addComponents(disabledMenu);
            await interaction.editReply({ embeds: currentEmbeds, components: [disabledRow] }).catch(() => {});
        });
    }
};