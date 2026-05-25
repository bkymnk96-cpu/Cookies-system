const {ChatInputCommandInteraction , Client , SlashCommandBuilder, EmbedBuilder , PermissionsBitField, ActionRowBuilder,ButtonBuilder,MessageComponentCollector,ButtonStyle } = require("discord.js");
const { Database } = require("st.db")
const one4allDB = new Database("/Json-db/Bots/one4allDB.json")

module.exports ={
    adminsOnly:true,
    data: new SlashCommandBuilder()
    .setName('autoreply-list')
    .setDescription('لرؤية جميع الردود'),
    /**
     * @param {ChatInputCommandInteraction} interaction
     * @param {Client} client
     */
    async execute(interaction, client) {
        try {
            await interaction.deferReply();
            const word = interaction.options.getString(`word`)
            const reply = interaction.options.getString(`reply`)

            const data = await one4allDB.get(`replys_${interaction.guild.id}`);
            if(data){
                if(data.length > 0){
                    const embed = new EmbedBuilder()
                                            .setTitle('جميع الردود التلقائية')
                                            .setThumbnail(interaction.guild.iconURL({dynamic : true}))
                                            .setAuthor({name : interaction.client.user.username , iconURL : interaction.client.user.displayAvatarURL({dynamic : true})})
                                            .setFooter({text : `Requested by : ${interaction.user.username}` , iconURL : interaction.user.displayAvatarURL({dynamic : true})});
                    await data.forEach(async(d) => {
                       const { word , reply } = d;
                        embed.addFields(
                        {name : `الكلمة : \`${word}\`` , value : `**الرد :** __${reply}__`}
                       )
                    })
                    embed.addFields({name : `\n` , value : `\`\`\`يوجد ${data.length} ردود في السيرفر\`\`\``})
                    return interaction.editReply({embeds : [embed]})
                }else{
                    return interaction.editReply({content : `**لا توجد أي ردود تلقائية مسجلة لهذا السيرفر.**`})
                }
            }else{
                return interaction.editReply({content : `**لا توجد أي ردود تلقائية مسجلة لهذا السيرفر.**`})
            }
        } catch {
            return interaction.editReply({content:`**لقد حدث خطا اتصل بالمطورين**`})
        }
    }
}
 