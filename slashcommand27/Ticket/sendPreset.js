const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require("discord.js");
const keyValueService = require("../../services/keyValueService");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("send-preset")
    .setDescription("إرسال لوحة تذاكر محفوظة مسبقاً")
    .addStringOption(option =>
      option
        .setName("preset_name")
        .setDescription("اسم الإعداد المسبق")
        .setRequired(true)
        .setAutocomplete(true)
    ),

  async autocomplete(interaction) {
    try {
      const focusedValue = interaction.options.getFocused().toLowerCase();
      const presets = (await keyValueService.get("ticketPresets", interaction.guild.id)) || {};
      const presetNames = Object.keys(presets);
      const filtered = presetNames.filter(name =>
        name.toLowerCase().includes(focusedValue)
      );
      await interaction.respond(
        filtered.slice(0, 25).map(name => ({ name, value: name }))
      );
    } catch (error) {
      console.error("خطأ في autocomplete send-preset:", error);
      await interaction.respond([]);
    }
  },

  async execute(interaction) {
    if (!interaction.member.permissions.has(require("discord.js").PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({
        content: "❌ تحتاج إلى صلاحية `Administrator` لاستخدام هذا الأمر.",
        flags: MessageFlags.Ephemeral,
      });
    }

    try {
      const presetName = interaction.options.getString("preset_name");
      const presets = (await keyValueService.get("ticketPresets", interaction.guild.id)) || {};

      if (!presets[presetName]) {
        return interaction.reply({
          content: `❌ لا يوجد إعداد مسبق باسم \`${presetName}\`. تأكد من الاسم أو قم بحفظ إعداد جديد باستخدام أمر \`/setup-ticket\`.`,
          flags: MessageFlags.Ephemeral,
        });
      }

      const settings = presets[presetName];

      const embed = new EmbedBuilder()
        .setColor(settings.color)
        .setTitle(settings.title)
        .setDescription(settings.description)
        .setFooter({
          text: interaction.guild.name,
          iconURL: interaction.guild.iconURL(),
        })
        .setTimestamp()
        .setThumbnail(settings.thumbnail ? interaction.guild.iconURL() : null)
        .setImage(settings.embedImage || null);

      const randomId = `ticket_${Math.random().toString(36).substr(2, 9)}`;
      const btn = new ButtonBuilder()
        .setCustomId(randomId)
        .setLabel(settings.buttonName)
        .setStyle(ButtonStyle[settings.buttonStyle]);
      if (settings.buttonEmoji) btn.setEmoji(settings.buttonEmoji);

      const row = new ActionRowBuilder().addComponents(btn);

      await interaction.channel.send({ embeds: [embed], components: [row] });

      await keyValueService.set(
        "ticketDB",
        `Ticket_${interaction.channel.id}_${randomId}`,
        {
          Support: settings.supportRoleId,
          Category: settings.categoryId,
          Internal: settings.welcomeMessage,
          Type: settings.welcomeType,
          Ask: settings.askReason,
        }
      );

      await interaction.reply({
        content: `✅ تم إرسال لوحة التذاكرة من الإعداد المسبق \`${presetName}\`.`,
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      console.error("خطأ في أمر send-preset:", error);
      return interaction.reply({
        content: "❌ حدث خطأ أثناء إرسال لوحة التذاكرة. يرجى المحاولة مرة أخرى.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};