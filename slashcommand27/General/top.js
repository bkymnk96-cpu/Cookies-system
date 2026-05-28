const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { getTextScores, getVoiceScores, getTopEntries, formatVoiceDuration } = require("../../utils/activityUtils");

function formatTextTop(entries) {
    if (!entries.length) return "لا توجد بيانات نشاط كتابي حتى الآن.";
    return entries
        .map(([userId, count], index) => `**${index + 1}.** <@${userId}> — \`${count}\` رسالة`)
        .join("\n");
}

function formatVoiceTop(entries) {
    if (!entries.length) return "لا توجد بيانات نشاط صوتي حتى الآن.";
    return entries
        .map(([userId, duration], index) => `**${index + 1}.** <@${userId}> — \`${formatVoiceDuration(duration)}\``)
        .join("\n");
}

module.exports = {
    ownersOnly: false,
    data: new SlashCommandBuilder()
        .setName("top")
        .setDescription("عرض توب النشاط الكتابي والصوتي")
        .addStringOption(option =>
            option
                .setName("type")
                .setDescription("نوع التوب المطلوب عرضه")
                .setRequired(false)
                .addChoices(
                    { name: "كتابي", value: "text" },
                    { name: "صوتي", value: "voice" }
                )
        ),
    async execute(interaction) {
        await interaction.deferReply();

        const type = interaction.options.getString("type");
        const textScores = await getTextScores(interaction.guild.id);
        const voiceScores = await getVoiceScores(interaction.guild.id);

        const embed = new EmbedBuilder()
            .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) })
            .setColor("DarkButNotBlack")
            .setTimestamp()
            .setFooter({ text: `طلب بواسطة ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });

        if (type === "text") {
            embed
                .setTitle("توب النشاط الكتابي")
                .setDescription(formatTextTop(getTopEntries(textScores, 10)));
            return interaction.editReply({ embeds: [embed] });
        }

        if (type === "voice") {
            embed
                .setTitle("توب النشاط الصوتي")
                .setDescription(formatVoiceTop(getTopEntries(voiceScores, 10)));
            return interaction.editReply({ embeds: [embed] });
        }

        embed
            .setTitle("توب النشاط")
            .addFields(
                { name: "أفضل 5 في النشاط الكتابي", value: formatTextTop(getTopEntries(textScores, 5)), inline: false },
                { name: "أفضل 5 في النشاط الصوتي", value: formatVoiceTop(getTopEntries(voiceScores, 5)), inline: false }
            );

        return interaction.editReply({ embeds: [embed] });
    }
};
