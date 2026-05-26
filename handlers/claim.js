const { StringSelectMenuOptionBuilder, StringSelectMenuBuilder, SlashCommandBuilder, Events, ActivityType, ModalBuilder, TextInputStyle, EmbedBuilder, PermissionsBitField, ButtonStyle, TextInputBuilder, ActionRowBuilder, ButtonBuilder, MessageComponentCollector, Embed } = require("discord.js")
const keyValueService = require("../services/keyValueService");

const select = new StringSelectMenuBuilder()
    .setCustomId('supportPanel')
    .setPlaceholder('لوحة تحكم السبورت')
    .addOptions(
        new StringSelectMenuOptionBuilder().setLabel('تغيير اسم التكت').setValue('renameTicket').setEmoji('✍🏼'),
        new StringSelectMenuOptionBuilder().setLabel('اضافة عضو للتذكرة').setValue('addMemberToTicket').setEmoji('✅'),
        new StringSelectMenuOptionBuilder().setLabel('حذف عضو من التذكرة').setValue('removeMemberFromTicket').setEmoji('⛔'),
        new StringSelectMenuOptionBuilder().setLabel('اعادة تحميل').setValue('refreshSupportPanel').setEmoji('🔄')
    )

const Row2 = new ActionRowBuilder().addComponents(select)

module.exports = (client7) => {
    client7.on(Events.InteractionCreate, async (interaction) => {
        if (interaction.isButton()) {
            const [action] = interaction.customId.split('_')

            if (action === 'claim') {
                const Support = await keyValueService.get('ticketDB', `TICKET-PANEL_${interaction.channel.id}`).Support
                if (!interaction.member.roles.cache.has(Support)) {
                    return interaction.reply({ content: `:x: Only Support`, ephemeral: true })
                }

                await keyValueService.set('ticketDB', `Claimed_${interaction.channel.id}`, interaction.user.id)

                const Row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder().setStyle(ButtonStyle.Danger).setLabel('إغلاق').setEmoji('🔒').setCustomId(`close`),
                        new ButtonBuilder().setCustomId('55555555555').setStyle(ButtonStyle.Success).setDisabled().setEmoji('✅').setLabel(`بواسطة ${interaction.user.username}`),
                        new ButtonBuilder().setCustomId('unclaim').setStyle(ButtonStyle.Secondary).setEmoji('❌').setLabel('إلغاء الاستلام')
                    )
                let claimembed = new EmbedBuilder()
                    .setDescription(`**${interaction.user} قام بإستلام التذكره**`)
                    .setColor(`Blue`)

                await interaction.channel.permissionOverwrites.edit(Support, { SendMessages: false })
                await interaction.channel.permissionOverwrites.edit(interaction.user.id, { SendMessages: true })
                await interaction.deferUpdate()
                await interaction.editReply({ components: [Row, Row2] })
                await interaction.channel.send({ embeds: [claimembed] })
            } else if (action === 'unclaim') {
                if (await keyValueService.get('ticketDB', `Claimed_${interaction.channel.id}`) == interaction.user.id) {
                    const Support = await keyValueService.get('ticketDB', `TICKET-PANEL_${interaction.channel.id}`)?.Support

                    if (!interaction.member.roles.cache.has(Support)) {
                        return interaction.reply({ content: `:x: Only Support`, ephemeral: true })
                    }

                    await interaction.channel.permissionOverwrites.edit(Support, { SendMessages: true })
                    await interaction.channel.permissionOverwrites.edit(interaction.user.id, { SendMessages: false })
                    let unclaimembed = new EmbedBuilder()
                        .setDescription(`**${interaction.user} ألغاء استلام التذكره**`)
                        .setColor(`Blue`)
                    const Row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder().setStyle(ButtonStyle.Danger).setLabel('إغلاق').setEmoji('🔒').setCustomId(`close`),
                            new ButtonBuilder().setStyle(ButtonStyle.Success).setEmoji('✅').setLabel('استلام').setCustomId(`claim`)
                        )


                    await interaction.deferUpdate()
                    await interaction.editReply({ components: [Row, Row2] })
                    return interaction.channel.send({ embeds: [unclaimembed] })
                } else {
                    return interaction.reply({ content: `**التيكت ليست لك**`, ephemeral: true })
                }
            }
        }
    })
}