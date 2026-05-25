const { ChatInputCommandInteraction , Client, Collection,SlashCommandBuilder, discord,GatewayIntentBits, Partials , EmbedBuilder, ApplicationCommandOptionType , Events , ActionRowBuilder , ButtonBuilder ,MessageAttachment, ButtonStyle , Message } = require("discord.js");
const { Database } = require("st.db")
const systemDB = new Database("/Json-db/Bots/systemDB.json")
const axios = require("axios");
module.exports = {
    ownersOnly:false,
    data: new SlashCommandBuilder()
    .setName('banner')
    .setDescription('رؤية بانرك او شخص اخر')
    .addUserOption(Option => Option
        .setName(`user`)
        .setDescription(`الشخص`)
        .setRequired(false)), // or false
        /**
         * 
         * @param {ChatInputCommandInteraction} interaction 
         */
async execute(interaction) {
    await interaction.deferReply();
    try {
        const member = interaction.options.getMember(`user`) || interaction.member;
        const user = interaction.options.getUser(`user`) || interaction.user;
        const tokensData = tokens.get(`one4all`) || [];
        const data = tokensData.find((a) => a.clientId === interaction.client.user.id)
        if(!data) return await interaction.editReply({content : `لقد حدث خطا اتصل بالمطورين`})
    axios.get(`https://discord.com/api/users/${member.id}` , {
        headers : {
            Authorization: `Bot ${data.token}`,
        }
    }).then(async(res) => {
        const { banner, accent_color } = res.data;
        if(banner){
            const extension = banner.startsWith("a_") ? ".gif" : ".png";
            const url = `https://cdn.discordapp.com/banners/${member.id}/${banner}${extension}?size=2048`;
            let button = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                            .setStyle(5)
                            .setLabel("Download")
                            .setURL(url)
            )
            
            let embed = new EmbedBuilder()
                                .setAuthor({name:user.username , iconURL:user.displayAvatarURL({dynamic:true , size:1024})})
                                .setTitle(`Banner link`)
                                .setURL(url)
                                .setImage(url)
                                .setFooter({text:`Requested by ` + interaction.user.username , iconURL:interaction.user.displayAvatarURL({dynamic:true})})

            await interaction.editReply({embeds : [embed] , components : [button]});
        }else{
            if(accent_color){
                let url = `https://serux.pro/rendercolour?hex=${accent_color}&height=200&width=512` 
                let embed = new EmbedBuilder()
                .setAuthor({name:user.username , iconURL:user.displayAvatarURL({dynamic:true , size:1024})})
                .setTitle(`Banner link`)
                .setURL(url)
                .setImage(url)
                .setColor(accent_color)
                .setFooter({text:`Requested by ` + interaction.user.username , iconURL:interaction.user.displayAvatarURL({dynamic:true})})

                await interaction.editReply({embeds : [embed]});
            }else{
                await interaction.editReply({content : `**هذا العضو __لا يمتلك بانر__**`})
            }
        }
    })  
    } catch (error) {
        console.log("🔴 | error in banner command" , error)
        await interaction.editReply({content : `لقد حدث خطا اتصل بالمطورين`})
    }
}
}