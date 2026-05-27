const {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  MessageFlags,
} = require("discord.js");
const keyValueService = require("../../services/keyValueService");

module.exports = {
  adminsOnly: true,
  data: new SlashCommandBuilder()
    .setName("to-select")
    .setDescription("تحويل أزرار التذاكر إلى قائمة منسدلة مع إمكانية اختيار قالب ترحيب")
    .addStringOption((option) =>
      option
        .setName("message_id")
        .setDescription("معرف الرسالة التي تحتوي على الأزرار")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("description1")
        .setDescription("وصف الخيار الأول")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("description2")
        .setDescription("وصف الخيار الثاني")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("description3")
        .setDescription("وصف الخيار الثالث")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("description4")
        .setDescription("وصف الخيار الرابع")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("description5")
        .setDescription("وصف الخيار الخامس")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("welcome_template")
        .setDescription("اسم قالب الترحيب المستخدم عند فتح التذكرة (من أمر welcome-setup)")
        .setRequired(false)
    ),

  async execute(interaction) {
    // التحقق من صلاحية الأدمن
    if (!interaction.member.permissions.has("Administrator")) {
      return interaction.reply({
        content: "❌ لا تمتلك الصلاحية المطلوبة (Administrator).",
        flags: MessageFlags.Ephemeral,
      });
    }

    const messageId = interaction.options.getString("message_id");
    const descriptions = [
      interaction.options.getString("description1"),
      interaction.options.getString("description2"),
      interaction.options.getString("description3"),
      interaction.options.getString("description4"),
      interaction.options.getString("description5"),
    ];
    const welcomeTemplateName = interaction.options.getString("welcome_template");

    // متغير لتخزين بيانات القالب إن وجد
    let templateData = null;
    if (welcomeTemplateName) {
      const templates = (await keyValueService.get("welcomeTemplates", interaction.guild.id)) || {};
      templateData = templates[welcomeTemplateName];
      if (!templateData) {
        return interaction.reply({
          content: `❌ قالب الترحيب "${welcomeTemplateName}" غير موجود. استخدم أمر \`/welcome-setup\` لإنشائه أولاً.`,
          flags: MessageFlags.Ephemeral,
        });
      }
    }

    try {
      // جلب الرسالة من القناة
      const message = await interaction.channel.messages.fetch(messageId);

      // البحث عن أول صف يحتوي على أزرار (type === 2)
      const buttonRow = message.components.find((row) =>
        row.components.some((component) => component.type === 2)
      );
      if (!buttonRow) {
        return interaction.reply({
          content: "❌ لم يتم العثور على أي أزرار في هذه الرسالة.",
          flags: MessageFlags.Ephemeral,
        });
      }

      // تحديث بيانات التذاكر في قاعدة البيانات لكل زر
      const buttons = buttonRow.components.filter((c) => c.type === 2);
      for (const button of buttons) {
        const customId = button.customId;
        // جلب البيانات الحالية للتذكرة المرتبطة بهذا الزر
        const existingData = await keyValueService.get(
          "ticketDB",
          `Ticket_${interaction.channel.id}_${customId}`
        );

        if (existingData) {
          if (templateData) {
            // تحديث رسالة الترحيب ونوعها بناءً على القالب المختار
            existingData.Internal = `[template:${welcomeTemplateName}]`;
            existingData.Type = "embed"; // قوالب welcome-setup تستخدم embed
            // حفظ البيانات المعدلة
            await keyValueService.set(
              "ticketDB",
              `Ticket_${interaction.channel.id}_${customId}`,
              existingData
            );
          }
          // إذا لم يتم اختيار قالب، نترك البيانات كما هي (لا تغيير)
        }
      }

      // بناء القائمة المنسدلة الجديدة
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("ticket_select")
        .setPlaceholder("📋 اختر نوع المشكلة");

      // إضافة خيار لكل زر
      buttons.forEach((button, index) => {
        const option = new StringSelectMenuOptionBuilder()
          .setLabel(button.label)
          .setValue(button.customId);

        if (button.emoji) {
          option.setEmoji(button.emoji);
        }

        if (descriptions[index]) {
          option.setDescription(descriptions[index]);
        }

        selectMenu.addOptions(option);
      });

      // إضافة خيار إعادة التعيين (Reset)
      selectMenu.addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel("🔄 إعادة تعيين")
          .setValue("reset")
      );

      const selectRow = new ActionRowBuilder().addComponents(selectMenu);
      await message.edit({ components: [selectRow] });

      // رسالة النجاح
      let successMessage = "✅ تم تحويل الأزرار إلى قائمة منسدلة بنجاح.";
      if (welcomeTemplateName) {
        successMessage += `\n📌 تم ربط القائمة بقالب الترحيب **${welcomeTemplateName}**.`;
      } else {
        successMessage += `\n⚠️ لم يتم تحديد قالب ترحيب، سيتم استخدام الرسائل المخزنة سابقاً.`;
      }

      await interaction.reply({
        content: successMessage,
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      console.error("خطأ في أمر to-select:", error);
      return interaction.reply({
        content: "❌ حدث خطأ أثناء محاولة تحويل الأزرار. تأكد من أن معرف الرسالة صحيح وأن البوت يملك الصلاحيات اللازمة.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};