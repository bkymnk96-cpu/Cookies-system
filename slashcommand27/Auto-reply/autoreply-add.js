const {ChatInputCommandInteraction , Client , SlashCommandBuilder, EmbedBuilder , PermissionsBitField, ActionRowBuilder,ButtonBuilder,MessageComponentCollector,ButtonStyle } = require("discord.js");
const { Database } = require("st.db")
const CookiesDB = new Database("/Json-db/Bots/CookiesDB.json")

module.exports ={
    adminsOnly:true,
    data: new SlashCommandBuilder()
    .setName('autoreply-add')
    .setDescription('لاضافة رد تلقائي')
    .addStringOption(Option => Option
                            .setName(`word`)
                            .setDescription(`الكلمة`)
                            .setRequired(true))
    .addStringOption(Option => Option
                                .setName(`reply`)
                                .setDescription(`الرد`)
                                .setRequired(true)),
    /**
     * @param {ChatInputCommandInteraction} interaction
     * @param {Client} client
     */
    async execute(interaction, client) {
        try {
            await interaction.deferReply();
            const word = interaction.options.getString(`word`)
            const reply = interaction.options.getString(`reply`)

            const data = await CookiesDB.get(`replys_${interaction.guild.id}`);
            if(data){
                const replyCheck = data.find((r) => r.word == word);
                if(replyCheck){
                    return interaction.editReply({content : `**هذا الرد \`${word}\` موجود بالفعل**`})
                }else{
                    await CookiesDB.push(`replys_${interaction.guild.id}` , {
                        "word" : word,
                        "reply" : reply,
                        "addedBy" : interaction.user.id
                    })
                }
            }else{
                await CookiesDB.set(`replys_${interaction.guild.id}` , [
                    {
                        "word" : word,
                        "reply" : reply,
                        "addedBy" : interaction.user.id
                    }
                ])
            }

            await interaction.editReply({content : `** تم اضافة الرد التلقائي ل __${word}__ **`})

        } catch {
            return interaction.editReply({content:`**لقد حدث خطا اتصل بالمطورين**`})
        }
    }
}
 