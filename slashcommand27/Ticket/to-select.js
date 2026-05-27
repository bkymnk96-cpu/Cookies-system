const {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessageFlags,
  ChannelType,
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
        .setAutocomplete(true) // تفعيل الإكمال التلقائي
    )
    .addStringOption((option) =>
      option
        .setName("welcome_template")
        .setDescription("اسم قالب الترحيب (يتم جلبه تلقائياً من قاعدة البيانات)")
        .setRequired(false)
        .setAutocomplete(true) // تفعيل الإكمال التلقائي للقوالب
    ),

  /**
   * معالج الإكمال التلقائي للخيارات
   */
  async autocomplete(interaction) {
    const focusedOption = interaction.options.getFocused(true);

    if (focusedOption.name === "message_id") {
      // جلب آخر 25 رسالة في القناة لعرض معرفاتها
      const messages = await interaction.channel.messages.fetch({ limit: 25 });
      const choices = messages
        .filter((msg) => msg.author.id === interaction.client.user.id) // رسائل البوت فقط
        .map((msg) => ({
          name: `[${msg.id}] ${msg.content.slice(0, 50) || "(محتوى غير نصي)"}`,
          value: msg.id,
        }));
      await interaction.respond(choices.slice(0, 25));
    } else if (focusedOption.name === "welcome_template") {
      // جلب قوالب الترحيب من قاعدة البيانات
      const templates =
        (await keyValueService.get("welcomeTemplates", interaction.guild.id)) || {};
      const templateNames = Object.keys(templates);
      const choices = templateNames.map((name) => ({ name, value: name }));
      await interaction.respond(choices.slice(0, 25));
    }
  },

  async execute(interaction) {
    // التحقق من صلاحية الأدمن
    if (!interaction.member.permissions.has("Administrator")) {
      return interaction.reply({
        content: "❌ لا تمتلك الصلاحية المطلوبة (Administrator).",
        flags: MessageFlags.Ephemeral,
      });
    }

    const messageId = interaction.options.getString("message_id");
    const welcomeTemplateName = interaction.options.getString("welcome_template");

    // متغير لتخزين بيانات القالب إن وجد
    let templateData = null;
    if (welcomeTemplateName) {
      const templates =
        (await keyValueService.get("welcomeTemplates", interaction.guild.id)) || {};
      templateData = templates[welcomeTemplateName];
      if (!templateData) {
        return interaction.reply({
          content: `❌ قالب الترحيب "${welcomeTemplateName}" غير موجود.`,
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

      const buttons = buttonRow.components.filter((c) => c.type === 2);
      if (buttons.length === 0) {
        return interaction.reply({
          content: "❌ لا توجد أزرار صالحة.",
          flags: MessageFlags.Ephemeral,
        });
      }

      // الحد الأقصى للحقول في المودال هو 5
      if (buttons.length > 5) {
        return interaction.reply({
          content: "❌ لا يمكن معالجة أكثر من 5 أزرار (حد المودال المسموح به).",
          flags: MessageFlags.Ephemeral,
        });
      }

      // بناء المودال لإدخال الأوصاف
      const modal = new ModalBuilder()
        .setCustomId(`ticket_select_modal_${messageId}`)
        .setTitle("أوصاف الأزرار");

      // إضافة حقل نصي لكل زر
      const rows = buttons.map((button, index) => {
        const textInput = new TextInputBuilder()
          .setCustomId(`desc_${index}`)
          .setLabel(`وصف الزر: ${button.label || `زر ${index + 1}`}`)
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setMaxLength(100);
        return new ActionRowBuilder().addComponents(textInput);
      });

      modal.addComponents(rows);

      // عرض المودال للمستخدم
      await interaction.showModal(modal);

      // انتظار رد المستخدم على المودال
      const submitted = await interaction
        .awaitModalSubmit({
          time: 120_000, // دقيقتان
          filter: (i) =>
            i.customId === `ticket_select_modal_${messageId}` &&
            i.user.id === interaction.user.id,
        })
        .catch(() => null);

      if (!submitted) {
        // إذا انتهت المهلة أو رفض المستخدم
        return;
      }

      // استخراج الأوصاف من المودال
      const descriptions = buttons.map((_, index) => {
        const field = submitted.fields.getTextInputValue(`desc_${index}`);
        return field || null;
      });

      // تحديث بيانات التذاكر في قاعدة البيانات لكل زر
      for (const button of buttons) {
        const customId = button.customId;
        const existingData = await keyValueService.get(
          "ticketDB",
          `Ticket_${interaction.channel.id}_${customId}`
        );

        if (existingData && templateData) {
          existingData.Internal = `[template:${welcomeTemplateName}]`;
          existingData.Type = "embed";
          await keyValueService.set(
            "ticketDB",
            `Ticket_${interaction.channel.id}_${customId}`,
            existingData
          );
        }
      }

      // بناء القائمة المنسدلة الجديدة
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("ticket_select")
        .setPlaceholder("📋 اختر نوع المشكلة");

      buttons.forEach((button, index) => {
        const option = new StringSelectMenuOptionBuilder()
          .setLabel(button.label)
          .setValue(button.customId);

        if (button.emoji) option.setEmoji(button.emoji);
        if (descriptions[index]) option.setDescription(descriptions[index]);

        selectMenu.addOptions(option);
      });

      // إضافة خيار إعادة التعيين
      selectMenu.addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel("🔄 إعادة تعيين")
          .setValue("reset")
      );

      const selectRow = new ActionRowBuilder().addComponents(selectMenu);
      await message.edit({ components: [selectRow] });

      // إرسال تأكيد نجاح العملية
      let successMessage = "✅ تم تحويل الأزرار إلى قائمة منسدلة بنجاح.";
      if (welcomeTemplateName) {
        successMessage += `\n📌 تم ربط القائمة بقالب الترحيب **${welcomeTemplateName}**.`;
      } else {
        successMessage += `\n⚠️ لم يتم تحديد قالب ترحيب، سيتم استخدام الرسائل المخزنة سابقاً.`;
      }

      await submitted.reply({
        content: successMessage,
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      console.error("خطأ في أمر to-select:", error);
      // إذا كان التفاعل ما زال مفتوحاً نرد عليه، وإلا نستخدم followUp
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content:
            "❌ حدث خطأ أثناء محاولة تحويل الأزرار. تأكد من أن معرف الرسالة صحيح وأن البوت يملك الصلاحيات اللازمة.",
          flags: MessageFlags.Ephemeral,
        });
      } else {
        await interaction.reply({
          content:
            "❌ حدث خطأ أثناء محاولة تحويل الأزرار. تأكد من أن معرف الرسالة صحيح وأن البوت يملك الصلاحيات اللازمة.",
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  },
};