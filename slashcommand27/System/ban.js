const { ChatInputCommandInteraction, Client, Collection, PermissionsBitField, SlashCommandBuilder, discord, GatewayIntentBits, Partials, EmbedBuilder, ApplicationCommandOptionType, Events, ActionRowBuilder, ButtonBuilder, MessageAttachment, ButtonStyle, Message } = require("discord.js");
const { Database } = require("st.db")
const systemDB = new Database("/Json-db/Bots/systemDB.json")

module.exports = {
    ownersOnly: false,
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('اعطاء بان لشخص او ازالته')
        .addUserOption(Option => Option
            .setName(`member`)
            .setDescription(`الشخص`)
            .setRequired(true))
        .addStringOption(Option => Option
            .setName(`reason`)
            .setDescription(`السبب`)
            .setRequired(false)),
    /**
     * @param {ChatInputCommandInteraction} interaction
     * @param {Client} client
     */
    async execute(interaction, client) {
        try {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
                return interaction.reply({ content: `**لا تمتلك صلاحية لفعل ذلك**`, ephemeral: true });
            }

            const user = interaction.options.getUser(`member`);
            const member = interaction.options.getMember(`member`);
            const reason = `${interaction.options.getString(`reason`)} ,  By : ${interaction.user.id}` ?? `By : ${interaction.user.id}`;

            const banList = await interaction.guild.bans.fetch();
            const bannedUser = banList.get(user.id);

            if (!bannedUser) {
                if(!member) return interaction.reply({ content: `**لم اجد هذا العضو**`, ephemeral: true });
                await member.ban({ reason: reason }).catch(async () => {
                    return interaction.reply({ content: `**الرجاء التحقق من صلاحياتي ثم اعادة المحاولة**`, ephemeral: true });
                });
                return interaction.reply({ content: `**تم اعطاء البان الى الشخص بنجاح**` });
            } else {
                await interaction.guild.members.unban(user.id).catch(async () => {
                    return interaction.reply({ content: `**الرجاء التحقق من صلاحياتي ثم اعادة المحاولة**`, ephemeral: true });
                });
                return interaction.reply({ content: `**تم ازالة البان الى الشخص بنجاح**` });
            }
        } catch (error) {
            interaction.reply({content : `لقد حدث خطا اتصل بالمطورين` , ephemeral : true})
            console.log(error);
        }
    }
}
