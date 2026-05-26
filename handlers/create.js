const keyValueService = require("../services/keyValueService");

const {
  StringSelectMenuOptionBuilder,
  StringSelectMenuBuilder,
  EmbedBuilder,
  PermissionsBitField,
  ButtonStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");

module.exports = (client) => {
  client.on("InteractionCreate", async (interaction) => {
    // --- 1. التعامل مع أزرار وقوائم التذاكر (customId يبدأ بـ ticket) ---
    if (
      (interaction.isButton() || interaction.isStringSelectMenu()) &&
      interaction.customId.startsWith("ticket")
    ) {
      const customId = interaction.isStringSelectMenu()
        ? interaction.values[0]
        : interaction.customId;

      if (customId === "reset") return;

      const data = await keyValueService.get(
        "ticketDB",
        `Ticket_${interaction.channel.id}_${customId}`
      );
      if (!data)
        return interaction.reply({
          content: "❌ بيانات التذكرة غير موجودة. أعد إعداد النظام.",
          ephemeral: true,
        });

      // إذا كان سؤال السبب مفعّلاً، نرسل نافذة
      if (data.Ask === "on" || data.Ask === true) {
        const modal = new ModalBuilder()
          .setCustomId(customId + "_modal")
          .setTitle("سبب فتح التذكرة")
          .addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId("ticket_reason")
                .setLabel("ما هو سبب فتح التذكرة؟")
                .setStyle(TextInputStyle.Short)
                .setRequired(true)
            )
          );
        await interaction.showModal(modal);
      } else {
        // إنشاء التذكرة مباشرة
        await createTicketChannel(interaction, data);
      }
      return;
    }

    // --- 2. التعامل مع الرد على النافذة المنبثقة (ModalSubmit) ---
    if (
      interaction.isModalSubmit() &&
      interaction.customId.endsWith("_modal")
    ) {
      const buttonCustomId = interaction.customId.replace("_modal", "");
      const data = await keyValueService.get(
        "ticketDB",
        `Ticket_${interaction.channel.id}_${buttonCustomId}`
      );
      if (!data)
        return interaction.reply({
          content: "❌ بيانات التذكرة غير موجودة.",
          ephemeral: true,
        });

      const ticketReason =
        interaction.fields.getTextInputValue("ticket_reason");
      await createTicketChannel(interaction, data, ticketReason);
      return;
    }
  });
};

// =========================
// دالة إنشاء قناة التذكرة
// =========================
async function createTicketChannel(interaction, data, ticketReason = null) {
  // 1. إنشاء القناة
  const channel = await interaction.guild.channels.create({
    name: `ticket-${interaction.user.username}`,
    type: 0, // GuildText
    parent: data.Category,
    permissionOverwrites: [
      {
        id: interaction.guild.roles.everyone.id,
        deny: [PermissionsBitField.Flags.ViewChannel],
      },
      {
        id: data.Support,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
        ],
      },
      {
        id: interaction.user.id,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
        ],
      },
    ],
  });

  // 2. تخزين مرجع إضافي (author, Support)
  await keyValueService.set("ticketDB", `TICKET-PANEL_${channel.id}`, {
    author: interaction.user.id,
    Support: data.Support,
  });

  // رد مخفي بأن التذكرة فُتحت
  await interaction.reply({
    content: `✅ تم إنشاء تذكرتك: ${channel}`,
    ephemeral: true,
  });

  // 3. بناء سطر المنشنات (يظهر فوق الإيمبد)
  const mentionLine = `${interaction.user} | <@&${data.Support}>`;

  // 4. تجهيز الإيمبد (أو النص) بناءً على Internal
  let welcomeEmbed = null;
  let welcomeText = null;

  const internalData = data.Internal || "";

  // إذا كان النص يشير إلى قالب ترحيب
  if (internalData.startsWith("[template:")) {
    const templateName = internalData.slice(10, -1); // استخراج الاسم
    const templates =
      (await keyValueService.get("welcomeTemplates", interaction.guild.id)) ||
      {};
    const template = templates[templateName];
    if (template) {
      // بناء الإيمبد من القالب
      welcomeEmbed = new EmbedBuilder()
        .setColor(template.color || "Random")
        .setTitle(template.title || null)
        .setDescription(template.description || null)
        .setThumbnail(
          template.thumbnail ? interaction.guild.iconURL() : null
        )
        .setImage(template.image || null)
        .setFooter({
          text: interaction.guild.name,
          iconURL: interaction.guild.iconURL(),
        })
        .setTimestamp();
    } else {
      // إذا لم يوجد القالب، استخدم النص الافتراضي
      welcomeText = "مرحباً بك في تذكرتك!";
    }
  } else {
    // نص عادي (إما Embed أو Message حسب الإعداد)
    if (internalData) {
      if (data.Type === "embed") {
        welcomeEmbed = new EmbedBuilder()
          .setColor("Random")
          .setDescription(internalData)
          .setFooter({
            text: interaction.guild.name,
            iconURL: interaction.guild.iconURL(),
          })
          .setTimestamp();
      } else {
        welcomeText = internalData;
      }
    } else {
      // إذا لم يوجد نص، لا نرسل شيئاً إضافياً
      welcomeText = null;
    }
  }

  // 5. تحضير الأزرار (Close / Claim) بالعربية
  const closeButton = new ButtonBuilder()
    .setCustomId("closeTicket")
    .setLabel("إغلاق")
    .setStyle(ButtonStyle.Danger) // أحمر
    .setEmoji("🔒");

  const claimButton = new ButtonBuilder()
    .setCustomId("claimTicket")
    .setLabel("استلام")
    .setStyle(ButtonStyle.Success) // أخضر
    .setEmoji("📥");

  const row = new ActionRowBuilder().addComponents(closeButton, claimButton);

  // القائمة المنسدلة (لوحة تحكم السبورت) – موجودة مسبقاً
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("supportPanel")
    .setPlaceholder("لوحة تحكم السبورت")
    .addOptions([
      new StringSelectMenuOptionBuilder()
        .setLabel("تغيير اسم التذكرة")
        .setValue("renameTicket")
        .setEmoji("✍🏼"),
      new StringSelectMenuOptionBuilder()
        .setLabel("إضافة عضو للتذكرة")
        .setValue("addMemberToTicket")
        .setEmoji("✅"),
      new StringSelectMenuOptionBuilder()
        .setLabel("حذف عضو من التذكرة")
        .setValue("removeMemberFromTicket")
        .setEmoji("⛔"),
      new StringSelectMenuOptionBuilder()
        .setLabel("إعادة تحميل")
        .setValue("refreshSupportPanel")
        .setEmoji("🔄"),
    ]);

  const row2 = new ActionRowBuilder().addComponents(selectMenu);

  // 6. إرسال رسالة الترحيب في القناة الجديدة
  if (welcomeEmbed) {
    // إذا كان لدينا إيمبد، نرسل المنشنات + الإيمبد
    await channel.send({
      content: mentionLine,
      embeds: [welcomeEmbed],
      components: [row, row2],
    });
  } else if (welcomeText) {
    // إذا كان النص فقط، نضيفه بعد المنشنات
    await channel.send({
      content: `${mentionLine}\n${welcomeText}`,
      components: [row, row2],
    });
  } else {
    // إذا لم يوجد أي نص ترحيبي، نرسل المنشنات فقط مع الأزرار
    await channel.send({
      content: mentionLine,
      components: [row, row2],
    });
  }

  // 7. إذا كان هناك سبب للتذكرة، نرسله في رسالة منفصلة
  if (ticketReason) {
    const reasonEmbed = new EmbedBuilder()
      .setColor("Random")
      .setDescription(`**سبب فتح التذكرة:** \`\`\`${ticketReason}\`\`\``)
      .setTimestamp();
    await channel.send({ embeds: [reasonEmbed] });
  }
}