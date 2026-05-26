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

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setup-ticket")
    .setDescription("إنشاء نظام تذاكر احترافي بتجربة تفاعلية"),

  async execute(interaction) {
    if (
      !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)
    ) {
      return interaction.reply({
        content: "❌ تحتاج إلى صلاحية `Administrator` لاستخدام هذا الأمر.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const settings = {
      title: "نظام التذاكر",
      description: "اضغط الزر أدناه لفتح تذكرة",
      color: "#808080",
      buttonName: "فتح تذكرة",
      buttonStyle: "Primary",
      buttonEmoji: "",
      supportRoleId: null,
      categoryId: null,
      thumbnail: false,
      embedImage: "",
      welcomeMessage: "مرحباً بك في تذكرتك! سيقوم فريق الدعم بالرد عليك قريباً.",
      welcomeType: "embed",
      askReason: false,
    };

    const generatePreviewEmbed = () =>
      new EmbedBuilder()
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

    const mainButtons = () =>
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("edit_basics")
          .setLabel("⚙️ الإعدادات الأساسية")
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId("edit_advanced")
          .setLabel("✨ المظهر والرسالة")
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId("send_panel")
          .setLabel("🚀 تأكيد وإرسال")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId("cancel_setup")
          .setLabel("❌ إلغاء")
          .setStyle(ButtonStyle.Danger)
      );

    await interaction.reply({
      embeds: [
        generatePreviewEmbed().setFooter({
          text: "🛠️ معالج إعداد التذاكر | معاينة مباشرة",
        }),
      ],
      components: [mainButtons()],
      fetchReply: true,
    });

    while (true) {
      try {
        const filter = (i) => i.user.id === interaction.user.id;
        const i = await interaction.channel.awaitMessageComponent({
          filter,
          time: 300_000,
        });

        // --- التعامل مع النوافذ المنبثقة (Modals) أولاً ---
        if (i.type === 5) { // Modal Submit
          const input = i.fields.getTextInputValue("input");
          switch (i.customId) {
            case "modal_buttonName":
              settings.buttonName = input;
              break;
            case "modal_buttonEmoji":
              settings.buttonEmoji = input;
              break;
            case "modal_title":
              settings.title = input;
              break;
            case "modal_description":
              settings.description = input;
              break;
            case "modal_embedImage":
              settings.embedImage = input;
              break;
            case "modal_welcome":
              settings.welcomeMessage = input;
              break;
          }
          await i.deferUpdate(); // استهلاك التفاعل
          await i.editReply({
            embeds: [generatePreviewEmbed()],
            components: [mainButtons()],
          });
          continue;
        }

        // --- باقي الأزرار والقوائم (Message Components) ---
        // إذا كان الزر سيُظهر نافذة منبثقة، نعرضها فوراً دون deferUpdate
        if (i.isStringSelectMenu()) {
          const value = i.values[0];
          if (
            ["buttonName", "buttonEmoji", "title", "description", "embedImage", "welcomeMessage"].includes(value)
          ) {
            let modal;
            if (value === "buttonName") {
              modal = new ModalBuilder().setCustomId("modal_buttonName").setTitle("تغيير اسم الزر");
              modal.addComponents(new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId("input").setLabel("اسم الزر الجديد").setStyle(TextInputStyle.Short).setRequired(true)
              ));
            } else if (value === "buttonEmoji") {
              modal = new ModalBuilder().setCustomId("modal_buttonEmoji").setTitle("إضافة إيموجي للزر");
              modal.addComponents(new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId("input").setLabel("أدخل الإيموجي (اختياري)").setStyle(TextInputStyle.Short).setRequired(false)
              ));
            } else if (value === "title") {
              modal = new ModalBuilder().setCustomId("modal_title").setTitle("تغيير العنوان");
              modal.addComponents(new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId("input").setLabel("عنوان البانر الجديد").setStyle(TextInputStyle.Short).setRequired(true)
              ));
            } else if (value === "description") {
              modal = new ModalBuilder().setCustomId("modal_description").setTitle("تغيير الوصف");
              modal.addComponents(new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId("input").setLabel("وصف البانر الجديد").setStyle(TextInputStyle.Paragraph).setRequired(true)
              ));
            } else if (value === "embedImage") {
              modal = new ModalBuilder().setCustomId("modal_embedImage").setTitle("رابط صورة البانر");
              modal.addComponents(new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId("input").setLabel("أدخل رابط الصورة المباشر").setStyle(TextInputStyle.Short).setRequired(false)
              ));
            } else if (value === "welcomeMessage") {
              modal = new ModalBuilder().setCustomId("modal_welcome").setTitle("رسالة الترحيب");
              modal.addComponents(new ActionRowBuilder().addComponents(
                new TextInputBuilder().setCustomId("input").setLabel("رسالة الترحيب داخل التذكرة").setStyle(TextInputStyle.Paragraph).setRequired(true)
              ));
            }
            await i.showModal(modal);
            continue;
          }
        }

        // إذا وصلنا هنا، التفاعل لا يحتاج Modal، نستخدم deferUpdate
        await i.deferUpdate();

        if (i.customId === "cancel_setup") {
          return i.editReply({
            components: [],
            embeds: [
              new EmbedBuilder().setColor("#FF0000").setDescription("❌ تم إلغاء عملية الإعداد."),
            ],
          });
        }

        if (i.customId === "send_panel") {
          if (!settings.supportRoleId || !settings.categoryId) {
            await i.followUp({
              content: "⚠️ يجب اختيار رتبة الدعم وفئة القنوات قبل الإرسال.",
              flags: MessageFlags.Ephemeral,
            });
            continue;
          }
          break; // إرسال البانر
        }

        if (i.customId === "edit_basics") {
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
          await i.editReply({ components: [row, mainButtons()] });
          continue;
        }

        if (i.customId === "edit_advanced") {
          const row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
              .setCustomId("advanced_select")
              .setPlaceholder("اختر العنصر لتعديله")
              .addOptions([
                { label: "عنوان البانر", value: "title", emoji: "🏷️" },
                { label: "وصف البانر", value: "description", emoji: "📝" },
                { label: "لون التضمين", value: "color", emoji: "🎨" },
                { label: "صورة البانر", value: "embedImage", emoji: "🖼️" },
                { label: "أيقونة السيرفر", value: "thumbnail", emoji: "🖼️" },
                { label: "نوع رسالة الترحيب", value: "welcomeType", emoji: "💬" },
                { label: "سؤال السبب", value: "askReason", emoji: "❓" },
                { label: "رسالة الترحيب", value: "welcomeMessage", emoji: "📩" },
              ])
          );
          await i.editReply({ components: [row, mainButtons()] });
          continue;
        }

        // --- معالجة القوائم المنسدلة (بعد deferUpdate) ---
        if (i.isStringSelectMenu()) {
          const value = i.values[0];
          const customId = i.customId;

          if (value === "thumbnail") settings.thumbnail = !settings.thumbnail;
          else if (value === "welcomeType") settings.welcomeType = settings.welcomeType === "embed" ? "message" : "embed";
          else if (value === "askReason") settings.askReason = !settings.askReason;
          else if (customId === "basic_select" && value === "buttonStyle") {
            // عرض قائمة اختيار لون الزر
            const row = new ActionRowBuilder().addComponents(
              new StringSelectMenuBuilder()
                .setCustomId("select_buttonStyle")
                .setPlaceholder("اختر لون الزر")
                .addOptions(buttonStyles.map(s => ({ label: s.name, value: s.value })))
            );
            await i.editReply({ components: [row, mainButtons()] });
            continue;
          }
          else if (customId === "basic_select" && value === "supportRole") {
            const roles = interaction.guild.roles.cache.filter(r => !r.managed && r.name !== "@everyone").first(25);
            const row = new ActionRowBuilder().addComponents(
              new StringSelectMenuBuilder()
                .setCustomId("select_supportRole")
                .setPlaceholder("اختر رتبة الدعم")
                .addOptions(roles.map(r => ({ label: r.name, value: r.id })))
            );
            await i.editReply({ components: [row, mainButtons()] });
            continue;
          }
          else if (customId === "basic_select" && value === "category") {
            const categories = interaction.guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory).first(25);
            const row = new ActionRowBuilder().addComponents(
              new StringSelectMenuBuilder()
                .setCustomId("select_category")
                .setPlaceholder("اختر الفئة")
                .addOptions(categories.map(c => ({ label: c.name, value: c.id })))
            );
            await i.editReply({ components: [row, mainButtons()] });
            continue;
          }
          else if (customId === "advanced_select" && value === "color") {
            const row = new ActionRowBuilder().addComponents(
              new StringSelectMenuBuilder()
                .setCustomId("select_color")
                .setPlaceholder("اختر لون التضمين")
                .addOptions(embedColors.map(c => ({ label: c.name, value: c.value })))
            );
            await i.editReply({ components: [row, mainButtons()] });
            continue;
          }

          await i.editReply({
            embeds: [generatePreviewEmbed()],
            components: [mainButtons()],
          });
          continue;
        }

        // --- معالجة اختيارات القوائم الثانوية ---
        if (i.customId === "select_buttonStyle") {
          settings.buttonStyle = i.values[0];
        } else if (i.customId === "select_supportRole") {
          settings.supportRoleId = i.values[0];
        } else if (i.customId === "select_category") {
          settings.categoryId = i.values[0];
        } else if (i.customId === "select_color") {
          settings.color = i.values[0];
        }

        await i.editReply({
          embeds: [generatePreviewEmbed()],
          components: [mainButtons()],
        });

      } catch (error) {
        console.error(error);
        return interaction.editReply({
          components: [],
          embeds: [
            new EmbedBuilder().setColor("#FF0000").setDescription("⏰ انتهت مهلة الإعداد أو حدث خطأ."),
          ],
        });
      }
    }

    // إرسال البانر النهائي
    const randomId = `ticket_${Math.random().toString(36).substr(2, 9)}`;
    const btn = new ButtonBuilder()
      .setCustomId(randomId)
      .setLabel(settings.buttonName)
      .setStyle(ButtonStyle[settings.buttonStyle]);
    if (settings.buttonEmoji) btn.setEmoji(settings.buttonEmoji);

    const finalRow = new ActionRowBuilder().addComponents(btn);
    await interaction.channel.send({
      embeds: [generatePreviewEmbed()],
      components: [finalRow],
    });

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

    await interaction.editReply({
      components: [],
      embeds: [
        new EmbedBuilder().setColor("#00FF00").setDescription("✅ تم إنشاء نظام التذاكر بنجاح!"),
      ],
    });
  },
};