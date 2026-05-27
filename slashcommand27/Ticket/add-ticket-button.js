const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessageFlags,
  ChannelType,
  PermissionsBitField,
} = require("discord.js");
const keyValueService = require("../../services/keyValueService");

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

const buttonStyles = [
  { name: "أحمر (خطر)", value: "Danger" },
  { name: "أخضر (نجاح)", value: "Success" },
  { name: "أزرق (أساسي)", value: "Primary" },
  { name: "رمادي (ثانوي)", value: "Secondary" },
];

function paginate(items, page = 0, perPage = 25) {
  const totalPages = Math.ceil(items.length / perPage);
  const sliced = items.slice(page * perPage, (page + 1) * perPage);
  return { totalPages, page, items: sliced };
}

function createPaginationRow(currentPage, totalPages, type) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`page_prev_${type}`)
      .setEmoji("◀️")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(currentPage <= 0),
    new ButtonBuilder()
      .setCustomId(`page_next_${type}`)
      .setEmoji("▶️")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(currentPage >= totalPages - 1),
    new ButtonBuilder()
      .setCustomId(`search_${type}`)
      .setLabel("🔍 بحث")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("back_to_main")
      .setLabel("↩️ رجوع")
      .setStyle(ButtonStyle.Danger)
  );
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("add-ticket-button")
    .setDescription("إضافة زر تذكرة إلى رسالة موجودة بواجهة تفاعلية مباشرة"),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({
        content: "❌ تحتاج إلى صلاحية `Administrator` لاستخدام هذا الأمر.",
        flags: MessageFlags.Ephemeral,
      });
    }

    // ---- الخطوة الأولى: طلب messageId عبر مودال ----
    const idModal = new ModalBuilder()
      .setCustomId("modal_get_message_id")
      .setTitle("إضافة زر تذكرة");

    idModal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("message_id")
          .setLabel("معرف الرسالة (Message ID)")
          .setStyle(TextInputStyle.Short)
          .setPlaceholder("أدخل معرف الرسالة الموجودة في هذه القناة")
          .setRequired(true)
      )
    );

    await interaction.showModal(idModal);

    let targetMessageId;
    try {
      const modalSubmit = await interaction.awaitModalSubmit({
        time: 120_000,
        filter: (i) => i.user.id === interaction.user.id,
      });
      targetMessageId = modalSubmit.fields.getTextInputValue("message_id").trim();
      await modalSubmit.deferUpdate();
    } catch {
      return interaction.editReply({
        content: "⏰ انتهت المهلة أو أُلغيت العملية.",
        flags: MessageFlags.Ephemeral,
      }).catch(() => {});
    }

    // محاولة جلب الرسالة للتأكد من صحتها
    let targetMessage;
    try {
      targetMessage = await interaction.channel.messages.fetch(targetMessageId);
    } catch {
      return interaction.editReply({
        content: "❌ تعذر العثور على الرسالة في هذه القناة. تأكد من المعرف.",
        flags: MessageFlags.Ephemeral,
      }).catch(() => {});
    }

    // ---- الإعدادات الافتراضية المشابهة لـ setup-ticket ----
    const welcomeTemplates = (await keyValueService.get("welcomeTemplates", interaction.guild.id)) || {};

    const settings = {
      buttonName: "فتح تذكرة",
      buttonStyle: "Primary",
      buttonEmoji: "",
      supportRoleId: null,
      categoryId: null,
      welcomeMessage: "مرحباً بك في تذكرتك! سيقوم فريق الدعم بالرد عليك قريباً.",
      welcomeType: "embed",
      askReason: false,
    };

    // إنشاء معاينة مباشرة (تعرض ملخص الإعدادات الحالية)
    const generatePreviewEmbed = () =>
      new EmbedBuilder()
        .setColor("#5865F2")
        .setTitle("إعدادات زر التذكرة")
        .addFields(
          { name: "✏️ اسم الزر", value: settings.buttonName || "غير محدد", inline: true },
          { name: "🎨 لون الزر", value: settings.buttonStyle, inline: true },
          { name: "😀 إيموجي", value: settings.buttonEmoji || "لا يوجد", inline: true },
          { name: "👥 رتبة الدعم", value: settings.supportRoleId ? `<@&${settings.supportRoleId}>` : "❌ غير محددة", inline: true },
          { name: "📁 الفئة", value: settings.categoryId ? `<#${settings.categoryId}>` : "❌ غير محددة", inline: true },
          { name: "💬 نوع الترحيب", value: settings.welcomeType === "embed" ? "تضمين" : "نصية", inline: true },
          { name: "❓ سؤال السبب", value: settings.askReason ? "مفعل" : "معطل", inline: true },
          { name: "📩 رسالة الترحيب", value: settings.welcomeMessage.substring(0, 100) + (settings.welcomeMessage.length > 100 ? "..." : ""), inline: false }
        )
        .setFooter({ text: "🛠️ معالج إضافة زر التذكرة | معاينة مباشرة" })
        .setTimestamp();

    const mainButtons = () =>
      new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("edit_basics").setLabel("⚙️ الإعدادات الأساسية").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("edit_advanced").setLabel("✨ خيارات التذكرة").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("send_panel").setLabel("🚀 تأكيد وإضافة").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("cancel_setup").setLabel("❌ إلغاء").setStyle(ButtonStyle.Danger)
      );

    await interaction.editReply({
      embeds: [generatePreviewEmbed()],
      components: [mainButtons()],
    });

    const paginationCache = {
      roles: { items: [], page: 0, filtered: null },
      categories: { items: [], page: 0, filtered: null },
    };

    function buildSelectMenu(items, customId, placeholder) {
      const options = items.map((item) => ({
        label: item.name.length > 100 ? item.name.substring(0, 97) + "..." : item.name,
        value: item.id,
      }));
      return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder().setCustomId(customId).setPlaceholder(placeholder).addOptions(options)
      );
    }

    // ---- حلقة التفاعل الرئيسية (نفس نمط setup-ticket) ----
    while (true) {
      try {
        const filter = (i) => i.user.id === interaction.user.id;
        const componentInteraction = await interaction.channel.awaitMessageComponent({
          filter,
          time: 900_000,
        });

        if (componentInteraction.isButton()) {
          const btnId = componentInteraction.customId;

          switch (btnId) {
            case "cancel_setup":
              await componentInteraction.deferUpdate();
              return componentInteraction.editReply({
                components: [],
                embeds: [new EmbedBuilder().setColor("#FF0000").setDescription("❌ تم إلغاء العملية.")],
              });

            case "send_panel": {
              const missing = [];
              if (!settings.supportRoleId) missing.push("رتبة الدعم");
              if (!settings.categoryId) missing.push("فئة القنوات");

              if (missing.length > 0) {
                await componentInteraction.deferUpdate();
                const msg = missing.length === 2
                  ? `⚠️ يجب اختيار ${missing.join(" و ")} قبل الإضافة.`
                  : `⚠️ يجب اختيار ${missing[0]} قبل الإضافة.`;
                await componentInteraction.followUp({ content: msg, flags: MessageFlags.Ephemeral });
                continue;
              }

              await componentInteraction.deferUpdate();
              break; // الخروج من الحلقة لإتمام الإضافة
            }

            case "edit_basics": {
              await componentInteraction.deferUpdate();
              const row = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                  .setCustomId("basic_select")
                  .setPlaceholder("اختر العنصر لتعديله")
                  .addOptions([
                    { label: "اسم الزر", value: "buttonName", emoji: "✏️" },
                    { label: "لون الزر", value: "buttonStyle", emoji: "🎨" },
                    { label: "إيموجي الزر", value: "buttonEmoji", emoji: "😀" },
                    { label: "رتبة الدعم", value: "supportRole", emoji: "👥" },
                    { label: "فئة القنوات", value: "category", emoji: "📁" },
                  ])
              );
              await componentInteraction.editReply({ components: [row, mainButtons()] });
              continue;
            }

            case "edit_advanced": {
              await componentInteraction.deferUpdate();
              const advOptions = [
                {
                  label: `نوع رسالة الترحيب (${settings.welcomeType === "embed" ? "تضمين" : "نصية"})`,
                  value: "welcomeType",
                  emoji: "💬",
                },
                {
                  label: `سؤال السبب ${settings.askReason ? "✅" : "❌"}`,
                  value: "askReason",
                  emoji: "❓",
                },
                { label: "رسالة الترحيب", value: "welcomeMessage", emoji: "📩" },
              ];

              const row = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                  .setCustomId("advanced_select")
                  .setPlaceholder("اختر العنصر لتعديله")
                  .addOptions(advOptions)
              );
              await componentInteraction.editReply({ components: [row, mainButtons()] });
              continue;
            }

            default: {
              if (btnId.startsWith("page_prev_") || btnId.startsWith("page_next_") || btnId.startsWith("search_") || btnId === "back_to_main") {
                await componentInteraction.deferUpdate();
                if (btnId === "back_to_main") {
                  paginationCache.roles.page = 0;
                  paginationCache.roles.filtered = null;
                  paginationCache.categories.page = 0;
                  paginationCache.categories.filtered = null;
                  await componentInteraction.editReply({ components: [mainButtons()] });
                  continue;
                }

                const type = btnId.includes("roles") ? "roles" : "categories";
                const cache = paginationCache[type];
                let items = cache.filtered || cache.items;

                if (btnId.startsWith("search_")) {
                  const modal = new ModalBuilder()
                    .setCustomId(`modal_search_${type}`)
                    .setTitle(`بحث عن ${type === "roles" ? "رتبة" : "فئة"}`);
                  modal.addComponents(
                    new ActionRowBuilder().addComponents(
                      new TextInputBuilder()
                        .setCustomId("query")
                        .setLabel("اكتب جزءاً من الاسم")
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)
                    )
                  );
                  await componentInteraction.showModal(modal);
                  continue;
                }

                if (btnId.startsWith("page_prev_")) cache.page = Math.max(0, cache.page - 1);
                else if (btnId.startsWith("page_next_")) {
                  const { totalPages } = paginate(items, cache.page);
                  cache.page = Math.min(totalPages - 1, cache.page + 1);
                }

                const { items: pageItems, totalPages, page } = paginate(items, cache.page);
                const selectMenu = buildSelectMenu(pageItems, `select_${type}`, `اختر ${type === "roles" ? "الرتبة" : "الفئة"}`);
                const pagRow = createPaginationRow(page, totalPages, type);
                await componentInteraction.editReply({ components: [selectMenu, pagRow] });
                continue;
              }
              await componentInteraction.deferUpdate().catch(() => {});
              continue;
            }
          }

          if (btnId === "send_panel") break; // الخروج بعد التأكيد
        }

        // ---- القوائم المنسدلة ----
        if (componentInteraction.isStringSelectMenu()) {
          const value = componentInteraction.values[0];
          const customId = componentInteraction.customId;

          // ---- اختيار قالب ترحيب أو تخصيص يدوي (نفس فكرة setup-ticket) ----
          if (customId === "select_welcome") {
            if (value === "__custom__") {
              const modal = new ModalBuilder()
                .setCustomId("modal_welcome")
                .setTitle("رسالة ترحيب مخصصة");
              modal.addComponents(
                new ActionRowBuilder().addComponents(
                  new TextInputBuilder()
                    .setCustomId("input")
                    .setLabel("رسالة الترحيب (اتركها فارغة لعدم وجود رسالة)")
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(false)
                    .setValue(settings.welcomeMessage.startsWith("[template:") ? "" : settings.welcomeMessage)
                )
              );
              await componentInteraction.showModal(modal);
              continue;
            } else {
              settings.welcomeMessage = `[template:${value}]`;
              await componentInteraction.deferUpdate();
              await componentInteraction.editReply({ embeds: [generatePreviewEmbed()], components: [mainButtons()] });
              continue;
            }
          }

          // خيارات تحتاج Modal لتعديل النص
          const needsModal = ["buttonName", "buttonEmoji"];
          if (needsModal.includes(value)) {
            let modal;
            const currentValue = {
              buttonName: settings.buttonName,
              buttonEmoji: settings.buttonEmoji,
            }[value];

            if (value === "buttonName") {
              modal = new ModalBuilder().setCustomId("modal_buttonName").setTitle("تغيير اسم الزر");
              modal.addComponents(
                new ActionRowBuilder().addComponents(
                  new TextInputBuilder().setCustomId("input").setLabel("اسم الزر الجديد").setStyle(TextInputStyle.Short).setRequired(false).setValue(currentValue)
                )
              );
            } else if (value === "buttonEmoji") {
              modal = new ModalBuilder().setCustomId("modal_buttonEmoji").setTitle("إضافة إيموجي للزر");
              modal.addComponents(
                new ActionRowBuilder().addComponents(
                  new TextInputBuilder().setCustomId("input").setLabel("أدخل الإيموجي (اختياري)").setStyle(TextInputStyle.Short).setRequired(false).setValue(currentValue)
                )
              );
            }

            await componentInteraction.showModal(modal);
            try {
              const modalSubmit = await componentInteraction.awaitModalSubmit({ time: 120_000 });
              const input = modalSubmit.fields.getTextInputValue("input");
              if (modalSubmit.customId === "modal_buttonName") settings.buttonName = input;
              else if (modalSubmit.customId === "modal_buttonEmoji") settings.buttonEmoji = input;
              await modalSubmit.update({ embeds: [generatePreviewEmbed()], components: [mainButtons()] });
            } catch (error) {
              if (error.code === "INTERACTION_NOT_REPLIED") {
                await interaction.editReply({ components: [mainButtons()] });
              }
            }
            continue;
          }

          // معالجة اختيار welcomeMessage من القائمة
          if (value === "welcomeMessage") {
            const templateNames = Object.keys(welcomeTemplates);
            const options = [];
            if (templateNames.length > 0) {
              templateNames.forEach(name => {
                options.push({ label: name, value: name, emoji: "📄" });
              });
            }
            options.push({ label: "✍️ تخصيص يدوي", value: "__custom__", emoji: "✏️" });

            const welcomeRow = new ActionRowBuilder().addComponents(
              new StringSelectMenuBuilder()
                .setCustomId("select_welcome")
                .setPlaceholder("اختر قالب ترحيب أو اكتب يدوياً")
                .addOptions(options)
            );
            await componentInteraction.deferUpdate();
            await componentInteraction.editReply({ components: [welcomeRow, mainButtons()] });
            continue;
          }

          // خيارات مباشرة (تحديث الإعدادات)
          await componentInteraction.deferUpdate();

          switch (customId) {
            case "basic_select":
              if (value === "buttonStyle") {
                const row = new ActionRowBuilder().addComponents(
                  new StringSelectMenuBuilder()
                    .setCustomId("select_buttonStyle")
                    .setPlaceholder("اختر لون الزر")
                    .addOptions(buttonStyles.map(s => ({ label: s.name, value: s.value })))
                );
                await componentInteraction.editReply({ components: [row, mainButtons()] });
              } else if (value === "supportRole") {
                const allRoles = interaction.guild.roles.cache
                  .filter(r => !r.managed && r.name !== "@everyone")
                  .sort((a, b) => b.position - a.position)
                  .map(r => ({ name: r.name, id: r.id }));
                paginationCache.roles.items = allRoles;
                paginationCache.roles.page = 0;
                paginationCache.roles.filtered = null;

                if (allRoles.length <= 25) {
                  const menu = buildSelectMenu(allRoles, "select_supportRole", "اختر رتبة الدعم");
                  await componentInteraction.editReply({ components: [menu, mainButtons()] });
                } else {
                  const { items } = paginate(allRoles, 0);
                  const menu = buildSelectMenu(items, "select_supportRole", "اختر رتبة الدعم");
                  const pagRow = createPaginationRow(0, Math.ceil(allRoles.length / 25), "roles");
                  await componentInteraction.editReply({ components: [menu, pagRow] });
                }
              } else if (value === "category") {
                const allCategories = interaction.guild.channels.cache
                  .filter(c => c.type === ChannelType.GuildCategory)
                  .sort((a, b) => a.position - b.position)
                  .map(c => ({ name: c.name, id: c.id }));
                paginationCache.categories.items = allCategories;
                paginationCache.categories.page = 0;
                paginationCache.categories.filtered = null;

                if (allCategories.length <= 25) {
                  const menu = buildSelectMenu(allCategories, "select_category", "اختر الفئة");
                  await componentInteraction.editReply({ components: [menu, mainButtons()] });
                } else {
                  const { items } = paginate(allCategories, 0);
                  const menu = buildSelectMenu(items, "select_category", "اختر الفئة");
                  const pagRow = createPaginationRow(0, Math.ceil(allCategories.length / 25), "categories");
                  await componentInteraction.editReply({ components: [menu, pagRow] });
                }
              }
              break;

            case "advanced_select":
              if (value === "welcomeType") settings.welcomeType = settings.welcomeType === "embed" ? "message" : "embed";
              else if (value === "askReason") settings.askReason = !settings.askReason;
              await componentInteraction.editReply({ embeds: [generatePreviewEmbed()], components: [mainButtons()] });
              break;

            case "select_supportRole":
              settings.supportRoleId = value;
              paginationCache.roles.filtered = null;
              await componentInteraction.editReply({ embeds: [generatePreviewEmbed()], components: [mainButtons()] });
              break;

            case "select_category":
              settings.categoryId = value;
              paginationCache.categories.filtered = null;
              await componentInteraction.editReply({ embeds: [generatePreviewEmbed()], components: [mainButtons()] });
              break;

            case "select_buttonStyle":
              settings.buttonStyle = value;
              await componentInteraction.editReply({ embeds: [generatePreviewEmbed()], components: [mainButtons()] });
              break;

            default:
              await componentInteraction.editReply({ embeds: [generatePreviewEmbed()], components: [mainButtons()] });
          }
          continue;
        }

        // ---- Modal البحث أو الترحيب اليدوي ----
        if (componentInteraction.type === 5) { // Modal Submit
          if (componentInteraction.customId === "modal_welcome") {
            const input = componentInteraction.fields.getTextInputValue("input");
            settings.welcomeMessage = input;
            try {
              await componentInteraction.update({ embeds: [generatePreviewEmbed()], components: [mainButtons()] });
            } catch {
              await componentInteraction.reply({ embeds: [generatePreviewEmbed()], components: [mainButtons()], ephemeral: true });
            }
            continue;
          }

          if (componentInteraction.customId.startsWith("modal_search_")) {
            const type = componentInteraction.customId.replace("modal_search_", "");
            const query = componentInteraction.fields.getTextInputValue("query").toLowerCase();
            const cache = paginationCache[type];
            const filtered = cache.items.filter(item => item.name.toLowerCase().includes(query));
            cache.filtered = filtered.length > 0 ? filtered : null;
            cache.page = 0;

            if (filtered.length === 0) {
              try {
                await componentInteraction.update({
                  components: [new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId("back_to_main").setLabel("↩️ لم يتم العثور، رجوع").setStyle(ButtonStyle.Danger)
                  )],
                });
              } catch {
                await componentInteraction.reply({ content: "لم يتم العثور على نتائج.", ephemeral: true });
              }
              continue;
            }

            if (filtered.length <= 25) {
              const menu = buildSelectMenu(filtered, `select_${type}`, `اختر ${type === "roles" ? "الرتبة" : "الفئة"}`);
              await componentInteraction.update({ components: [menu, mainButtons()] }).catch(() => {});
            } else {
              const { items } = paginate(filtered, 0);
              const menu = buildSelectMenu(items, `select_${type}`, `اختر ${type === "roles" ? "الرتبة" : "الفئة"}`);
              const pagRow = createPaginationRow(0, Math.ceil(filtered.length / 25), type);
              await componentInteraction.update({ components: [menu, pagRow] }).catch(() => {});
            }
            continue;
          }
        }
      } catch (error) {
        console.error("خطأ في معالج إضافة الزر:", error);
        return interaction.editReply({
          components: [],
          embeds: [new EmbedBuilder().setColor("#FF0000").setDescription("⏰ انتهت مهلة الإعداد أو حدث خطأ.")],
        });
      }
    }

    // ---- تنفيذ إضافة الزر إلى الرسالة المستهدفة ----
    const randomId = `ticket_${Math.random().toString(36).substr(2, 9)}`;
    const newButton = new ButtonBuilder()
      .setCustomId(randomId)
      .setLabel(settings.buttonName || "فتح تذكرة")
      .setStyle(ButtonStyle[settings.buttonStyle]);
    if (settings.buttonEmoji) newButton.setEmoji(settings.buttonEmoji);

    // نجلب الرسالة مرة أخرى ونتأكد من مكوناتها الحالية
    let finalMessage;
    try {
      finalMessage = await interaction.channel.messages.fetch(targetMessageId);
    } catch {
      return interaction.editReply({
        components: [],
        embeds: [new EmbedBuilder().setColor("#FF0000").setDescription("❌ تعذر الوصول للرسالة، قد تكون حُذفت.")],
      });
    }

    const existingComponents = finalMessage.components || [];
    // نضيف الزر في صف جديد أو نضيفه للصف الأول إذا كان موجوداً
    const rows = existingComponents.length > 0 ? [...existingComponents] : [];
    // إنشاء صف جديد للزر
    const buttonRow = new ActionRowBuilder().addComponents(newButton);
    rows.push(buttonRow);

    await finalMessage.edit({ components: rows });

    // حفظ البيانات
    await keyValueService.set("ticketDB", `Ticket_${interaction.channel.id}_${randomId}`, {
      Support: settings.supportRoleId,
      Category: settings.categoryId,
      Internal: settings.welcomeMessage,
      Type: settings.welcomeType,
      Ask: settings.askReason ? "on" : "off",
    });

    // عرض نجاح
    await interaction.editReply({
      components: [],
      embeds: [new EmbedBuilder().setColor("#00FF00").setDescription("✅ تم إضافة زر التذكرة بنجاح إلى الرسالة المحددة.")],
    });
  },
};