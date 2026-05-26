const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessageFlags,
} = require("discord.js");
const keyValueService = require("../../services/keyValueService");

// قاموس ألوان التضمين (Embed Colors) مع قيم HEX الصحيحة
const embedColors = [
  { name: "أحمر", value: "#FF0000" },
  { name: "أخضر", value: "#00FF00" },
  { name: "أزرق", value: "#0000FF" },
  { name: "أصفر", value: "#FFFF00" },
  { name: "برتقالي", value: "#FFA500" },
  { name: "بنفسجي", value: "#800080" },
  { name: "وردي", value: "#FFC0CB" },
  { name: "رمادي", value: "#808080" },
  { name: "أسود", value: "#000000" },
  { name: "أبيض", value: "#FFFFFF" },
  { name: "ذهبي", value: "#FFD700" },
  { name: "فضي", value: "#C0C0C0" },
  { name: "سماوي", value: "#00FFFF" },
  { name: "أخضر فاتح", value: "#90EE90" },
  { name: "بنفسجي فاتح", value: "#DDA0DD" },
];

// قاموس أنماط الأزرار (Button Styles) مع تسميات عربية واضحة
const buttonStyles = [
  { name: "أحمر (خطر)", value: "Danger" },
  { name: "أخضر (نجاح)", value: "Success" },
  { name: "أزرق (أساسي)", value: "Primary" },
  { name: "رمادي (ثانوي)", value: "Secondary" },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setup-ticket")
    .setDescription("إنشاء نظام تذاكر احترافي")
    .addStringOption((option) =>
      option
        .setName("button_name")
        .setDescription("اسم الزر الظاهر للتذكرة")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("button_color")
        .setDescription("لون الزر")
        .addChoices(...buttonStyles)
        .setRequired(true)
    )
    .addRoleOption((option) =>
      option
        .setName("support_role")
        .setDescription("رتبة فريق الدعم")
        .setRequired(true)
    )
    .addChannelOption((option) =>
      option
        .setName("category")
        .setDescription("الفئة التي ستُنشأ فيها التذاكر")
        .addChannelTypes(4) // CategoryChannel
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("welcome_type")
        .setDescription('نوع رسالة الترحيب داخل التذكرة')
        .setRequired(true)
        .addChoices(
          { name: "تضمين (Embed)", value: "embed" },
          { name: "رسالة نصية", value: "message" }
        )
    )
    .addStringOption((option) =>
      option
        .setName("ask_reason")
        .setDescription("سؤال المستخدم عن سبب فتح التذكرة؟")
        .setRequired(true)
        .addChoices(
          { name: "نعم", value: "on" },
          { name: "لا", value: "off" }
        )
    )
    .addStringOption((option) =>
      option
        .setName("embed_title")
        .setDescription("عنوان لوحة التذاكر (اختياري)")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("embed_color")
        .setDescription("لون تضمين لوحة التذاكر")
        .addChoices(...embedColors)
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("thumbnail")
        .setDescription("إظهار أيقونة السيرفر كصورة مصغرة؟")
        .addChoices(
          { name: "نعم", value: "on" },
          { name: "لا", value: "off" }
        )
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("embed_image")
        .setDescription("رابط صورة banner للتضمين (اختياري)")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("button_emoji")
        .setDescription("إيموجي للزر (اختياري)")
        .setRequired(false)
    ),

  async execute(interaction) {
    // التحقق من صلاحية المدير
    if (
      !interaction.member.permissions.has(
        PermissionsBitField.Flags.Administrator
      )
    ) {
      return interaction.reply({
        content: "❌ تحتاج إلى صلاحية `Administrator` لاستخدام هذا الأمر.",
        flags: MessageFlags.Ephemeral,
      });
    }

    // جمع البيانات من الخيارات
    const title =
      interaction.options.getString("embed_title") || "نظام التذاكر";
    const color = interaction.options.getString("embed_color") || "#808080";
    const buttonName = interaction.options.getString("button_name");
    const supportRole = interaction.options.getRole("support_role");
    const category = interaction.options.getChannel("category");
    const image = interaction.options.getString("embed_image");
    const buttonColor = interaction.options.getString("button_color");
    const thumbnailOption = interaction.options.getString("thumbnail") || "off";
    const emoji = interaction.options.getString("button_emoji");
    const messageType = interaction.options.getString("welcome_type");
    const askOption = interaction.options.getString("ask_reason");

    // إنشاء نافذة منبثقة (Modal) لجمع محتوى رسالة البانل ورسالة الترحيب
    const modal = new ModalBuilder()
      .setCustomId(`ticket_setup_${interaction.id}`)
      .setTitle("إعداد لوحة التذاكر");

    const descriptionInput = new TextInputBuilder()
      .setCustomId("description")
      .setLabel("وصف لوحة التذاكر")
      .setPlaceholder("اكتب هنا محتوى رسالة بانل التذاكر...")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setMaxLength(4000);

    const welcomeInput = new TextInputBuilder()
      .setCustomId("welcome")
      .setLabel("رسالة الترحيب داخل التذكرة")
      .setPlaceholder("اكتب هنا رسالة الترحيب التي ستظهر عند فتح التذكرة...")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setMaxLength(4000);

    const actionRow1 = new ActionRowBuilder().addComponents(descriptionInput);
    const actionRow2 = new ActionRowBuilder().addComponents(welcomeInput);
    modal.addComponents(actionRow1, actionRow2);

    // عرض النافذة المنبثقة للمستخدم
    await interaction.showModal(modal);

    try {
      // انتظار رد المستخدم على النافذة المنبثقة
      const filter = (i) =>
        i.customId === `ticket_setup_${interaction.id}` &&
        i.user.id === interaction.user.id;
      const modalInteraction = await interaction.awaitModalSubmit({
        filter,
        time: 120000,
      });

      const description =
        modalInteraction.fields.getTextInputValue("description");
      const welcomeMessage =
        modalInteraction.fields.getTextInputValue("welcome");

      // بناء التضمين (Embed)
      const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .setDescription(description)
        .setFooter({
          text: interaction.guild.name,
          iconURL: interaction.guild.iconURL(),
        })
        .setAuthor({
          name: interaction.guild.name,
          iconURL: interaction.guild.iconURL({ dynamic: true }),
        })
        .setTimestamp();

      if (thumbnailOption === "on")
        embed.setThumbnail(interaction.guild.iconURL());
      if (image) embed.setImage(image);

      // إنشاء الزر
      const randomId = `ticket_${Math.random().toString(36).substr(2, 9)}`;
      const button = new ButtonBuilder()
        .setCustomId(randomId)
        .setLabel(buttonName)
        .setStyle(ButtonStyle[buttonColor]); // تم حل المشكلة هنا

      if (emoji) button.setEmoji(emoji);

      const row = new ActionRowBuilder().addComponents(button);

      // إرسال لوحة التذاكر
      await interaction.channel.send({ embeds: [embed], components: [row] });

      // حفظ البيانات
      await keyValueService.set(
        "ticketDB",
        `Ticket_${interaction.channel.id}_${randomId}`,
        {
          Support: supportRole.id,
          Category: category.id,
          Internal: welcomeMessage,
          Type: messageType,
          Ask: askOption,
        }
      );

      await modalInteraction.reply({
        content: "✅ تم إنشاء نظام التذاكر بنجاح!",
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      // في حالة انتهاء المهلة أو أي خطأ
      console.error("Error in ticket setup modal:", error);
      return interaction.followUp({
        content:
          "❌ انتهت مهلة الإعداد أو حدث خطأ. يرجى محاولة مرة أخرى والتأكد من إدخال جميع البيانات.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};