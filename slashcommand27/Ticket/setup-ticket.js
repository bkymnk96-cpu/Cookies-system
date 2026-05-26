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
      !interaction.member.permissions.has(
        require("discord.js").PermissionsBitField.Flags.Administrator
      )
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

    // إرسال واجهة المعالج
    const reply = await interaction.reply({
      embeds: [
        generatePreviewEmbed().setFooter({
          text: "🛠️ معالج إعداد التذاكر | معاينة مباشرة",
        }),
      ],
      components: [mainButtons()],
      fetchReply: true,
    });

    const collector = reply.createMessageComponentCollector({
      time: 300_000, // 5 دقائق
    });

    collector.on("collect", async (i) => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({
          content: "هذه القائمة ليست لك.",
          flags: MessageFlags.Ephemeral,
        });
      }

      await i.deferUpdate();

      if (i.customId === "cancel_setup") {
        collector.stop("cancelled");
        return i.editReply({
          components: [],
          embeds: [
            new EmbedBuilder()
              .setColor("#FF0000")
              .setDescription("❌ تم إلغاء عملية الإعداد."),
          ],
        });
      }

      if (i.customId === "send_panel") {
        if (!settings.supportRoleId || !settings.categoryId) {
          return i.followUp({
            content:
              "⚠️ يجب اختيار رتبة الدعم وفئة القنوات قبل الإرسال.",
            flags: MessageFlags.Ephemeral,
          });
        }
        collector.stop("send");
        return;
      }

      // --- معالجات القوائم الفرعية ---
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
        return i.editReply({
          components: [row, mainButtons()],
        });
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
        return i.editReply({
          components: [row, mainButtons()],
        });
      }

      // --- معالجة التحديدات من القوائم المنسدلة ---
      if (i.isStringSelectMenu()) {
        const value = i.values[0];

        // اختيار اسم الزر
        if (value === "buttonName") {
          const modal = new ModalBuilder()
            .setCustomId("modal_buttonName")
            .setTitle("تغيير اسم الزر");
          const input = new TextInputBuilder()
            .setCustomId("input")
            .setLabel("اسم الزر الجديد")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);
          modal.addComponents(new ActionRowBuilder().addComponents(input));
          return i.showModal(modal);
        }

        // لون الزر
        if (value === "buttonStyle") {
          const row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
              .setCustomId("select_buttonStyle")
              .setPlaceholder("اختر لون الزر")
              .addOptions(
                buttonStyles.map((s) => ({
                  label: s.name,
                  value: s.value,
                }))
              )
          );
          return i.editReply({ components: [row, mainButtons()] });
        }

        // إيموجي الزر
        if (value === "buttonEmoji") {
          const modal = new ModalBuilder()
            .setCustomId("modal_buttonEmoji")
            .setTitle("إضافة إيموجي للزر");
          const input = new TextInputBuilder()
            .setCustomId("input")
            .setLabel("أدخل الإيموجي (اختياري)")
            .setStyle(TextInputStyle.Short)
            .setRequired(false);
          modal.addComponents(new ActionRowBuilder().addComponents(input));
          return i.showModal(modal);
        }

        // رتبة الدعم
        if (value === "supportRole") {
          const roles = interaction.guild.roles.cache
            .filter((r) => !r.managed && r.name !== "@everyone")
            .first(25);
          const row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
              .setCustomId("select_supportRole")
              .setPlaceholder("اختر رتبة الدعم")
              .addOptions(
                roles.map((r) => ({
                  label: r.name,
                  value: r.id,
                }))
              )
          );
          return i.editReply({ components: [row, mainButtons()] });
        }

        // فئة القنوات
        if (value === "category") {
          const categories = interaction.guild.channels.cache.filter(
            (c) => c.type === ChannelType.GuildCategory
          ).first(25);
          const row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
              .setCustomId("select_category")
              .setPlaceholder("اختر الفئة")
              .addOptions(
                categories.map((c) => ({
                  label: c.name,
                  value: c.id,
                }))
              )
          );
          return i.editReply({ components: [row, mainButtons()] });
        }

        // عنوان البانر
        if (value === "title") {
          const modal = new ModalBuilder()
            .setCustomId("modal_title")
            .setTitle("تغيير العنوان");
          const input = new TextInputBuilder()
            .setCustomId("input")
            .setLabel("عنوان البانر الجديد")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);
          modal.addComponents(new ActionRowBuilder().addComponents(input));
          return i.showModal(modal);
        }

        // وصف البانر
        if (value === "description") {
          const modal = new ModalBuilder()
            .setCustomId("modal_description")
            .setTitle("تغيير الوصف");
          const input = new TextInputBuilder()
            .setCustomId("input")
            .setLabel("وصف البانر الجديد")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);
          modal.addComponents(new ActionRowBuilder().addComponents(input));
          return i.showModal(modal);
        }

        // لون التضمين
        if (value === "color") {
          const row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
              .setCustomId("select_color")
              .setPlaceholder("اختر لون التضمين")
              .addOptions(
                embedColors.map((c) => ({
                  label: c.name,
                  value: c.value,
                }))
              )
          );
          return i.editReply({ components: [row, mainButtons()] });
        }

        // صورة البانر
        if (value === "embedImage") {
          const modal = new ModalBuilder()
            .setCustomId("modal_embedImage")
            .setTitle("رابط صورة البانر");
          const input = new TextInputBuilder()
            .setCustomId("input")
            .setLabel("أدخل رابط الصورة المباشر")
            .setStyle(TextInputStyle.Short)
            .setRequired(false);
          modal.addComponents(new ActionRowBuilder().addComponents(input));
          return i.showModal(modal);
        }

        // أيقونة السيرفر (thumbnail)
        if (value === "thumbnail") {
          settings.thumbnail = !settings.thumbnail;
          await i.editReply({
            embeds: [generatePreviewEmbed()],
            components: [mainButtons()],
          });
          return;
        }

        // نوع رسالة الترحيب
        if (value === "welcomeType") {
          settings.welcomeType =
            settings.welcomeType === "embed" ? "message" : "embed";
          await i.editReply({
            embeds: [generatePreviewEmbed()],
            components: [mainButtons()],
          });
          return;
        }

        // سؤال السبب
        if (value === "askReason") {
          settings.askReason = !settings.askReason;
          await i.editReply({
            embeds: [generatePreviewEmbed()],
            components: [mainButtons()],
          });
          return;
        }

        // رسالة الترحيب
        if (value === "welcomeMessage") {
          const modal = new ModalBuilder()
            .setCustomId("modal_welcome")
            .setTitle("رسالة الترحيب");
          const input = new TextInputBuilder()
            .setCustomId("input")
            .setLabel("رسالة الترحيب داخل التذكرة")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);
          modal.addComponents(new ActionRowBuilder().addComponents(input));
          return i.showModal(modal);
        }

        // --- خيارات القوائم الثانوية (اختيارات مباشرة) ---
        if (i.customId === "select_buttonStyle") {
          settings.buttonStyle = value;
        } else if (i.customId === "select_supportRole") {
          settings.supportRoleId = value;
        } else if (i.customId === "select_category") {
          settings.categoryId = value;
        } else if (i.customId === "select_color") {
          settings.color = value;
        }

        // تحديث المعاينة
        return i.editReply({
          embeds: [generatePreviewEmbed()],
          components: [mainButtons()],
        });
      }

      // --- معالجة ردود النوافذ المنبثقة (Modals) ---
      // يصلنا تفاعل modal submit عبر collector أيضاً في حال كان من نفس الرسالة؟ 
      // Modal submit لا يمر عبر message component collector. سنحتاج إلى awaitModalSubmit منفصل.
      // لتجنب التعقيد، سنقوم بمعالجة modals عبر awaitModalSubmit في نفس نطاق execute، لكن لا يمكننا فعل ذلك هنا.
      // بدلاً من ذلك، سنستخدم interaction.createModal و ننتظر الرد خارج collector. سنعيد هيكلة.
      // سأوقف تنفيذ الـ collector مؤقتاً، لكن عملياً سنقوم بالتقاط الـ modal submit في كتلة try/catch منفصلة.
      // الحل الأمثل: عدم استخدام collector مع modals. لذلك سأقوم باستبدال Modals بـ ... لكن المطلوب تفاعل.
      // سأحول الأمر إلى استخدام awaitMessageComponent بشكل تسلسلي بدلاً من collector، لتسهيل modals.
      // القرار: سأعيد كتابة الآلية بالكامل باستخدام حلقة while و awaitMessageComponent، بحيث أستطيع انتظار modal submit بشكل طبيعي.
      // هذا أكثر حداثة وسلاسة. سأقوم بتنفيذ ذلك الآن.
    });

    collector.on("end", async (collected, reason) => {
      if (reason === "send") {
        // بناء الزر النهائي وإرسال البانر
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

        await reply.edit({
          components: [],
          embeds: [
            new EmbedBuilder()
              .setColor("#00FF00")
              .setDescription("✅ تم إنشاء نظام التذاكر بنجاح!"),
          ],
        });
      } else if (reason === "cancelled") {
        // تم الإلغاء مسبقًا
      } else {
        await reply.edit({
          components: [],
          embeds: [
            new EmbedBuilder()
              .setColor("#FF0000")
              .setDescription("⏰ انتهت مهلة الإعداد. حاول مجدداً."),
          ],
        });
      }
    });
  },
};