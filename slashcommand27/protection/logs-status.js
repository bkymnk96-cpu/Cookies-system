const { ChatInputCommandInteraction , Client , SlashCommandBuilder, EmbedBuilder ,ButtonStyle, PermissionsBitField, ButtonBuilder, ActionRowBuilder } = require("discord.js");
const { Database } = require("st.db")
const db = new Database("/Json-db/Bots/protectDB.json")
module.exports = {
    ownersOnly:true,
    data: new SlashCommandBuilder()
    .setName('protection-status')
    .setDescription('للاستعلام عن حالة نظام الحماية'), // or false
    /**
     * @param {ChatInputCommandInteraction} interaction
     * @param {Client} client
     */
async execute(interaction , client) {
    await interaction.deferReply({ephemeral:false})
    try {
        const banStatus = db.get(`ban_status_${interaction.guild.id}`) || null;
        const banLimit = db.get(`ban_limit_${interaction.guild.id}`);

        const botsStatus = db.get(`antibots_status_${interaction.guild.id}`) || null;
        const botsLimit = "غير محدد"

        const delteRolesStatus = db.get(`antideleteroles_status_${interaction.guild.id}`) || null;
        const delteRolesLimit = db.get(`antideleteroles_limit_${interaction.guild.id}`) || "غير محدد"

        const deleteRoomsStatus = db.get(`antideleterooms_status_${interaction.guild.id}`) || null;
        const deleteRoomsLimit = db.get(`antideleterooms_limit_${interaction.guild.id}`) || "غير محدد"

        const embed = new EmbedBuilder()
                            .setTitle('حالة نظام الحماية')
                            .addFields(
                                {name : `الحماية من البوتات` , value : `الحالة : ${botsStatus == "on" ? "🟢" : "🔴"} \n العدد المسموح : \`${botsLimit}\``},
                                {name : `الحماية من الباند` , value : `الحالة : ${banStatus == "on" ? "🟢" : "🔴"} \n العدد المسموح : \`${banLimit >= 0 ? banLimit : "غير محدد"}\``},
                                {name : `الحماية من حذف الرومات` , value : `الحالة : ${deleteRoomsStatus == "on" ? "🟢" : "🔴"} \n العدد المسموح : \`${deleteRoomsLimit}\``},
                                {name : `الحماية من حذف الرتب` , value : `الحالة : ${delteRolesStatus == "on" ? "🟢" : "🔴"} \n العدد المسموح : \`${delteRolesLimit}\``}
                            )
        await interaction.editReply({embeds : [embed]})
    } catch {
    }
}
}