const { Events, EmbedBuilder, ActionRowBuilder, ButtonStyle, ButtonBuilder } = require("discord.js");
const keyValueService = require("../services/keyValueService");

const confirme = "هل انت متأكد من إغلاقك للتذكرة؟";
const discordTranscripts = require('discord-html-transcripts');

module.exports = (client7) => {
  client7.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isButton()) {
      const { customId } = interaction;

      if (customId === 'close') {
        const row = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder().setCustomId('Yes11').setLabel('إغلاق').setEmoji('🔒').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('No11').setLabel('إلغاء').setStyle(ButtonStyle.Secondary),
          );



    await interaction.reply({ content: confirme, components: [row] });


      } else if (customId === 'Yes11') {
        const id = await keyValueService.get('ticketDB', 'closed');
        const Ticket = await keyValueService.get('ticketDB', `TICKET-PANEL_${interaction.channel.id}`);

        await interaction.channel.permissionOverwrites.edit(Ticket.author, { ViewChannel: false });
        const embed2 = new EmbedBuilder()
        .setDescription(`تم اغلاق تذكرة بواسطة ${interaction.user}`)
        .setColor("Yellow");
        const embed = new EmbedBuilder()
        .setDescription("```لوحة فريق الدعم.```")
        .setColor("DarkButNotBlack");
        const roww = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder().setCustomId('delete').setLabel('حذف').setEmoji('🗑️').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('Open').setLabel('فتح').setEmoji('🔓').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('Tran').setLabel('نسخة نصية').setEmoji('📄').setStyle(ButtonStyle.Secondary),
          );

await interaction.deferUpdate();

await interaction.editReply({ 
    content: '', 
    embeds: [embed2, embed], 
    components: [roww]
});


        const Logs = await keyValueService.get('ticketDB', `LogsRoom_${interaction.guild.id}`);
        const logChannel = interaction.guild.channels.cache.get(Logs);
        const embedLog = new EmbedBuilder()
          .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
          .setTitle('Close Ticket')
          .setFields(
            { name: `Name Ticket`, value: `${interaction.channel.name}` },
            { name: `Owner Ticket`, value: `${Ticket.author}` },
            { name: `Close BY Ticket`, value: `${interaction.user}` },
          )
          .setFooter({ text: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() });

        logChannel?.send({ embeds: [embedLog] });

      } else if (customId === 'No11') {
        await interaction.deferUpdate();
        await interaction.deleteReply();

      } else if (customId === 'delete') {
        await interaction.reply({ content: `#${interaction.channel} has been successfully deleted :unlock:`, ephemeral: true });
        setTimeout(async () => {
          await interaction.channel.delete();
        }, 5000);

        const Logs = await keyValueService.get('ticketDB', `LogsRoom_${interaction.guild.id}`);
        const logChannel = interaction.guild.channels.cache.get(Logs);
        const Ticket = await keyValueService.get('ticketDB', `TICKET-PANEL_${interaction.channel.id}`);
        const embedLog = new EmbedBuilder()
          .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
          .setTitle('Delete Ticket')
          .setFields(
            { name: `Name Ticket`, value: `${interaction.channel.name}` },
            { name: `Owner Ticket`, value: `${Ticket.author}` },
            { name: `Delete BY Ticket`, value: `${interaction.user}` },
          )
          .setFooter({ text: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() });

        logChannel?.send({ embeds: [embedLog] });
        await keyValueService.delete('ticketDB', `TICKET-PANEL_${interaction.channel.id}`);

      } else if (customId === 'Open') {
        const Ticket = await keyValueService.get('ticketDB', `TICKET-PANEL_${interaction.channel.id}`);
        await interaction.channel.permissionOverwrites.edit(Ticket?.author, { ViewChannel: true });
        await interaction.deferUpdate();
        await interaction.deleteReply();

      } else if (customId === 'Tran') {
        const channel = interaction.channel;
        const attachment = await discordTranscripts.createTranscript(channel);

        const Logs = await keyValueService.get('ticketDB', `LogsRoom_${interaction.guild.id}`);
        const Trans = await keyValueService.get('ticketDB', `TransRoom_${interaction.guild.id}`);
        const logChannel = interaction.guild.channels.cache.get(Logs);
        const TransChannel = interaction.guild.channels.cache.get(Trans);
        const Ticket = await keyValueService.get('ticketDB', `TICKET-PANEL_${interaction.channel.id}`);
        if (!TransChannel) {
          await interaction.reply({ content: "لم يتم تحديد روم لوغ، استخدم /set-log لتحديده.", ephemeral: true });
          return;
         }
        const embed = new EmbedBuilder()
          .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
          .setTitle('Transcripted Ticket')
          .setFields(
            { name: `Name Ticket`, value: `${interaction.channel.name}` },
            { name: `Owner Ticket`, value: `${Ticket.author}` },
            { name: `Transcript BY `, value: `${interaction.user}` },
          )
          .setFooter({ text: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() });

        logChannel?.send({ embeds: [embed] });
        TransChannel?.send({ files: [attachment] });
        await interaction.reply({ content: `#${interaction.channel.name} has been successfully Transcripted`, ephemeral: true });
      }
    }
  });
};