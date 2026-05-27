const {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessageFlags,
  PermissionsBitField,
} = require("discord.js");
const keyValueService = require("../../services/keyValueService");

module.exports = {
  adminsOnly: true,
  data: new SlashCommandBuilder()
    .setName("setup-ticket")
    .setDescription("تحويل أزرار التذاكر إلى قائمة منسدلة مع قالب ترحيب اختياري"),

  async execute(interaction) {
    // 1. التحقق من الصلاحية
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({
        content: "❌ لا تمتلك صلاحية `Administrator`.",
        flags: MessageFlags.Ephemeral,
      });
    }

    // 2. بناء النافذة المنبثقة (Modal) لجلب message_id والأوصاف فقط
    const modal = new ModalBuilder()
      .setCustomId("to_select_modal")
      .setTitle("الخطوة 1: إدخال البيانات");

    const messageIdInput = new TextInputBuilder()
      .setCustomId("message_id")
      .setLabel("معرف الرسالة (Message ID)")
      .setPlaceholder("أدخل معرف الرسالة التي تحتوي على الأزرار")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const descriptionsInput = new TextInputBuilder()
      .setCustomId("descriptions")
      .setLabel("أوصاف الأزرار (سطر لكل زر)")
      .setPlaceholder("اكتب وصفاً لكل زر في سطر منفصل\nالسطر 1 للزر الأول\nالسطر 2 للزر الثاني ...")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder().addComponents(messageIdInput),
      new ActionRowBuilder().addComponents(descriptionsInput),
    );

    await interaction.showModal(modal);

    try {
      // 3. انتظار إرسال النافذة
      const modalSubmit = await interaction.awaitModalSubmit({
        time: 300_000,
        filter: (i) => i.user.id === interaction.user.id,
      });

      const messageId = modalSubmit.fields.getTextInputValue("message_id").trim();
      const descriptionsRaw = modalSubmit.fields.getTextInputValue("descriptions").trim();
      const descriptions = descriptionsRaw
        ? descriptionsRaw.split("\n").map((d) => d.trim()).filter((d) => d !== "")
        : [];

      // 4. التحقق من وجود الرسالة واستخراج الأزرار
      const message = await interaction.channel.messages.fetch(messageId).catch(() => null);
      if (!message) {
        return modalSubmit.reply({
          content: "❌ تعذر العثور على رسالة بهذا المعرف في هذه القناة.",
          flags: MessageFlags.Ephemeral,
        });
      }

      const buttonRow = message.components.find((row) =>
        row.components.some((c) => c.type === 2)
      );
      if (!buttonRow) {
        return modalSubmit.reply({
          content: "❌ لا توجد أزرار في هذه الرسالة.",
          flags: MessageFlags.Ephemeral,
        });
      }

      const buttons = buttonRow.components.filter((c) => c.type === 2);
      if (buttons.length === 0) {
        return modalSubmit.reply({
          content: "❌ لا توجد أزرار قابلة للتحويل.",
          flags: MessageFlags.Ephemeral,
        });
      }

      // 5. جلب جميع القوالب من قاعدة البيانات لإنشاء قائمة الاختيار
      const templates = (await keyValueService.get("welcomeTemplates", interaction.guild.id)) || {};
      const templateNames = Object.keys(templates);

      // بناء قائمة منسدلة لعرض القوالب + خيار "بدون قالب"
      const selectOptions = [
        {
          label: "🚫 بدون قالب",
          value: "__none__",
          description: "لن يتم استخدام أي قالب ترحيب",
        },
        ...templateNames.map((name) => ({
          label: name,
          value: `template_${name}`,
          description: `القالب: ${name}`,
        })),
      ];

      const templateSelect = new StringSelectMenuBuilder()
        .setCustomId("template_select")
        .setPlaceholder("📄 اختر قالب الترحيب (أو بدون قالب)")
        .addOptions(selectOptions);

      const row = new ActionRowBuilder().addComponents(templateSelect);

      // 6. إرسال رد مؤقت (Ephemeral) مع قائمة الاختيار
      await modalSubmit.reply({
        content: "**الخطوة 2:** اختر قالب الترحيب الذي تريد استخدامه مع التذاكر.",
        components: [row],
        flags: MessageFlags.Ephemeral,
      });

      // 7. انتظار اختيار المستخدم للقالب
      const templateChoice = await modalSubmit.channel.awaitMessageComponent({
        time: 120_000,
        filter: (i) => i.user.id === interaction.user.id,
      });

      if (templateChoice.customId !== "template_select") {
        return templateChoice.reply({
          content: "❌ تفاعل غير متوقع.",
          flags: MessageFlags.Ephemeral,
        });
      }

      const selectedValue = templateChoice.values[0];
      let templateName = null;
      let templateData = null;

      if (selectedValue !== "__none__") {
        templateName = selectedValue.replace("template_", "");
        templateData = templates[templateName];
        if (!templateData) {
          return templateChoice.reply({
            content: "❌ القالب المحدد لم يعد موجوداً.",
            flags: MessageFlags.Ephemeral,
          });
        }
      }

      // 8. تحديث بيانات التذاكر لكل زر إذا وُجد قالب
      if (templateData) {
        for (const button of buttons) {
          const customId = button.customId;
          const ticketKey = `Ticket_${interaction.channel.id}_${customId}`;
          const existingData = await keyValueService.get("ticketDB", ticketKey);
          if (existingData) {
            existingData.Internal = `[template:${templateName}]`;
            existingData.Type = "embed";
            await keyValueService.set("ticketDB", ticketKey, existingData);
          }
        }
      }

      // 9. بناء القائمة المنسدلة النهائية للتذاكر
      const ticketSelect = new StringSelectMenuBuilder()
        .setCustomId("ticket_select")
        .setPlaceholder("📋 اختر نوع المشكلة");

      buttons.forEach((button, index) => {
        const option = {
          label: button.label || "خيار",
          value: button.customId,
        };
        if (button.emoji) option.emoji = button.emoji;
        if (descriptions[index]) option.description = descriptions[index];
        ticketSelect.addOptions(option);
      });

      const ticketRow = new ActionRowBuilder().addComponents(ticketSelect);

      // 10. تعديل الرسالة الأصلية
      await message.edit({
        content: message.content || null,
        embeds: message.embeds,
        components: [ticketRow],
      });

      // 11. الرد النهائي للمستخدم
      let finalReply = "✅ تم تحويل الأزرار إلى قائمة منسدلة بنجاح.";
      if (templateData) finalReply += `\n📄 تم ربط القالب \`${templateName}\`.`;
      else finalReply += "\n🚫 لم يتم استخدام أي قالب ترحيب.";
      if (descriptions.length > 0) finalReply += `\n📝 تم إضافة ${descriptions.length} وصف.`;

      await templateChoice.reply({
        content: finalReply,
        flags: MessageFlags.Ephemeral,
      });

    } catch (error) {
      console.error(error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.followUp({
          content: "⏰ انتهت مهلة الإدخال أو حدث خطأ غير متوقع.",
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  },
};