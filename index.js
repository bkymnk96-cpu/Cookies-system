const {
  Client,
  Collection,
  GatewayIntentBits,
  ChannelType,
  AuditLogEvent,
  Partials,
  EmbedBuilder,
  ApplicationCommandOptionType,
  Events,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
  ActivityType
} = require("discord.js");
const moment = require("moment");
const keyValueService = require("./services/keyValueService");
const { handleAutoReplyMessage } = require("./utils/autoReplyUtils");
const { handleShortcutMessage } = require("./utils/shortcutUtils");
const { handleDynamicHelpInteraction } = require("./utils/helpUtils");
const { getWelcomeConfig, buildWelcomePayload, applyVariables } = require("./utils/welcomeUtils");
const { handleAutoReactions } = require("./utils/autoReactionUtils");
const { applyArabicCommandLocalization } = require("./utils/slashCommandArabic");
const { trackTextActivity, handleVoiceStateActivity, initializeVoiceSessions } = require("./utils/activityUtils");
const { canManageTicket, normalizeTicketMetadata, markTicketClosed, sendTicketCloseLog } = require("./utils/ticketUtils");
const ms = require("ms");













const path = require("path");
const { readdirSync } = require("fs");
const { botTokens, owner } = require("./config.js"); // ✅ استيراد أولاً
const { startDashboard } = require("./dashboard/server");
const { canRunCommand } = require("./dashboard/services/commandConfigService");
const { connectDatabase } = require("./handlers/database");
const theowner = owner;



connectDatabase().catch((err) => {
  console.error("[MongoDB] فشل الاتصال الأولي:", err.message);
});

async function startSystemBot(token, botIndex = 1) {
if (!token) return;
const client27 = new Client({
  intents: 131071,
  shards: "auto",
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember],
});
client27.commands = new Collection();
client27.events = new Collection();
client27.setMaxListeners(1000);

// Handlers registration (once)
require(`./handlers/events`)(client27);
require("./handlers/suggest")(client27);
require("./handlers/tax4bot")(client27);
require("./handlers/autorole")(client27);
require(`./handlers/claim`)(client27);
require(`./handlers/close`)(client27);
require(`./handlers/create`)(client27);
require(`./handlers/reset`)(client27);
require(`./handlers/support-panel`)(client27);
require("./handlers/joinGiveaway")(client27);
require(`./handlers/applyCreate`)(client27);
require(`./handlers/applyResult`)(client27);
require(`./handlers/applySubmit`)(client27);
require(`./handlers/addToken`)(client27);
require(`./handlers/info`)(client27);
require(`./handlers/sendBroadcast`)(client27);
require(`./handlers/setBroadcastMessage`)(client27);

// Load slash commands
const folderPath = path.join(__dirname, "slashcommand27");
client27.CookiesSlashCommands = new Collection();
let CookiesSlashCommands = []; // will be used in ready event
const ascii = require("ascii-table");
const table = new ascii("Cookies commands").setJustify();

for (let folder of readdirSync(folderPath).filter(
  (folder) => !folder.includes(".")
)) {
  for (let file of readdirSync(`${folderPath}/${folder}`).filter((f) =>
    f.endsWith(".js")
  )) {
    const filePath = `${folderPath}/${folder}/${file}`;
    // حذف الملف من ذاكرة التخزين المؤقت لضمان تحميل النسخة الأحدث
    delete require.cache[require.resolve(filePath)];
    let command = applyArabicCommandLocalization(require(filePath));
    if (command) {
      command.category = command.category || folder;
      command.filePath = command.filePath || filePath;
      CookiesSlashCommands.push(command.data.toJSON());
      client27.CookiesSlashCommands.set(command.data.name, command);
      if (command.data.name) {
        table.addRow(`/${command.data.name}`, "🟢 Working");
      } else {
        table.addRow(`/${command.data.name}`, "🔴 Not Working");
      }
    }
  }
}

// Load commands again (the second loop in original is redundant, kept for safety but can be merged)
// I'll keep it but it's harmless
const folderPath2 = path.join(__dirname, "slashcommand27");
for (let foldeer of readdirSync(folderPath2).filter(
  (folder) => !folder.includes(".")
)) {
  for (let fiee of readdirSync(`${folderPath2}/${foldeer}`).filter((fi) =>
    fi.endsWith(".js")
  )) {
    const filePath2 = `${folderPath2}/${foldeer}/${fiee}`;
    delete require.cache[require.resolve(filePath2)];
    const commander = require(filePath2);
  }
}

// Load event files from events folder
for (let file of readdirSync("./events/").filter((f) => f.endsWith(".js"))) {
  const eventPath = `./events/${file}`;
  delete require.cache[require.resolve(eventPath)];
  const event = require(eventPath);
  if (event.once) {
    client27.once(event.name, (...args) => event.execute(...args));
  } else {
    client27.on(event.name, (...args) => event.execute(...args));
  }
}

// ── Ready Event ──
client27.once("clientReady", async () => {
  if (botIndex === 1 && process.env.DASHBOARD_ENABLED !== "false") {
    startDashboard(client27);
  }
  // Register slash commands
  try {
    
    const { REST } = require("@discordjs/rest");
    const { Routes } = require("discord-api-types/v10");
    const rest = new REST({ version: "10" }).setToken(client27.token);
    
    await rest.put(Routes.applicationCommands(client27.user.id), {
      body: CookiesSlashCommands,
    });
  } catch (error) {
    console.error(error);
  }

  // Check guilds with less than 10 members
  client27.guilds.cache.forEach((guild) => {
    guild.members
      .fetch()
      .then((members) => {
        if (members.size < 10) {
          console.log(
            `بوت Cookies: السيرفر ${guild.name} يحتوي على أقل من 10 أعضاء`
          );
        }
      })
      .catch(console.error);
  });
});

// ── MessageCreate: test ──
client27.on("messageCreate", async (message) => {
  if (message.content == "test") {
    message.reply(`يعمل بشكل صحيح`);
  }
});

// ── Activity tracking ──
client27.on("messageCreate", async (message) => {
  await trackTextActivity(message).catch(console.error);
});

client27.on("voiceStateUpdate", async (oldState, newState) => {
  await handleVoiceStateActivity(oldState, newState).catch(console.error);
});

client27.once("ready", async () => {
  initializeVoiceSessions(client27);
  for (const guild of client27.guilds.cache.values()) {
    await guild.invites.fetch().then((guildInvites) => {
      invites[guild.id] = new Map(guildInvites.map((invite) => [invite.code, invite.uses]));
    }).catch(() => null);
  }
});

// ── InteractionCreate (slash commands) ──
client27.on("interactionCreate", async (interaction) => {
  if (interaction.isAutocomplete()) {
    const command = client27.CookiesSlashCommands.get(interaction.commandName);
    if (command?.autocomplete) {
      try {
        await command.autocomplete(interaction);
      } catch (error) {
        console.log("🔴 | خطأ في الإكمال التلقائي", error);
      }
    }
    return;
  }

  if (interaction.isChatInputCommand()) {
    if (interaction.user.bot) return;
    const command = client27.CookiesSlashCommands.get(interaction.commandName);
    if (!command) return;
    if (command.ownersOnly === true && owner != interaction.user.id) {
      return interaction.reply({
        content: `❗ ***لا تستطيع استخدام هذا الامر***`,
        ephemeral: true,
      });
    }
    if (command.adminsOnly === true) {
      if (
        !interaction.member.permissions.has(
          PermissionsBitField.Flags.Administrator
        )
      ) {
        return interaction.reply({
          content: `❗ ***يجب أن تمتلك صلاحية الأدمن لاستخدام هذا الأمر***`,
          ephemeral: true,
        });
      }
    }
    try {
      const dashboardPermission = await canRunCommand(interaction, command);
      if (!dashboardPermission.ok) {
        return interaction.reply({ content: `❗ **${dashboardPermission.reason}**`, ephemeral: true });
      }
      await command.execute(interaction, client27);
    } catch (error) {
      return console.log("🔴 | خطأ في بوت Cookies", error);
    }
  }
});

// ── Giveaway System (fixed) ──
client27.on("ready", async () => {
  let theguild = client27.guilds.cache.first();
  setInterval(async () => {
    if (!theguild) return;
    let giveaways = await keyValueService.get('giveawayDB', `giveaways_${theguild.id}`);
    if (!giveaways || !Array.isArray(giveaways)) return;
    giveaways.forEach(async (giveaway) => {
      let {
        messageid,
        channelid,
        entries,
        winners,
        prize,
        duration,
        dir1,
        dir2,
        ended,
      } = giveaway;
      if (duration > 0) {
        duration = duration - 1;
        giveaway.duration = duration;
        await keyValueService.set('giveawayDB', `giveaways_${theguild.id}`, giveaways);
      } else if (duration == 0) {
        duration = duration - 1;
        giveaway.duration = duration;
        await keyValueService.set('giveawayDB', `giveaways_${theguild.id}`, giveaways);
        const theroom = theguild.channels.cache.find(
          (ch) => ch.id == channelid
        );
        if (!theroom) return;
        await theroom.messages.fetch(messageid);
        const themsg = await theroom.messages.cache.find(
          (msg) => msg.id == messageid
        );
        if (!themsg) return;
        if (entries.length > 0 && entries.length >= winners) {
          const theWinners = [];
          for (let i = 0; i < winners; i++) {
            let winner = Math.floor(Math.random() * entries.length);
            let winnerExcept = entries.splice(winner, 1)[0];
            theWinners.push(winnerExcept);
          }
          const button = new ButtonBuilder()
            .setEmoji(`🎉`)
            .setStyle(ButtonStyle.Primary)
            .setCustomId(`join_giveaway`)
            .setDisabled(true);
          const row = new ActionRowBuilder().addComponents(button);
          themsg.edit({ components: [row] });
          themsg.reply({
            content: `🎉 مبروك ${theWinners}! لقد فزت بـ **${prize}**!`,
          });
          giveaway.ended = true;
          await keyValueService.set('giveawayDB', `giveaways_${theguild.id}`, giveaways);
        } else {
          const button = new ButtonBuilder()
            .setEmoji(`🎉`)
            .setStyle(ButtonStyle.Primary)
            .setCustomId(`join_giveaway`)
            .setDisabled(true);
          const row = new ActionRowBuilder().addComponents(button);
          themsg.edit({ components: [row] });
          themsg.reply({ content: `**لا يوجد عدد من المشتركين كافي**` });
          giveaway.ended = true;
          await keyValueService.set('giveawayDB', `giveaways_${theguild.id}`, giveaways);
        }
      }
    });
  }, 1000);
});

// ── Tax Auto System ──
client27.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  let roomid = await keyValueService.get('taxDB', `tax_room_${message.guild.id}`);
  let taxLine = await keyValueService.get('taxDB', `tax_line_${message.guild.id}`);
  let taxMode = await keyValueService.get('taxDB', `tax_mode_${message.guild.id}`) || "embed";
  let taxColor = await keyValueService.get('taxDB', `tax_color_${message.guild.id}`) || "#0099FF";

  if (roomid && message.channel.id === roomid) {
    let number = message.content;
    if (number.endsWith("k")) number = number.replace(/k/gi, "") * 1000;
    else if (number.endsWith("K")) number = number.replace(/K/gi, "") * 1000;
    else if (number.endsWith("m")) number = number.replace(/m/gi, "") * 1000000;
    else if (number.endsWith("M")) number = number.replace(/M/gi, "") * 1000000;
    if (isNaN(number) || number == 0) return message.delete();

    let number2 = parseInt(number);
    let tax = Math.floor((number2 * 20) / 19 + 1);
    let tax2 = Math.floor(tax - number2);
    let tax3 = Math.floor((tax * 20) / 19 + 1);
    let tax4 = Math.floor(number2 * 0.02);
    let tax5 = Math.floor(tax3 + tax4);

    let description = `
🪙 المبلغ ** : ${number2}**
- ضريبة برو بوت **: ${tax}**
- المبلغ كامل مع ضريبة الوسيط **: ${tax3}**
- نسبة الوسيط 2 % **: ${tax4}**
- الضريبة كاملة مع نسبة الوسيط **: ${tax5}**
`;
    let btn1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`tax_${tax}`)
        .setLabel("الضريبة")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId(`mediator_${tax5}`)
        .setLabel("الوسيط")
        .setStyle(ButtonStyle.Secondary)
    );

    if (taxMode === "embed") {
      let embed1 = new EmbedBuilder()
        .setColor(taxColor)
        .setDescription(description)
        .setThumbnail(message.guild.iconURL({ dynamic: true }));
      message.reply({ embeds: [embed1], components: [btn1] });
    } else {
      message.reply({ content: description, components: [btn1] });
    }
    if (taxLine) message.channel.send({ files: [taxLine] });
  }
});

// ── Autoline manual and auto ──
client27.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  const line = await keyValueService.get('autolineDB', `line_${message.guild.id}`);
  const lineMode = await keyValueService.get('autolineDB', `line_mode_${message.guild.id}`) || "image";

  if (
    (message.content === "-" || message.content === "خط") &&
    line &&
    message.member.permissions.has("ManageMessages")
  ) {
    await message.delete();
    if (lineMode === "link") {
      return message.channel.send({ content: `${line}` });
    } else if (lineMode === "image") {
      return message.channel.send({ files: [line] });
    }
  }

  // Auto line channels
  const autoChannels = await keyValueService.get('autolineDB', `line_channels_${message.guild.id}`);
  if (autoChannels && autoChannels.length > 0 && autoChannels.includes(message.channel.id)) {
    if (line) {
      if (lineMode === "link") {
        return message.channel.send({ content: `${line}` });
      } else if (lineMode === "image") {
        return message.channel.send({ files: [line] });
      }
    }
  }
});

// ── Rate designer ──
client27.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (message.content == `قيمني`) {
    const designer = message.author;
    const designRole = "1271443664194895894";
    if (!message.member.roles.cache.has(designRole)) return;

    const filter = (response) =>
      !response.author.bot && response.author.id !== designer.id;

    message.channel
      .send(`من فضلك أكتب تقييمك للتصاميم، <@${designer.id}>`)
      .then(() => {
        message.channel
          .awaitMessages({ filter, max: 1, errors: ["time"] })
          .then(async (collected) => {
            const user = collected.first().author;
            const userText = collected.first().content;
            const rankroom = "1278108478828843118";

            const st1 = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId("1star")
                .setLabel("نجمة 1")
                .setEmoji(`⭐`)
                .setStyle(ButtonStyle.Danger),
              new ButtonBuilder()
                .setCustomId("2star")
                .setLabel("نجمتين 2")
                .setEmoji(`⭐`)
                .setStyle(ButtonStyle.Danger),
              new ButtonBuilder()
                .setCustomId("3star")
                .setLabel("3 نجوم")
                .setEmoji(`⭐`)
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId("4star")
                .setLabel("4 نجوم")
                .setEmoji(`⭐`)
                .setStyle(ButtonStyle.Primary),
              new ButtonBuilder()
                .setCustomId("5star")
                .setLabel("5 نجوم")
                .setEmoji(`⭐`)
                .setStyle(ButtonStyle.Primary)
            );

            await message.channel.send({
              content: "اختر عدد النجوم:",
              components: [st1],
            });

            const buttonFilter = (i) =>
              !i.user.bot && i.user.id !== designer.id;
            const collector = message.channel.createMessageComponentCollector({
              filter: buttonFilter,
              time: 60000,
            });

            collector.on("collect", async (interaction) => {
              if (!interaction.isButton()) return;
              let embedDescription;
              switch (interaction.customId) {
                case "1star": embedDescription = "⭐"; break;
                case "2star": embedDescription = "⭐⭐"; break;
                case "3star": embedDescription = "⭐⭐⭐"; break;
                case "4star": embedDescription = "⭐⭐⭐⭐"; break;
                case "5star": embedDescription = "⭐⭐⭐⭐⭐"; break;
              }
              const embedrank = new EmbedBuilder()
                .setDescription(
                  `${userText}\n**عدد النجوم:**\n${embedDescription}`
                )
                .setColor("#808080")
                .setAuthor({
                  name: user.username,
                  iconURL: user.displayAvatarURL(),
                });
              const rankChannel =
                client27.channels.cache.get(rankroom);
              if (rankChannel) {
                await rankChannel.send({
                  content: `المصمم: <@${designer.id}>`,
                  embeds: [embedrank],
                });
                await interaction.reply({
                  content:
                    "تم إرسال تقييمك بنجاح، نشكرك لاستعمال خدماتنا",
                  ephemeral: true,
                });
              } else {
                await interaction.reply({
                  content: "حدث خطأ، روم التقييم غير موجود.",
                  ephemeral: true,
                });
              }
              await interaction.message.delete();
              collector.stop();
            });

            collector.on("end", (collected) => {
              if (collected.size === 0) {
                message.channel.send("لم يتم تلقي أي تقييمات.");
              }
            });
          })
          .catch((error) => {
            console.error("خطأ أثناء جمع الرسائل: ", error);
            message.channel.send("انتهى الوقت، لا يمكنك التقييم.");
          });
      });
  }
});

// ── Suggestions system ──
client27.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  const line = await keyValueService.get('suggestionsDB', `line_${message.guild.id}`);
  const chan = await keyValueService.get('suggestionsDB', `suggestions_room_${message.guild.id}`);
  if (!chan || message.channel.id !== chan) return;
  const suggestionMode = await keyValueService.get('suggestionsDB', `suggestion_mode_${message.guild.id}`) || "buttons";
  const threadMode = await keyValueService.get('suggestionsDB', `thread_mode_${message.guild.id}`) || "enabled";

  const embed = new EmbedBuilder()
    .setColor("Random")
    .setTimestamp()
    .setTitle(`** > ${message.content} **`)
    .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
    .setAuthor({ name: message.author.username, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
    .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL({ dynamic: true }) });

  if (suggestionMode === "buttons") {
    const button1 = new ButtonBuilder().setCustomId(`ok_button`).setLabel(`0`).setEmoji("✔️").setStyle(ButtonStyle.Success);
    const button2 = new ButtonBuilder().setCustomId(`no_button`).setLabel(`0`).setEmoji("✖️").setStyle(ButtonStyle.Danger);
    const row = new ActionRowBuilder().addComponents(button1, button2);
    let send = await message.channel.send({ embeds: [embed], components: [row] }).catch(() => { return; });
    if (send && threadMode === "enabled") {
      await send.startThread({ name: `التعليقات` }).then(async (thread) => {
        thread.send(`** - هذا المكان مخصص لمشاركة رايك حول هذا الاقتراح : \`${message.content}\` **`);
      });
    }
    if (line) await message.channel.send({ files: [line] }).catch(() => {});
    await keyValueService.set('suggestionsDB', `${send.id}_ok`, 0);
    await keyValueService.set('suggestionsDB', `${send.id}_no`, 0);
    return message.delete();
  } else if (suggestionMode === "reactions") {
    let send = await message.channel.send({ embeds: [embed] }).catch(() => { return; });
    await send.react("✔️");
    await send.react("❌");
    if (threadMode === "enabled") {
      await send.startThread({ name: `التعليقات` }).then(async (thread) => {
        thread.send(`** - هذا المكان مخصص لمشاركة رايك حول هذا الاقتراح : \`${message.content}\` **`);
      });
    }
    if (line) await message.channel.send({ files: [line] }).catch(() => {});
    return message.delete();
  }
});

// ── Feedback system ──
client27.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  const line = await keyValueService.get('feedbackDB', `line_${message.guild.id}`);
  const chan = await keyValueService.get('feedbackDB', `feedback_room_${message.guild.id}`);
  if (!chan || message.channel.id !== chan) return;
  const feedbackMode = await keyValueService.get('feedbackDB', `feedback_mode_${message.guild.id}`) || "embed";
  const feedbackEmoji = await keyValueService.get('feedbackDB', `feedback_emoji_${message.guild.id}`) || "❤";

  const embed = new EmbedBuilder()
    .setColor("Random")
    .setTimestamp()
    .setTitle(`** > ${message.content} **`)
    .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
    .setAuthor({ name: message.author.username, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
    .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL({ dynamic: true }) });

  if (feedbackMode === "embed") {
    await message.delete();
    const themsg = await message.channel.send({ content: `**<@${message.author.id}> شكرا لمشاركتنا رأيك :tulip:**`, embeds: [embed] });
    await themsg.react("❤");
    await themsg.react("❤️‍🔥");
    if (line) await message.channel.send({ files: [line] });
  } else if (feedbackMode === "reactions") {
    await message.react(feedbackEmoji);
    if (line) await message.channel.send({ files: [line] });
  }
});

// ── Protection: Anti-bots ──
client27.on("guildMemberAdd", async (member) => {
  if (await keyValueService.has('protectDB', `antibots_status_${member.guild.id}`)) {
    let antibotsstatus = await keyValueService.get('protectDB', `antibots_status_${member.guild.id}`);
    if (antibotsstatus == "on" && member.user.bot) {
      try {
        const logRoom = await keyValueService.get('protectDB', `protectLog_room_${member.guild.id}`);
        if (logRoom) {
          const theLogRoom = await member.guild.channels.cache.find((ch) => ch.id == logRoom);
          theLogRoom.send({
            embeds: [
              new EmbedBuilder()
                .setTitle("نظام الحماية")
                .addFields(
                  { name: `العضو :`, value: `${member.user.username} \`${member.id}\`` },
                  { name: `السبب :`, value: `نظام الحماية من البوتات` },
                  { name: `العقاب :`, value: `طرد البوت` }
                ),
            ],
          });
        }
        member.kick();
      } catch (err) {
        console.log("خطأ", err);
      }
    }
  }
});

// ── Protection: Anti-delete rooms ──
client27.on("ready", async () => {
  const guild = client27.guilds.cache.first();
  if (!guild) return;
  const guildid = guild.id;
  let status = await keyValueService.get('protectDB', `antideleterooms_status_${guildid}`);
  if (!status || status == "off") return;
  setInterval(async () => {
    const users = await keyValueService.get('protectDB', `roomsdelete_users_${guildid}`);
    if (!Array.isArray(users) || users.length === 0) return;
    users.forEach(async (user) => {
      const { userid, limit, newReset } = user;
      const currentTime = moment().format("YYYY-MM-DD");
      if (moment(currentTime).isSame(newReset) || moment(currentTime).isAfter(newReset)) {
        const newResetDate = moment().add(1, "day").format("YYYY-MM-DD");
        let executordb = { userid: userid, limit: 0, newReset: newResetDate };
        const index = users.findIndex((u) => u.userid === userid);
        users[index] = executordb;
        await keyValueService.set('protectDB', `roomsdelete_users_${guildid}`, users);
      }
      let limitrooms = await keyValueService.get('protectDB', `antideleterooms_limit_${guildid}`);
      if (limit > limitrooms) {
        let member = guild.members.cache.find((m) => m.id == userid);
        try {
          member.kick();
        } catch {}
      }
    });
  }, 6 * 1000);
});

client27.on("channelDelete", async (channel) => {
  let guildid = channel.guild.id;
  let status = await keyValueService.get('protectDB', `antideleterooms_status_${guildid}`);
  if (!status || status == "off") return;
  const fetchedLogs = await channel.guild.fetchAuditLogs({
    limit: 1,
    type: AuditLogEvent.ChannelDelete,
  });
  const channelDeleteLog = fetchedLogs.entries.first();
  if (!channelDeleteLog) return;
  const { executor } = channelDeleteLog;
  const users = await keyValueService.get('protectDB', `roomsdelete_users_${guildid}`) || [];
  const endTime = moment().add(1, "day").format("YYYY-MM-DD");
  if (users.length <= 0) {
    await keyValueService.push('protectDB', `roomsdelete_users_${guildid}`, { userid: executor.id, limit: 1, newReset: endTime });
    return;
  }
  let executordb = users.find((user) => user.userid == executor.id);
  if (!executordb) {
    await keyValueService.push('protectDB', `roomsdelete_users_${guildid}`, { userid: executor.id, limit: 1, newReset: endTime });
    return;
  }
  let newexecutorlimit = executordb.limit + 1;
  executordb = { userid: executor.id, limit: newexecutorlimit, newReset: endTime };
  const index = users.findIndex((user) => user.userid === executor.id);
  users[index] = executordb;
  let deletelimit = await keyValueService.get('protectDB', `antideleterooms_limit_${guildid}`);
  if (newexecutorlimit > deletelimit) {
    let guild = client27.guilds.cache.find((gu) => gu.id == guildid);
    let member = guild.members.cache.find((ex) => ex.id == executor.id);
    try {
      const logRoom = await keyValueService.get('protectDB', `protectLog_room_${member.guild.id}`);
      if (logRoom) {
        const theLogRoom = await member.guild.channels.cache.find((ch) => ch.id == logRoom);
        theLogRoom.send({
          embeds: [
            new EmbedBuilder().setTitle("نظام الحماية").addFields(
              { name: `العضو :`, value: `${member.user.username} \`${member.id}\`` },
              { name: `السبب :`, value: `حذف رومات` },
              { name: `العقاب :`, value: `طرد العضو` }
            ),
          ],
        });
      }
      member.kick();
    } catch {}
    let filtered = users.filter((a) => a.userid != executor.id);
    await keyValueService.set('protectDB', `roomsdelete_users_${guildid}`, filtered);
  } else {
    await keyValueService.set('protectDB', `roomsdelete_users_${guildid}`, users);
  }
});

// ── Protection: Anti-delete roles (fix AuditLogEvent) ──
client27.on("ready", async () => {
  const guild = client27.guilds.cache.first();
  if (!guild) return;
  const guildid = guild.id;
  let status = await keyValueService.get('protectDB', `antideleteroles_status_${guildid}`);
  if (!status || status == "off") return;
  setInterval(async () => {
    const users = await keyValueService.get('protectDB', `rolesdelete_users_${guildid}`);
    if (!Array.isArray(users) || users.length === 0) return;
    users.forEach(async (user) => {
      const { userid, limit, newReset } = user;
      const currentTime = moment().format("YYYY-MM-DD");
      if (moment(currentTime).isSame(newReset) || moment(currentTime).isAfter(newReset)) {
        const newResetDate = moment().add(1, "day").format("YYYY-MM-DD");
        let executordb = { userid: userid, limit: 0, newReset: newResetDate };
        const index = users.findIndex((u) => u.userid === userid);
        users[index] = executordb;
        await keyValueService.set('protectDB', `rolesdelete_users_${guildid}`, users);
      }
      let limitrooms = await keyValueService.get('protectDB', `antideleteroles_limit_${guildid}`);
      if (limit > limitrooms) {
        let member = guild.members.cache.find((m) => m.id == userid);
        try {
          member.kick();
        } catch {}
      }
    });
  }, 6 * 1000);
});

client27.on("roleDelete", async (role) => {
  let guildid = role.guild.id;
  let status = await keyValueService.get('protectDB', `antideleteroles_status_${guildid}`);
  if (!status || status == "off") return;
  const fetchedLogs = await role.guild.fetchAuditLogs({
    limit: 1,
    type: AuditLogEvent.RoleDelete, // fixed
  });
  const roleDeleteLog = fetchedLogs.entries.first();
  if (!roleDeleteLog) return;
  const { executor } = roleDeleteLog;
  const users = await keyValueService.get('protectDB', `rolesdelete_users_${guildid}`) || [];
  const endTime = moment().add(1, "day").format("YYYY-MM-DD");
  if (users.length <= 0) {
    await keyValueService.push('protectDB', `rolesdelete_users_${guildid}`, { userid: executor.id, limit: 1, newReset: endTime });
    return;
  }
  let executordb = users.find((user) => user.userid == executor.id);
  if (!executordb) {
    await keyValueService.push('protectDB', `rolesdelete_users_${guildid}`, { userid: executor.id, limit: 1, newReset: endTime });
    return;
  }
  let newexecutorlimit = executordb.limit + 1;
  executordb = { userid: executor.id, limit: newexecutorlimit, newReset: endTime };
  const index = users.findIndex((user) => user.userid === executor.id);
  users[index] = executordb;
  let deletelimit = await keyValueService.get('protectDB', `antideleteroles_limit_${guildid}`);
  if (newexecutorlimit > deletelimit) {
    let guild = client27.guilds.cache.find((gu) => gu.id == guildid);
    let member = guild.members.cache.find((ex) => ex.id == executor.id);
    try {
      const logRoom = await keyValueService.get('protectDB', `protectLog_room_${member.guild.id}`);
      if (logRoom) {
        const theLogRoom = await member.guild.channels.cache.find((ch) => ch.id == logRoom);
        theLogRoom.send({
          embeds: [
            new EmbedBuilder().setTitle("نظام الحماية").addFields(
              { name: `العضو :`, value: `${member.user.username} \`${member.id}\`` },
              { name: `السبب :`, value: `حذف رتب` },
              { name: `العقاب :`, value: `طرد العضو` }
            ),
          ],
        });
      }
      member.kick();
    } catch {}
    let filtered = users.filter((a) => a.userid != executor.id);
    await keyValueService.set('protectDB', `rolesdelete_users_${guildid}`, filtered);
  } else {
    await keyValueService.set('protectDB', `rolesdelete_users_${guildid}`, users);
  }
});

// ── Protection: Anti-ban (fix ban event) ──
client27.on("ready", async () => {
  const guild = client27.guilds.cache.first();
  if (!guild) return;
  const guildid = guild.id;
  let status = await keyValueService.get('protectDB', `ban_status_${guildid}`);
  if (!status || status == "off") return;
  setInterval(async () => {
    const users = await keyValueService.get('protectDB', `ban_users_${guildid}`);
    if (!Array.isArray(users) || users.length === 0) return;
    users.forEach(async (user) => {
      const { userid, limit, newReset } = user;
      const currentTime = moment().format("YYYY-MM-DD");
      if (moment(currentTime).isSame(newReset) || moment(currentTime).isAfter(newReset)) {
        const newResetDate = moment().add(1, "day").format("YYYY-MM-DD");
        let executordb = { userid: userid, limit: 0, newReset: newResetDate };
        const index = users.findIndex((u) => u.userid === userid);
        users[index] = executordb;
        await keyValueService.set('protectDB', `ban_users_${guildid}`, users);
      }
      let limitrooms = await keyValueService.get('protectDB', `ban_limit_${guildid}`);
      if (limit > limitrooms) {
        let member = guild.members.cache.find((m) => m.id == userid);
        try {
          member.kick();
        } catch {}
      }
    });
  }, 6 * 1000);
});

client27.on("guildBanAdd", async (ban) => {
  const { guild, user } = ban;
  let guildid = guild.id;
  let status = await keyValueService.get('protectDB', `ban_status_${guildid}`);
  if (!status || status == "off") return;
  const fetchedLogs = await guild.fetchAuditLogs({
    limit: 1,
    type: AuditLogEvent.MemberBanAdd,
  });
  const banLog = fetchedLogs.entries.first();
  if (!banLog) return;
  const { executor } = banLog;
  const users = await keyValueService.get('protectDB', `ban_users_${guildid}`) || [];
  const endTime = moment().add(1, "day").format("YYYY-MM-DD");
  if (users.length <= 0) {
    await keyValueService.push('protectDB', `ban_users_${guildid}`, { userid: executor.id, limit: 1, newReset: endTime });
    return;
  }
  let executordb = users.find((u) => u.userid == executor.id);
  if (!executordb) {
    await keyValueService.push('protectDB', `ban_users_${guildid}`, { userid: executor.id, limit: 1, newReset: endTime });
    return;
  }
  let newexecutorlimit = executordb.limit + 1;
  executordb = { userid: executor.id, limit: newexecutorlimit, newReset: endTime };
  const index = users.findIndex((u) => u.userid === executor.id);
  users[index] = executordb;
  let deletelimit = await keyValueService.get('protectDB', `ban_limit_${guildid}`);
  if (newexecutorlimit > deletelimit) {
    let guildObj = client27.guilds.cache.find((gu) => gu.id == guildid);
    let member = guildObj.members.cache.find((ex) => ex.id == executor.id);
    try {
      const logRoom = await keyValueService.get('protectDB', `protectLog_room_${member.guild.id}`);
      if (logRoom) {
        const theLogRoom = await member.guild.channels.cache.find((ch) => ch.id == logRoom);
        theLogRoom.send({
          embeds: [
            new EmbedBuilder().setTitle("نظام الحماية").addFields(
              { name: `العضو :`, value: `${member.user.username} \`${member.id}\`` },
              { name: `السبب :`, value: `حظر اعضاء` },
              { name: `العقاب :`, value: `طرد العضو` }
            ),
          ],
        });
      }
      member.kick();
    } catch {}
    let filtered = users.filter((a) => a.userid != executor.id);
    await keyValueService.set('protectDB', `ban_users_${guildid}`, filtered);
  } else {
    await keyValueService.set('protectDB', `ban_users_${guildid}`, users);
  }
});

client27.on("guildMemberRemove", async (member) => {
  let guildid = member.guild.id;
  let status = await keyValueService.get('protectDB', `ban_status_${guildid}`);
  if (!status || status == "off") return;
  if (member.id === client27.user.id) return;
  const fetchedLogs = await member.guild.fetchAuditLogs({
    limit: 1,
    type: AuditLogEvent.MemberKick,
  });
  const kickLog = fetchedLogs.entries.first();
  if (!kickLog) return; // not a kick
  const { executor } = kickLog;
  const users = await keyValueService.get('protectDB', `ban_users_${guildid}`) || [];
  const endTime = moment().add(1, "day").format("YYYY-MM-DD");
  if (users.length <= 0) {
    await keyValueService.push('protectDB', `ban_users_${guildid}`, { userid: executor.id, limit: 1, newReset: endTime });
    return;
  }
  let executordb = users.find((u) => u.userid == executor.id);
  if (!executordb) {
    await keyValueService.push('protectDB', `ban_users_${guildid}`, { userid: executor.id, limit: 1, newReset: endTime });
    return;
  }
  let newexecutorlimit = executordb.limit + 1;
  executordb = { userid: executor.id, limit: newexecutorlimit, newReset: endTime };
  const index = users.findIndex((u) => u.userid === executor.id);
  users[index] = executordb;
  let deletelimit = await keyValueService.get('protectDB', `ban_limit_${guildid}`);
  if (newexecutorlimit > deletelimit) {
    let guildObj = client27.guilds.cache.find((gu) => gu.id == guildid);
    let memberToKick = guildObj.members.cache.find((ex) => ex.id == executor.id);
    try {
      const logRoom = await keyValueService.get('protectDB', `protectLog_room_${memberToKick.guild.id}`);
      if (logRoom) {
        const theLogRoom = await memberToKick.guild.channels.cache.find((ch) => ch.id == logRoom);
        theLogRoom.send({
          embeds: [
            new EmbedBuilder().setTitle("نظام الحماية").addFields(
              { name: `العضو :`, value: `${memberToKick.user.username} \`${memberToKick.id}\`` },
              { name: `السبب :`, value: `طرد اعضاء` },
              { name: `العقاب :`, value: `طرد العضو` }
            ),
          ],
        });
      }
      memberToKick.kick();
    } catch {}
    let filtered = users.filter((a) => a.userid != executor.id);
    await keyValueService.set('protectDB', `ban_users_${guildid}`, filtered);
  } else {
    await keyValueService.set('protectDB', `ban_users_${guildid}`, users);
  }
});

// ── Logs events ──
client27.on("messageDelete", async (message) => {
  if (!message || !message.author || message.author.bot) return;
  if (!await keyValueService.has('logsDB', `log_messagedelete_${message.guild.id}`)) return;
  let deletelog1 = await keyValueService.get('logsDB', `log_messagedelete_${message.guild.id}`);
  let deletelog2 = message.guild.channels.cache.get(deletelog1);
  const fetchedLogs = await message.guild.fetchAuditLogs({
    limit: 1,
    type: AuditLogEvent.MessageDelete,
  });
  const deletionLog = fetchedLogs.entries.first();
  if (!deletionLog) return;
  const { executor } = deletionLog;
  let deleteembed = new EmbedBuilder()
    .setTitle(`**تم حذف رسالة**`)
    .addFields(
      { name: `**صاحب الرسالة : **`, value: `**\`\`\`${message.author.tag} - (${message.author.id})\`\`\`**`, inline: false },
      { name: `**حاذف الرسالة : **`, value: `**\`\`\`${executor.username} - (${executor.id})\`\`\`**`, inline: false },
      { name: `**محتوى الرسالة : **`, value: `**\`\`\`${message.content}\`\`\`**`, inline: false },
      { name: `**الروم الذي تم الحذف فيه : **`, value: `${message.channel}`, inline: false }
    )
    .setTimestamp();
  await deletelog2.send({ embeds: [deleteembed] });
});

client27.on("messageUpdate", async (oldMessage, newMessage) => {
  if (!oldMessage.author || oldMessage.author.bot) return;
  if (!await keyValueService.has('logsDB', `log_messageupdate_${oldMessage.guild.id}`)) return;
  const fetchedLogs = await oldMessage.guild.fetchAuditLogs({
    limit: 1,
    type: AuditLogEvent.MessageUpdate,
  });
  let updateLog1 = await keyValueService.get('logsDB', `log_messageupdate_${oldMessage.guild.id}`);
  let updateLog2 = oldMessage.guild.channels.cache.get(updateLog1);
  const updateLog = fetchedLogs.entries.first();
  if (!updateLog) return;
  const { executor } = updateLog;
  let updateEmbed = new EmbedBuilder()
    .setTitle(`**تم تعديل رسالة**`)
    .addFields(
      { name: "**صاحب الرسالة:**", value: `**\`\`\`${oldMessage.author.tag} (${oldMessage.author.id})\`\`\`**`, inline: false },
      { name: "**المحتوى القديم:**", value: `**\`\`\`${oldMessage.content}\`\`\`**`, inline: false },
      { name: "**المحتوى الجديد:**", value: `**\`\`\`${newMessage.content}\`\`\`**`, inline: false },
      { name: "**الروم الذي تم التحديث فيه:**", value: `${oldMessage.channel}`, inline: false }
    )
    .setTimestamp();
  await updateLog2.send({ embeds: [updateEmbed] });
});

client27.on("roleCreate", async (role) => {
  if (!await keyValueService.has('logsDB', `log_rolecreate_${role.guild.id}`)) return;
  let roleCreateLog1 = await keyValueService.get('logsDB', `log_rolecreate_${role.guild.id}`);
  let roleCreateLog2 = role.guild.channels.cache.get(roleCreateLog1);
  const fetchedLogs = await role.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.RoleCreate });
  const roleCreateLog = fetchedLogs.entries.first();
  if (!roleCreateLog) return;
  const { executor } = roleCreateLog;
  let roleCreateEmbed = new EmbedBuilder()
    .setTitle("**تم انشاء رتبة**")
    .addFields(
      { name: "اسم الرتبة :", value: `\`\`\`${role.name}\`\`\``, inline: true },
      { name: "الذي قام بانشاء الرتبة :", value: `\`\`\`${executor.username} (${executor.id})\`\`\``, inline: true }
    )
    .setTimestamp();
  await roleCreateLog2.send({ embeds: [roleCreateEmbed] });
});

client27.on("roleDelete", async (role) => {
  if (!await keyValueService.has('logsDB', `log_roledelete_${role.guild.id}`)) return;
  let roleDeleteLog1 = await keyValueService.get('logsDB', `log_roledelete_${role.guild.id}`);
  let roleDeleteLog2 = role.guild.channels.cache.get(roleDeleteLog1);
  const fetchedLogs = await role.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.RoleDelete });
  const roleDeleteLog = fetchedLogs.entries.first();
  if (!roleDeleteLog) return;
  const { executor } = roleDeleteLog;
  let roleDeleteEmbed = new EmbedBuilder()
    .setTitle("**تم حذف رتبة**")
    .addFields(
      { name: "اسم الرتبة :", value: `\`\`\`${role.name}\`\`\``, inline: true },
      { name: "الذي قام بحذف الرتبة :", value: `\`\`\`${executor.username} (${executor.id})\`\`\``, inline: true }
    )
    .setTimestamp();
  await roleDeleteLog2.send({ embeds: [roleDeleteEmbed] });
});

client27.on("channelCreate", async (channel) => {
  if (!await keyValueService.has('logsDB', `log_channelcreate_${channel.guild.id}`)) return;
  let channelCreateLog1 = await keyValueService.get('logsDB', `log_channelcreate_${channel.guild.id}`);
  let channelCreateLog2 = channel.guild.channels.cache.get(channelCreateLog1);
  const fetchedLogs = await channel.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.ChannelCreate });
  const channelCreateLog = fetchedLogs.entries.first();
  if (!channelCreateLog) return;
  const { executor } = channelCreateLog;
  let channelCategory = channel.parent ? channel.parent.name : "None";
  let channelCreateEmbed = new EmbedBuilder()
    .setTitle("**تم انشاء روم**")
    .addFields(
      { name: "اسم الروم : ", value: `\`\`\`${channel.name}\`\`\``, inline: true },
      { name: "كاتيجوري الروم : ", value: `\`\`\`${channelCategory}\`\`\``, inline: true },
      { name: "الذي قام بانشاء الروم : ", value: `\`\`\`${executor.username} (${executor.id})\`\`\``, inline: true }
    )
    .setTimestamp();
  await channelCreateLog2.send({ embeds: [channelCreateEmbed] });
});

client27.on("channelDelete", async (channel) => {
  if (!await keyValueService.has('logsDB', `log_channeldelete_${channel.guild.id}`)) return;
  let channelDeleteLog1 = await keyValueService.get('logsDB', `log_channeldelete_${channel.guild.id}`);
  let channelDeleteLog2 = channel.guild.channels.cache.get(channelDeleteLog1);
  const fetchedLogs = await channel.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.ChannelDelete });
  const channelDeleteLog = fetchedLogs.entries.first();
  if (!channelDeleteLog) return;
  const { executor } = channelDeleteLog;
  let channelDeleteEmbed = new EmbedBuilder()
    .setTitle("**تم حذف روم**")
    .addFields(
      { name: "اسم الروم : ", value: `\`\`\`${channel.name}\`\`\``, inline: true },
      { name: "الذي قام بحذف الروم : ", value: `\`\`\`${executor.username} (${executor.id})\`\`\``, inline: true }
    )
    .setTimestamp();
  await channelDeleteLog2.send({ embeds: [channelDeleteEmbed] });
});

client27.on("guildMemberUpdate", async (oldMember, newMember) => {
  const guild = oldMember.guild;
  const addedRoles = newMember.roles.cache.filter((role) => !oldMember.roles.cache.has(role.id));
  const removedRoles = oldMember.roles.cache.filter((role) => !newMember.roles.cache.has(role.id));

  if (addedRoles.size > 0 && await keyValueService.has('logsDB', `log_rolegive_${guild.id}`)) {
    let roleGiveLog1 = await keyValueService.get('logsDB', `log_rolegive_${guild.id}`);
    let roleGiveLog2 = guild.channels.cache.get(roleGiveLog1);
    const fetchedLogs = await guild.fetchAuditLogs({ limit: addedRoles.size, type: AuditLogEvent.MemberRoleUpdate });
    addedRoles.forEach((role) => {
      const roleGiveLog = fetchedLogs.entries.find(
        (log) => log.target.id === newMember.id && log.changes[0].new[0].id === role.id
      );
      const roleGiver = roleGiveLog ? roleGiveLog.executor : null;
      const roleGiverUsername = roleGiver ? `${roleGiver.username} (${roleGiver.id})` : `غير معروف`;
      let roleGiveEmbed = new EmbedBuilder()
        .setTitle("**تم إعطاء رتبة لعضو**")
        .addFields(
          { name: "اسم الرتبة:", value: `\`\`\`${role.name}\`\`\``, inline: true },
          { name: "تم إعطاءها بواسطة:", value: `\`\`\`${roleGiverUsername}\`\`\``, inline: true },
          { name: "تم إعطائها للعضو:", value: `\`\`\`${newMember.user.username} (${newMember.user.id})\`\`\``, inline: true }
        )
        .setTimestamp();
      roleGiveLog2.send({ embeds: [roleGiveEmbed] });
    });
  }

  if (removedRoles.size > 0 && await keyValueService.has('logsDB', `log_roleremove_${guild.id}`)) {
    let roleRemoveLog1 = await keyValueService.get('logsDB', `log_roleremove_${guild.id}`);
    let roleRemoveLog2 = guild.channels.cache.get(roleRemoveLog1);
    const fetchedLogs = await guild.fetchAuditLogs({ limit: removedRoles.size, type: AuditLogEvent.MemberRoleUpdate });
    removedRoles.forEach((role) => {
      const roleRemoveLog = fetchedLogs.entries.find(
        (log) => log.target.id === newMember.id && log.changes[0].new[0].id === role.id
      );
      const roleRemover = roleRemoveLog ? roleRemoveLog.executor : null;
      const roleRemoverUsername = roleRemover ? `${roleRemover.username} (${roleRemover.id})` : `غير معروف`;
      let roleRemoveEmbed = new EmbedBuilder()
        .setTitle("**تم إزالة رتبة من عضو**")
        .addFields(
          { name: "اسم الرتبة:", value: `\`\`\`${role.name}\`\`\``, inline: true },
          { name: "تم إزالتها بواسطة:", value: `\`\`\`${roleRemoverUsername}\`\`\``, inline: true },
          { name: "تم إزالتها من العضو:", value: `\`\`\`${newMember.user.username} (${newMember.user.id})\`\`\``, inline: true }
        )
        .setTimestamp();
      roleRemoveLog2.send({ embeds: [roleRemoveEmbed] });
    });
  }
});

client27.on("guildMemberAdd", async (member) => {
  const guild = member.guild;
  if (!member.bot) return;
  const fetchedLogs = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.BotAdd });
  const botAddLog = fetchedLogs.entries.first();
  if (!botAddLog) return;
  const { executor } = botAddLog;
  if (member.user.bot) {
    let botAddLog1 = await keyValueService.get('logsDB', `log_botadd_${guild.id}`);
    if (!botAddLog1) return;
    let botAddLog2 = guild.channels.cache.get(botAddLog1);
    let botAddEmbed = new EmbedBuilder()
      .setTitle("**تم اضافة بوت جديد الى السيرفر**")
      .addFields(
        { name: "اسم البوت :", value: `\`\`\`${member.user.username}\`\`\``, inline: true },
        { name: "ايدي البوت :", value: `\`\`\`${member.user.id}\`\`\``, inline: true },
        { name: "هل لديه صلاحية الإدارة؟", value: member.permissions.has("Administrator") ? `\`\`\`نعم لديه\`\`\`` : `\`\`\`لا ليس لديه\`\`\``, inline: true },
        { name: "تم اضافته بواسطة :", value: `\`\`\`${executor.username} (${executor.id})\`\`\``, inline: false }
      )
      .setTimestamp();
    botAddLog2.send({ embeds: [botAddEmbed] });
  }
});

client27.on("guildBanAdd", async (ban) => {
  const { guild, user } = ban;
  if (!await keyValueService.has('logsDB', `log_banadd_${guild.id}`)) return;
  let banAddLog1 = await keyValueService.get('logsDB', `log_banadd_${guild.id}`);
  let banAddLog2 = guild.channels.cache.get(banAddLog1);
  const fetchedLogs = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberBanAdd });
  const banAddLog = fetchedLogs.entries.first();
  const banner = banAddLog ? banAddLog.executor : null;
  const bannerUsername = banner ? `\`\`\`${banner.username} (${banner.id})\`\`\`` : `\`\`\`غير معروف\`\`\``;
  let banAddEmbed = new EmbedBuilder()
    .setTitle("**تم حظر عضو**")
    .addFields(
      { name: "العضو المحظور:", value: `\`\`\`${user.tag} (${user.id})\`\`\`` },
      { name: "تم حظره بواسطة:", value: bannerUsername }
    )
    .setTimestamp();
  banAddLog2.send({ embeds: [banAddEmbed] });
});

client27.on("guildBanRemove", async (ban) => {
  const { guild, user } = ban;
  if (!await keyValueService.has('logsDB', `log_bandelete_${guild.id}`)) return;
  let banRemoveLog1 = await keyValueService.get('logsDB', `log_bandelete_${guild.id}`);
  let banRemoveLog2 = guild.channels.cache.get(banRemoveLog1);
  const fetchedLogs = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberBanRemove });
  const banRemoveLog = fetchedLogs.entries.first();
  const unbanner = banRemoveLog ? banRemoveLog.executor : null;
  const unbannerUsername = unbanner ? `\`\`\`${unbanner.username} (${unbanner.id})\`\`\`` : `\`\`\`غير معروف\`\`\``;
  let banRemoveEmbed = new EmbedBuilder()
    .setTitle("**تم إزالة حظر عضو**")
    .addFields(
      { name: "العضو المفكّر الحظر عنه:", value: `\`\`\`${user.tag} (${user.id})\`\`\`` },
      { name: "تم إزالة الحظر بواسطة:", value: unbannerUsername }
    )
    .setTimestamp();
  banRemoveLog2.send({ embeds: [banRemoveEmbed] });
});

client27.on("guildMemberRemove", async (member) => {
  const guild = member.guild;
  if (!await keyValueService.has('logsDB', `log_kickadd_${guild.id}`)) return;
  const kickLogChannelId = await keyValueService.get('logsDB', `log_kickadd_${guild.id}`);
  const kickLogChannel = guild.channels.cache.get(kickLogChannelId);
  const fetchedLogs = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberKick });
  const kickLog = fetchedLogs.entries.first();
  if (!kickLog) return;
  const kicker = kickLog.executor;
  const kickerUsername = kicker ? `\`\`\`${kicker.username} (${kicker.id})\`\`\`` : "غير معروف";
  const kickEmbed = new EmbedBuilder()
    .setTitle("**تم طرد عضو**")
    .addFields(
      { name: "العضو المطرود:", value: `\`\`\`${member.user.tag} (${member.user.id})\`\`\`` },
      { name: "تم طرده بواسطة:", value: kickerUsername }
    )
    .setTimestamp();
  kickLogChannel.send({ embeds: [kickEmbed] });
});

// ── Welcome & invite tracker ──
let invites = {};
const getInviteCounts = async (guild) => {
  return new Map(guild.invites.cache.map((invite) => [invite.code, invite.uses]));
};

client27.on("inviteCreate", async (invite) => {
  if (!invites[invite.guild.id]) invites[invite.guild.id] = new Map();
  invites[invite.guild.id].set(invite.code, invite.uses);
});

client27.on("inviteDelete", async (invite) => {
  if (invites[invite.guild.id]) invites[invite.guild.id].delete(invite.code);
});

client27.on("guildMemberAdd", async (member) => {
  try {
    const welcomeConfig = await getWelcomeConfig(member.guild.id);
    if (!welcomeConfig.enabled || !welcomeConfig.channelId) return;
    const welcomeRoleId = welcomeConfig.roleId;

    if (welcomeRoleId) {
      const role = member.guild.roles.cache.get(welcomeRoleId);
      if (role) await member.roles.add(role);
    }

    const newInvites = await member.guild.invites.fetch();
    const oldInvites = invites[member.guild.id] || new Map();
    const usedInvite = newInvites.find((inv) => {
      const prevUses = oldInvites.get(inv.code) || 0;
      return inv.uses > prevUses;
    });

    const inviteData = usedInvite ? {
      code: usedInvite.code,
      uses: usedInvite.uses,
      inviter: usedInvite.inviter,
    } : {};

    const welcomeChannel = member.guild.channels.cache.get(welcomeConfig.channelId);
    if (welcomeChannel) await welcomeChannel.send(buildWelcomePayload(welcomeConfig, member, inviteData));

    if (welcomeConfig.dmEnabled && welcomeConfig.dmMessage) {
      await member.send({ content: applyVariables(welcomeConfig.dmMessage, member, inviteData) }).catch(() => null);
    }

    invites[member.guild.id] = new Map(newInvites.map((invite) => [invite.code, invite.uses]));
  } catch (error) {
    console.error("Error handling guildMemberAdd event:", error);
  }
});

// ── Nadeko system ──
client27.on("guildMemberAdd", async (member) => {
  const theeGuild = member.guild;
  let rooms = await keyValueService.get('nadekoDB', `rooms_${theeGuild.id}`);
  const message = await keyValueService.get('nadekoDB', `message_${theeGuild.id}`);
  if (!rooms || rooms.length <= 0 || !message) return;
  rooms.forEach(async (room) => {
    const theRoom = await theeGuild.channels.cache.find((ch) => ch.id == room);
    if (!theRoom) return;
    await theRoom.send({ content: `${member} - ${message}` }).then(async (msg) => {
      setTimeout(() => {
        msg.delete();
      }, 3000);
    });
  });
});

// ── Auto reactions ──
client27.on("messageCreate", async (message) => {
  await handleAutoReactions(message).catch(console.error);
});

// ── Auto reply ──
client27.on("messageCreate", async (message) => {
  const handledShortcut = await handleShortcutMessage(message).catch(console.error);
  if (handledShortcut) return;
  await handleAutoReplyMessage(message).catch(console.error);
});

// ── Help interaction (buttons) ──
client27.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;
  await handleDynamicHelpInteraction(interaction).catch(console.error);
});

// Error handling
process.on("uncaughtException", (err) => {
  console.log(err);
});
process.on("unhandledRejection", (reason, promise) => {
  console.log(reason);
});
process.on("uncaughtExceptionMonitor", (reason) => {
  console.log(reason);
});

// Login
  await client27.login(token);
  return client27;
}

const uniqueTokens = [...new Set(botTokens.filter(Boolean))];
if (uniqueTokens.length === 0) {
  console.error("[Config] لا يوجد أي توكن بوت. ضع DISCORD_TOKEN أو DISCORD_TOKENS أو botTokens في config.js");
  process.exit(1);
}

Promise.all(uniqueTokens.map((botToken, index) => startSystemBot(botToken, index + 1))).catch((error) => {
  console.error("[Bots] فشل تشغيل أحد البوتات:", error);
});
