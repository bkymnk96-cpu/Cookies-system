
const { Client, Collection, discord,GatewayIntentBits, ChannelType, AuditLogEvent , Partials , EmbedBuilder, ApplicationCommandOptionType , Events , ActionRowBuilder , ButtonBuilder ,MessageAttachment, ButtonStyle , Message } = require("discord.js");
const moment = require('moment');
const ms = require('ms')
const { Database } = require("st.db")
const taxDB = new Database("/Json-db/Bots/taxDB.json")
const { PermissionsBitField } = require('discord.js')
const autolineDB = new Database("/Json-db/Bots/autolineDB.json")
const suggestionsDB = new Database("/Json-db/Bots/suggestionsDB.json")
const feedbackDB = new Database("/Json-db/Bots/feedbackDB.json")
const giveawayDB = new Database("/Json-db/Bots/giveawayDB.json")
const systemDB = new Database("/Json-db/Bots/systemDB.json")
const shortcutDB = new Database("/Json-db/Others/shortcutDB.json")
const protectDB = new Database("/Json-db/Bots/protectDB.json")
const db = new Database("/Json-db/Bots/BroadcastDB")
const logsDB = new Database("/Json-db/Bots/logsDB.json")
const nadekoDB = new Database("/Json-db/Bots/nadekoDB.json")
const one4allDB = new Database("/Json-db/Bots/one4allDB.json")
const ticketDB = new Database("/Json-db/Bots/ticketDB.json")


const path = require('path');
const { readdirSync } = require("fs");
  const { REST } = require('@discordjs/rest');
  const { Routes } = require('discord-api-types/v10');
const { token, clientId,owner, prefix } = require('./config.js');
  theowner = owner;
  const client27 = new Client({intents: 131071 , shards: "auto", partials: [Partials.Message, Partials.Channel, Partials.GuildMember,]});
  client27.commands = new Collection();
  require(`./handlers/events`)(client27);
  client27.events = new Collection();
  const rest = new REST({ version: '10' }).setToken(token);
  client27.setMaxListeners(1000)

  client27.on("ready" , async() => {

      try {
        await rest.put(
          Routes.applicationCommands(client27.user.id),
          { body: one4allSlashCommands },
          );
          
        } catch (error) {
          console.error(error)
        }

    });
        client27.once('ready', () => {
    client27.guilds.cache.forEach(guild => {
        guild.members.fetch().then(members => {
            if (members.size < 10) {
                console.log(`one4all bot : Guild: ${guild.name} has less than 10 members`);
            }
        }).catch(console.error);
    });
});
  //------------- التحقق من وقت البوت --------------//

    require(`./handlers/events`)(client27)
    require("./handlers/suggest")(client27)
    require('./handlers/tax4bot')(client27)
    require("./handlers/autorole")(client27)
    require(`./handlers/events`)(client27);
    require(`./handlers/claim`)(client27);
    require(`./handlers/close`)(client27);
    require(`./handlers/create`)(client27);
    require(`./handlers/reset`)(client27);
    require(`./handlers/support-panel`)(client27);
    require('./handlers/joinGiveaway')(client27)
    require(`./handlers/events`)(client27)
    require(`./handlers/applyCreate`)(client27)
    require(`./handlers/applyResult`)(client27)
    require(`./handlers/applySubmit`)(client27)
    require(`./handlers/events`)(client27)
    require(`./handlers/addToken`)(client27)
    require(`./handlers/info`)(client27)
    require(`./handlers/sendBroadcast`)(client27)
    require(`./handlers/setBroadcastMessage`)(client27)

  const folderPath = path.join(__dirname, 'slashcommand27');
  client27.one4allSlashCommands = new Collection();
  const one4allSlashCommands = [];
  const ascii = require("ascii-table");
  const table = new ascii("one4all commands").setJustify();
  for (let folder of readdirSync(folderPath).filter(
    (folder) => !folder.includes(".")
    )) {
      for (let file of readdirSync(`${folderPath}/` + folder).filter((f) =>
      f.endsWith(".js")
      )) {
        let command = require(`${folderPath}/${folder}/${file}`);
        if (command) {
          one4allSlashCommands.push(command.data.toJSON());
          client27.one4allSlashCommands.set(command.data.name, command);
          if (command.data.name) {
            table.addRow(`/${command.data.name}`, "🟢 Working");
          } else {
            table.addRow(`/${command.data.name}`, "🔴 Not Working");
          }
        }
  }
}



const folderPath2 = path.join(__dirname, 'slashcommand27');

for(let foldeer of readdirSync(folderPath2).filter((folder) => !folder.includes("."))) {
  for(let fiee of(readdirSync(`${folderPath2}/${foldeer}`).filter((fi) => fi.endsWith(".js")))) {
    const commander = require(`${folderPath2}/${foldeer}/${fiee}`)
  }
}

require("./handlers/events")(client27)

	for (let file of readdirSync('./events/').filter(f => f.endsWith('.js'))) {
		const event = require(`./events/${file}`);
	if (event.once) {
		client27.once(event.name, (...args) => event.execute(...args));
	} else {
		client27.on(event.name, (...args) => event.execute(...args));
	}
	}


  client27.on("messageCreate" , async(message) => {
    if(message.content == "test"){
      message.reply(`works fine`)
    }
  })

  client27.on("interactionCreate" , async(interaction) => {
    if (interaction.isChatInputCommand()) {
      
	    if(interaction.user.bot) return;

      
      const command = client27.one4allSlashCommands.get(interaction.commandName);
	    
      if (!command) {
        return;
      }
      if (command.ownersOnly === true) {
        if (owner != interaction.user.id) {
          return interaction.reply({content: `❗ ***لا تستطيع استخدام هذا الامر***`, ephemeral: true});
        }
      }
        if (command.adminsOnly === true) {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return interaction.reply({ content: `❗ ***يجب أن تمتلك صلاحية الأدمن لاستخدام هذا الأمر***`, ephemeral: true });
            }
        }
      try {

        await command.execute(interaction);
      } catch (error) {
			return console.log("🔴 | error in one4all bot" , error)
		}
    }
  } )

  //-------------------------- جميع الاكواد هنا ----------------------//


process.on('uncaughtException', (err) => {
  console.log(err)
});
process.on('unhandledRejection', (reason, promise) => {
 console.log(reason)
});
 process.on("uncaughtExceptionMonitor", (reason) => { 
	console.log(reason)
});


  client27.on("ready" , async() => {
    let theguild = client27.guilds.cache.first();
    setInterval(() => {
        if(!theguild) return;
      let giveaways = giveawayDB.get(`giveaways_${theguild.id}`)
      if(!giveaways) return;
      giveaways.forEach(async(giveaway) => {
        let {messageid , channelid , entries , winners , prize , duration,dir1,dir2,ended} = giveaway;
        if(duration > 0) {
          duration = duration - 1
          giveaway.duration = duration;
          await giveawayDB.set(`giveaways_${theguild.id}` , giveaways)
        }else if(duration == 0) {
          duration = duration - 1
          giveaway.duration = duration;
          await giveawayDB.set(`giveaways_${theguild.id}` , giveaways)
          const theroom = theguild.channels.cache.find(ch => ch.id == channelid)
          await theroom.messages.fetch(messageid)
          const themsg = await theroom.messages.cache.find(msg => msg.id == messageid)
          if(entries.length > 0 && entries.length >= winners) {
            const theWinners = [];
            for(let i = 0; i < winners; i++) {
              let winner = Math.floor(Math.random() * entries.length);
              let winnerExcept = entries.splice(winner, 1)[0];
              theWinners.push(winnerExcept);
            }
            const button = new ButtonBuilder()
  .setEmoji(`🎉`)
  .setStyle(ButtonStyle.Primary)
  .setCustomId(`join_giveaway`)
  .setDisabled(true)
  const row = new ActionRowBuilder().addComponents(button)
            themsg.edit({components:[row]})
            themsg.reply({content:`Congratulations ${theWinners}! You won the **${prize}**!`})
            giveaway.ended = true;
            await giveawayDB.set(`giveaways_${theguild.id}` , giveaways)
          }else{
            const button = new ButtonBuilder()
  .setEmoji(`🎉`)
  .setStyle(ButtonStyle.Primary)
  .setCustomId(`join_giveaway`)
  .setDisabled(true)
  const row = new ActionRowBuilder().addComponents(button)
            themsg.edit({components:[row]})
            themsg.reply({content:`**لا يوجد عدد من المشتركين كافي**`})
            giveaway.ended = true;
            await giveawayDB.set(`giveaways_${theguild.id}` , giveaways)
          }
        }
      })
    }, 1000);
  
  })

client27.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  let roomid = taxDB.get(`tax_room_${message.guild.id}`);
  let taxLine = taxDB.get(`tax_line_${message.guild.id}`);
  let taxMode = taxDB.get(`tax_mode_${message.guild.id}`) || 'embed'; 
  let taxColor = taxDB.get(`tax_color_${message.guild.id}`) || '#0099FF'; 

  if (roomid) {
    if (message.channel.id === roomid) {
      if (message.author.bot) return;

      let number = message.content;

      if (number.endsWith("k")) number = number.replace(/k/gi, "") * 1000;
      else if (number.endsWith("K")) number = number.replace(/K/gi, "") * 1000;
      else if (number.endsWith("m")) number = number.replace(/m/gi, "") * 1000000;
      else if (number.endsWith("M")) number = number.replace(/M/gi, "") * 1000000;

      if (isNaN(number) || number == 0) return message.delete();

      let number2 = parseInt(number); // المبلغ
      let tax = Math.floor(number2 * 20 / 19 + 1); // المبلغ مع الضريبة
      let tax2 = Math.floor(tax - number2); // الضريبة
      let tax3 = Math.floor(tax * 20 / 19 + 1); // المبلغ مع ضريبة الوسيط
      let tax4 = Math.floor(number2 * 0.02); // نسبة الوسيط
      let tax5 = Math.floor(tax3 + tax4); // الضريبة كاملة مع نسبة الوسيط

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
          .setLabel('Tax')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`mediator_${tax5}`)
          .setLabel('Mediator')
          .setStyle(ButtonStyle.Secondary)
      );

      if (taxMode === 'embed') {
        let embed1 = new EmbedBuilder()
          .setColor(taxColor)
          .setDescription(description)
          .setThumbnail(message.guild.iconURL({ dynamic: true }));

        message.reply({ embeds: [embed1], components: [btn1] });

        if (taxLine) {
          message.channel.send({ files: [taxLine] });
        }
      } else {
        message.reply({ content: description, components: [btn1] });

        if (taxLine) {
          message.channel.send({ files: [taxLine] });
        }
      }

      return;
    }
  }
});

  
client27.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const line = autolineDB.get(`line_${message.guild.id}`);
  const lineMode = autolineDB.get(`line_mode_${message.guild.id}`) || 'image'; // Default to link if not set

  if (message.content === "-" || message.content === "خط") {
    if (line && message.member.permissions.has('ManageMessages')) {
      await message.delete();
      if (lineMode === 'link') {
        return message.channel.send({ content: `${line}` });
      } else if (lineMode === 'image') {
        return message.channel.send({ files: [line] });
      }
    }
  }
});
  
client27.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const autoChannels = autolineDB.get(`line_channels_${message.guild.id}`);
  if (autoChannels) {
    if (autoChannels.length > 0) {
      if (autoChannels.includes(message.channel.id)) {
        const line = autolineDB.get(`line_${message.guild.id}`);
        const lineMode = autolineDB.get(`line_mode_${message.guild.id}`) || 'image'; // Default to link if not set

        if (line) {
          if (lineMode === 'link') {
            return message.channel.send({ content: `${line}` });
          } else if (lineMode === 'image') {
            return message.channel.send({ files: [line] });
          }
        }
      }
    }
  }
});

client27.on('messageCreate', async message => {
    if (message.author.bot) return;

    if(message.content == `قيمني`) {
        const designer = message.author;
        const designRole = '1271443664194895894';
        if (!message.member.roles.cache.has(designRole)) {
            return; 
        }

        const filter = response => !response.author.bot && response.author.id !== designer.id;

        message.channel.send(`من فضلك أكتب تقييمك للتصاميم، <@${designer.id}>`).then(() => {
            message.channel.awaitMessages({ filter, max: 1, errors: ['time'] })
                .then(async collected => {

                    const user = collected.first().author; 
                    const userText = collected.first().content;
                    const rankroom = '1278108478828843118';

                    const st1 = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder().setCustomId('1star').setLabel('نجمة 1').setEmoji(`⭐`).setStyle(ButtonStyle.Danger),
                            new ButtonBuilder().setCustomId('2star').setLabel('نجمتين 2').setEmoji(`⭐`).setStyle(ButtonStyle.Danger),
                            new ButtonBuilder().setCustomId('3star').setLabel('3 نجوم').setEmoji(`⭐`).setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder().setCustomId('4star').setLabel('4 نجوم').setEmoji(`⭐`).setStyle(ButtonStyle.Primary),
                            new ButtonBuilder().setCustomId('5star').setLabel('5 نجوم').setEmoji(`⭐`).setStyle(ButtonStyle.Primary)
                        );

                    await message.channel.send({ content: 'اختر عدد النجوم:', components: [st1] });

                    const buttonFilter = i => !i.user.bot && i.user.id !== designer.id;
                    const collector = message.channel.createMessageComponentCollector({ filter: buttonFilter, time: 60000 });

                    collector.on('collect', async interaction => {
                        if (!interaction.isButton()) return;

                        let embedDescription;
                        switch (interaction.customId) {
                            case '1star':
                                embedDescription = '⭐';
                                break;
                            case '2star':
                                embedDescription = '⭐⭐';
                                break;
                            case '3star':
                                embedDescription = '⭐⭐⭐';
                                break;
                            case '4star':
                                embedDescription = '⭐⭐⭐⭐';
                                break;
                            case '5star':
                                embedDescription = '⭐⭐⭐⭐⭐';
                                break;
                        }

                        const embedrank = new EmbedBuilder()
                            .setDescription(`${userText}\n**عدد النجوم:**\n${embedDescription}`)
                            .setColor('#808080')
                            .setAuthor({
                                name: user.username,
                                iconURL: user.displayAvatarURL()
                            });

                        const rankChannel = client27.channels.cache.get(rankroom);
                        if (rankChannel) {
                            await rankChannel.send({ content: `المصمم: <@${designer.id}>`, embeds: [embedrank] });
                            await interaction.reply({ content: 'تم إرسال تقييمك بنجاح، نشكرك لاستعمال خدماتنا', ephemeral: true });
                        } else {
                            await interaction.reply({ content: 'حدث خطأ، روم التقييم غير موجود.', ephemeral: true });
                        }
                            await interaction.message.delete();

                        collector.stop();
                    });

                    collector.on('end', collected => {
                        if (collected.size === 0) {
                            message.channel.send('لم يتم تلقي أي تقييمات.');
                        }
                    });
                })
                .catch(error => {
                    console.error('Error collecting messages: ', error);
                    message.channel.send('انتهى الوقت، لا يمكنك التقييم.');
                });
        });
    }
});

client27.on('messageCreate', async message => {
  if (message.author.bot) return;

if (message.content.startsWith(`${prefix}obc`) || message.content.startsWith(`${prefix}bc`)) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply('❌ ليس لديك الصلاحيات اللازمة لاستخدام هذا الأمر.');
    }

    const args = message.content.split(' ').slice(1);
    const broadcastMsg = args.join(' ');
    if (!broadcastMsg) {
      return message.reply('يرجى كتابة رسالة بعد الأمر.');
    }

    await message.guild.members.fetch();
    let allMembers = message.guild.members.cache.filter(member => !member.user.bot);

    if (message.content.startsWith(`${prefix}obc`)) {
      allMembers = allMembers.filter(mem =>
        mem.presence?.status === 'online' ||
        mem.presence?.status === 'dnd' ||
        mem.presence?.status === 'idle' ||
        mem.presence?.activities.some(activity => activity.type === ActivityType.Streaming)
      );
    }

    allMembers = allMembers.map(mem => mem.user.id);

    const thetokens = db.get(`tokens_${message.guild.id}`) || [];
    const botsNum = thetokens.length;
    const membersPerBot = Math.floor(allMembers.length / botsNum);
    const submembers = [];
    for (let i = 0; i < allMembers.length; i += membersPerBot) {
      submembers.push(allMembers.slice(i, i + membersPerBot));
    }
    if (submembers.length > botsNum) {
      submembers.pop();
    }

    let donemembers = 0;
    let faildmembers = 0;

    const embed = new EmbedBuilder()
      .setTitle('📢 بدء إرسال البرودكاست')
      .setColor('Aqua')
      .setDescription(`**⚫ عدد الأعضاء: \`${allMembers.length}\`\n🟢 تم الإرسال إلى: \`${donemembers}\`\n🔴 فشل الإرسال إلى: \`${faildmembers}\`**`);

    const msg = await message.channel.send({ embeds: [embed] });

    for (let i = 0; i < submembers.length; i++) {
      const token = thetokens[i];
      let clienter = new Client({ intents: 131071 });
      await clienter.login(token);

      submembers[i].forEach(async (sub) => {
        try {
          const user = await clienter.users.fetch(sub);
          await user.send(`${broadcastMsg}\n<@${sub}>`);
          donemembers++;

        } catch (error) {
          faildmembers++;
        }

        const progressEmbed = new EmbedBuilder()
          .setTitle('📢 تحديث حالة البرودكاست')
          .setColor('Aqua')
          .setDescription(`**⚫ عدد الأعضاء: \`${allMembers.length}\`\n🟢 تم الإرسال إلى: \`${donemembers}\`\n🔴 فشل الإرسال إلى: \`${faildmembers}\`**`);

        await msg.edit({ embeds: [progressEmbed] });

        if (donemembers + faildmembers >= allMembers.length) {
          const finalEmbed = new EmbedBuilder()
            .setTitle('✅ تم الانتهاء من إرسال البرودكاست')
            .setColor('Green')
            .setDescription(`**⚫ عدد الأعضاء: \`${allMembers.length}\`\n🟢 تم الإرسال إلى: \`${donemembers}\`\n🔴 فشل الإرسال إلى: \`${faildmembers}\`**`);

          await msg.edit({ embeds: [finalEmbed] });
        }
      });
    }
  }
});

client27.on('messageCreate', async message => {
const cmd = await shortcutDB.get(`rate_cmd_${message.guild.id}`) || null;  
    if (message.author.bot) return;
  if (message.content === `${prefix}تقييم` || message.content === `${cmd}`) {
        const stafer = message.author;
        const staffRole = await feedbackDB.get(`staff_role_${message.guild.id}`);  
        if (!message.member.roles.cache.has(staffRole)) {
            return; 
        }

        const filter = response => !response.author.bot && response.author.id !== stafer.id;

        message.channel.send(`من فضلك أكتب تقييمك للاداري <@${stafer.id}>`).then(() => {
            message.channel.awaitMessages({ filter, max: 1, errors: ['time'] })
                .then(async collected => {

                    const user = collected.first().author; 
                    const userText = collected.first().content;
                    const rankroom = feedbackDB.get(`rank_room_${message.guild.id}`);

                    const st1 = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder().setCustomId('1star').setLabel('نجمة 1').setEmoji(`⭐`).setStyle(ButtonStyle.Danger),
                            new ButtonBuilder().setCustomId('2star').setLabel('نجمتين 2').setEmoji(`⭐`).setStyle(ButtonStyle.Danger),
                            new ButtonBuilder().setCustomId('3star').setLabel('3 نجوم').setEmoji(`⭐`).setStyle(ButtonStyle.Secondary),
                            new ButtonBuilder().setCustomId('4star').setLabel('4 نجوم').setEmoji(`⭐`).setStyle(ButtonStyle.Success),
                            new ButtonBuilder().setCustomId('5star').setLabel('5 نجوم').setEmoji(`⭐`).setStyle(ButtonStyle.Success)
                        );

                    await message.channel.send({ content: 'اختر عدد النجوم:', components: [st1] });

                    const buttonFilter = i => !i.user.bot && i.user.id !== stafer.id;
                    const collector = message.channel.createMessageComponentCollector({ filter: buttonFilter, time: 60000 });

                    collector.on('collect', async interaction => {
                        if (!interaction.isButton()) return;

                        let embedDescription;
                        switch (interaction.customId) {
                            case '1star':
                                embedDescription = '⭐';
                                break;
                            case '2star':
                                embedDescription = '⭐⭐';
                                break;
                            case '3star':
                                embedDescription = '⭐⭐⭐';
                                break;
                            case '4star':
                                embedDescription = '⭐⭐⭐⭐';
                                break;
                            case '5star':
                                embedDescription = '⭐⭐⭐⭐⭐';
                                break;
                        }

                        const embedrank = new EmbedBuilder()
                            .setDescription(`${userText}\n**عدد النجوم:**\n${embedDescription}`)
                            .setColor('Random')
                            .setAuthor({
                                name: user.username,
                                iconURL: user.displayAvatarURL()
                            });

                        const rankChannel = client27.channels.cache.get(rankroom);
                        if (rankChannel) {
                            await rankChannel.send({ content: `الاداري: <@${stafer.id}>`, embeds: [embedrank] });
                            await interaction.reply({ content: 'تم إرسال تقييمك بنجاح، نشكرك لاستعمال خدماتنا', ephemeral: true });
                        } else {
                            await interaction.reply({ content: 'حدث خطأ، روم التقييم غير موجود.', ephemeral: true });
                        }
                            await interaction.message.delete();

                        collector.stop();
                    });

                    collector.on('end', collected => {
                        if (collected.size === 0) {
                            message.channel.send('لم يتم تلقي أي تقييمات.');
                        }
                    });
                })
                .catch(error => {
                    console.error('Error collecting messages: ', error);
                    message.channel.send('انتهى الوقت، لا يمكنك التقييم.');
                });
        });
    }
});

client27.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  const line = suggestionsDB.get(`line_${message.guild.id}`);
  const chan = suggestionsDB.get(`suggestions_room_${message.guild.id}`);
  const suggestionMode = suggestionsDB.get(`suggestion_mode_${message.guild.id}`) || 'buttons'; // Default to buttons if not set
  const threadMode = suggestionsDB.get(`thread_mode_${message.guild.id}`) || 'enabled'; // Default to enabled if not set

  if (chan) {
    if (message.channel.id !== chan) return;
    const embed = new EmbedBuilder()
      .setColor('Random')
      .setTimestamp()
      .setTitle(`** > ${message.content} **`)
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
      .setAuthor({ name: message.author.username, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
      .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL({ dynamic: true }) });

    if (suggestionMode === 'buttons') {
      const button1 = new ButtonBuilder()
        .setCustomId(`ok_button`)
        .setLabel(`0`)
        .setEmoji("✔️")
        .setStyle(ButtonStyle.Success);
      const button2 = new ButtonBuilder()
        .setCustomId(`no_button`)
        .setLabel(`0`)
        .setEmoji("✖️")
        .setStyle(ButtonStyle.Danger);
      const row = new ActionRowBuilder().addComponents(button1, button2);
      let send = await message.channel.send({ embeds: [embed], components: [row] }).catch(() => { return; });

      if (threadMode === 'enabled') {
        await send.startThread({
          name: `Comments - تعليقات`
        }).then(async (thread) => {
          thread.send(`** - هذا المكان مخصص لمشاركة رايك حول هذا الاقتراح : \`${message.content}\` **`);
        });
      }

      if (line) {
        await message.channel.send({ files: [line] }).catch((err) => { return; });
      }
      await suggestionsDB.set(`${send.id}_ok`, 0);
      await suggestionsDB.set(`${send.id}_no`, 0);
      return message.delete();
    } else if (suggestionMode === 'reactions') {
      let send = await message.channel.send({ embeds: [embed] }).catch(() => { return; });
      await send.react('✔️');
      await send.react('❌');

      if (threadMode === 'enabled') {
        await send.startThread({
          name: `Comments - تعليقات`
        }).then(async (thread) => {
          thread.send(`** - هذا المكان مخصص لمشاركة رايك حول هذا الاقتراح : \`${message.content}\` **`);
        });
      }

      if (line) {
        await message.channel.send({ files: [line] }).catch((err) => { return; });
      }
      return message.delete();
    }
  }
});

client27.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  
  const line = feedbackDB.get(`line_${message.guild.id}`);
  const chan = feedbackDB.get(`feedback_room_${message.guild.id}`);
  const feedbackMode = feedbackDB.get(`feedback_mode_${message.guild.id}`) || 'embed'; 
  const feedbackEmoji = feedbackDB.get(`feedback_emoji_${message.guild.id}`) || "❤"; 

  if (chan) {
    if (message.channel.id !== chan) return;

    const embed = new EmbedBuilder()
      .setColor('Random')
      .setTimestamp()
      .setTitle(`** > ${message.content} **`)
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
      .setAuthor({ name: message.author.username, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
      .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL({ dynamic: true }) });

    if (feedbackMode === 'embed') {
      await message.delete();
      const themsg = await message.channel.send({ content: `**<@${message.author.id}> شكرا لمشاركتنا رأيك :tulip:**`, embeds: [embed] });
      await themsg.react("❤");
      await themsg.react("❤️‍🔥");
      if (line) {
        await message.channel.send({ files: [line] });
      }
    } else if (feedbackMode === 'reactions') {
      await message.react(feedbackEmoji);
      if (line) {
        await message.channel.send({ files: [line] });
      }
    }
  }
});

client27.on('messageCreate', async message => {
    if (message.author.bot) return;
  if(message.content == `${prefix}close`) {
        const supportRoleID = ticketDB.get(`TICKET-PANEL_${message.channel.id}`)?.Support;

   /*     if (!message.member.roles.cache.has(supportRoleID)) {
            return message.reply({ content: ':x: You do not have permission to close this ticket.', ephemeral: true });
        }*/

        const ticket = ticketDB.get(`TICKET-PANEL_${message.channel.id}`);

        await message.channel.permissionOverwrites.edit(ticket.author, { ViewChannel: false });

        const embed2 = new EmbedBuilder()
            .setDescription(`تم اغلاق تذكرة بواسطة ${message.author}`)
            .setColor("Yellow");

        const embed = new EmbedBuilder()
            .setDescription("```لوحة فريق الدعم.```")
            .setColor("DarkButNotBlack");

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId('delete').setLabel('Delete').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId('Open').setLabel('Open').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('Tran').setLabel('Transcript').setStyle(ButtonStyle.Secondary)
            );

        await message.reply({ embeds: [embed2, embed], components: [row] });

        const logsRoomId = ticketDB.get(`LogsRoom_${message.guild.id}`);
        const logChannel = message.guild.channels.cache.get(logsRoomId);

        if (logChannel) {
            const logEmbed = new EmbedBuilder()
                .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
                .setTitle('Close Ticket')
                .addFields(
                    { name: 'Name Ticket', value: `${message.channel.name}` },
                    { name: 'Owner Ticket', value: `${ticket.author}` },
                    { name: 'Closed By', value: `${message.author}` },
                )
                .setFooter({ text: message.author.tag, iconURL: message.author.displayAvatarURL() });

            logChannel.send({ embeds: [logEmbed] });
        }
    }
});


client27.on('messageCreate', async message => {
    const supportRoleId = ticketDB.get(`TICKET-PANEL_${message.channel.id}`)?.Support;
    if (message.author.bot) return;
  if(message.content == `${prefix}delete`) {
        if (!message.member.roles.cache.has(supportRoleId)) {
            message.reply({ content: ':x: Only Support', ephemeral: true });
            return;
        }

        if (!ticketDB.has(`TICKET-PANEL_${message.channel.id}`)) {
            message.reply({ content: 'This channel isn\'t a ticket', ephemeral: true });
            return;
        }
        const embed = new EmbedBuilder()
            .setColor('Red')
            .setDescription('Ticket will be deleted in a few seconds');
        await message.reply({ embeds: [embed] });

        setTimeout(() => {
            message.channel.delete();
        }, 4500);

        const Logs = ticketDB.get(`LogsRoom_${message.guild.id}`);
        const Log = message.guild.channels.cache.get(Logs);
        const Ticket = ticketDB.get(`TICKET-PANEL_${message.channel.id}`);
        const logEmbed = new EmbedBuilder()
            .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
            .setTitle('Delete Ticket')
            .addFields(
                { name: 'Name Ticket', value: `${message.channel.name}` },
                { name: 'Owner Ticket', value: `${Ticket.author}` },
                { name: 'Deleted By', value: `${message.author}` },
            )
            .setFooter({ text: message.author.tag, iconURL: message.author.displayAvatarURL() });

        Log?.send({ embeds: [logEmbed] });
        ticketDB.delete(`TICKET-PANEL_${message.channel.id}`);
    }
});

client27.on('messageCreate', async message => {
const cmd = await shortcutDB.get(`say_cmd_${message.guild.id}`) || null;  
    if (message.author.bot) return;
    if (message.content.startsWith(`${prefix}say`) || message.content.startsWith(`${cmd}`)) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return;
        const content = message.content.slice(`${prefix}say`.length).trim();
        if (!content) {
            message.channel.send("من فضلك اكتب شيئا بعد الأمر.");
            return;
        }
        let image = null;
        if (message.attachments.size > 0) {
            const attachment = message.attachments.first();
            image = attachment.url;
        }

        await message.delete();

        await message.channel.send({ 
            content: content, 
            files: image ? [image] : [] 
        });
    }
});

client27.on('messageCreate', async message => {
  const cmd = shortcutDB.get(`clear_cmd_${message.guild.id}`) || null;
    if (message.author.bot) return;
    if (message.content.startsWith(`${prefix}clear`) || message.content.startsWith(`${cmd}`)) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return;
        const args = message.content.split(' ').slice(1);
        const amount = args[0] ? parseInt(args[0]) : 99;
        if (isNaN(amount) || amount <= 0 || amount > 100) return;
        try {
            const fetchedMessages = await message.channel.messages.fetch({ limit: amount });
            const messagesToDelete = fetchedMessages.filter(msg => {
                const fourteenDays = 14 * 24 * 60 * 60 * 1000;
                return (Date.now() - msg.createdTimestamp) < fourteenDays;
            });
            await message.channel.bulkDelete(messagesToDelete);
        } catch (error) {
        }
    }
});


client27.on('messageCreate', async message => {
const cmd = await shortcutDB.get(`tax_cmd_${message.guild.id}`) || null; 
    if (message.content.startsWith(`${prefix}tax`) || message.content.startsWith(`${cmd}`)) {
        const args = message.content.startsWith(`${prefix}tax`) 
            ? message.content.slice(`${prefix}tax`.length).trim() 
            : message.content.slice(`${cmd}`.length).trim();

        let number = args;
        if (number.endsWith("k")) number = number.replace(/k/gi, "") * 1000;
        else if (number.endsWith("K")) number = number.replace(/K/gi, "") * 1000;
        else if (number.endsWith("m")) number = number.replace(/m/gi, "") * 1000000;
        else if (number.endsWith("M")) number = number.replace(/M/gi, "") * 1000000;

        let number2 = parseFloat(number);

        if (isNaN(number2)) {
            return message.reply('يرجى إدخال رقم صحيح بعد الأمر');
        }

        let tax = Math.floor(number2 * (20) / (19) + 1); // الضريبة
        let tax2 = Math.floor(tax - number2); // المبلغ مع الضريبة

        await message.reply(`${tax}`);
    }
});

client27.on('messageCreate', async message => {
const cmd = await shortcutDB.get(`come_cmd_${message.guild.id}`) || null;  
    if (message.content.startsWith(`${prefix}come`) || message.content.startsWith(`${cmd}`)) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
            return message.reply('يجب أن تملك صلاحية إدارة الرسائل (MANAGE_MESSAGES).');
        }
        const mentionOrID = message.content.split(/\s+/)[1];
        const targetMember = message.mentions.members.first() || message.guild.members.cache.get(mentionOrID);
        if (!targetMember) {
            return message.reply('من فضلك قم بعمل منشن لشخص أو ضع الإيدي.');
        }
        const directMessageContent = `**تم استدعائك بواسطة : ${message.author}\nفي : ${message.channel}**`;
        try {
            await targetMember.send(directMessageContent);
            await message.reply('**تم الارسال للشخص بنجاح**');
        } catch (error) {
            await message.reply('**لم استطع الارسال للشخص**');
        }
    }
});

client27.on("messageCreate", async (message) => {
const cmd = await shortcutDB.get(`lock_cmd_${message.guild.id}`) || null;  
  if (message.content === `${prefix}lock` || message.content === `${cmd}`) {
    try {
      if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
        return message.reply({ content: `**لا تمتلك صلاحية لفعل ذلك**` });
            }
      await message.channel.permissionOverwrites.edit(
        message.channel.guild.roles.everyone, 
        { SendMessages: false }
      );
      
      return message.reply({ content: `**${message.channel} has been locked**` });
    } catch (error) {
      message.reply({ content: `لقد حدث خطأ، اتصل بالمطورين.` });
      console.log(error);
    }
  }
});

client27.on("messageCreate", async (message) => {
const cmd = await shortcutDB.get(`unlock_cmd_${message.guild.id}`) || null;  
  if (message.content === `${prefix}unlock` || message.content === `${cmd}`) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      return message.reply({ content: `**لا تمتلك صلاحية لفعل ذلك**` });
    }
      await message.channel.permissionOverwrites.edit(
      message.channel.guild.roles.everyone, 
      { SendMessages: true }
    );
    return message.reply({ content: `**${message.channel} has been unlocked**` });
  }
});

client27.on("messageCreate", async (message) => {
const cmd = await shortcutDB.get(`hide_cmd_${message.guild.id}`) || null;  
  if (message.content === `${prefix}hide` || message.content === `${cmd}`) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      return message.reply({ content: `**لا تمتلك صلاحية لفعل ذلك**` });
    }
      await message.channel.permissionOverwrites.edit(
      message.channel.guild.roles.everyone, 
      { ViewChannel: false }
    );
    return message.reply({ content: `**${message.channel} has been hidden**` });
  }
});

client27.on("messageCreate", async (message) => {
const cmd = await shortcutDB.get(`unhide_cmd_${message.guild.id}`) || null;  
  if (message.content === `${prefix}unhide` || message.content === `${cmd}`) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      return message.reply({ content: `**لا تمتلك صلاحية لفعل ذلك**` });
    }
      await message.channel.permissionOverwrites.edit(
      message.channel.guild.roles.everyone, 
      { ViewChannel: true }
    );
    return message.reply({ content: `**${message.channel} has been unhidded**` });
  }
});

client27.on("messageCreate", async (message) => {
const cmd = await shortcutDB.get(`server_cmd_${message.guild.id}`) || null;
  if (message.content === `${prefix}server` || message.content === `${cmd}`) {
    const embedser = new EmbedBuilder()
      .setAuthor({ name: message.guild.name, iconURL: message.guild.iconURL({ dynamic: true }) })
      .setColor('Random')
      .addFields(
        {
          name: `**🆔 Server ID:**`, 
          value: message.guild.id, 
          inline: false
        },
        {
          name: `**📆 Created On:**`, 
          value: `**<t:${parseInt(message.guild.createdTimestamp / 1000)}:R>**`, 
          inline: false
        },
        {
          name: `**👑 Owned By:**`, 
          value: `**<@${message.guild.ownerId}>**`, 
          inline: false
        },
        {
          name: `**👥 Members (${message.guild.memberCount})**`, 
          value: `**${message.guild.premiumSubscriptionCount} Boosts ✨**`, 
          inline: false
        },
        {
          name: `**💬 Channels (${message.guild.channels.cache.size})**`, 
          value: `**${message.guild.channels.cache.filter(r => r.type === ChannelType.GuildText).size}** Text | **${
              message.guild.channels.cache.filter(r => r.type === ChannelType.GuildVoice).size
            }** Voice | **${message.guild.channels.cache.filter(r => r.type === ChannelType.GuildCategory).size}** Category`,
          inline: false
        },
        {
          name: '🌍 Others',
          value: `**Verification Level:** ${message.guild.verificationLevel}`,
          inline: false
        }
      )
      .setThumbnail(message.guild.iconURL({ dynamic: true }));
    return message.reply({ embeds: [embedser] });
  }
});


  // بداية الحماية من البوتات
client27.on("guildMemberAdd" , async(member) => {
  if(protectDB.has(`antibots_status_${member.guild.id}`)) {
    let antibotsstatus = protectDB.get(`antibots_status_${member.guild.id}`)
    if(antibotsstatus == "on") {
      if(member.user.bot) {
        try {
          const logRoom = await protectDB.get(`protectLog_room_${member.guild.id}`)
          if(logRoom){
            const theLogRoom = await member.guild.channels.cache.find((ch) => ch.id == logRoom);
            theLogRoom.send({embeds : [new EmbedBuilder().setTitle('نظام الحماية').addFields({name : `العضو :` , value : `${member.user.username} \`${member.id}\``} , {name : `السبب :` , value : `نظام الحماية من البوتات`} , {name : `العقاب :` , value : `طرد البوت`})]})
          }
          member.kick()
        } catch(err){
          return console.log('error' , err);
        }
      }
    }
  }
})
// نهاية الحماية من البوتات

//-

// بداية الحماية من حذف الرومات
client27.on('ready' , async() => {
  const guild = client27.guilds.cache.first()
  if(!guild) return;
  const guildid = guild.id
  let status = protectDB.get(`antideleterooms_status_${guildid}`)
  if(!status)return;
  if(status == "off") return;
  setInterval(() => {
  const users = protectDB.get(`roomsdelete_users_${guildid}`)
    if(!users) return;
    if(users.length > 0) {
      users.forEach(async(user) => {
        const { userid , limit , newReset } = user;
        const currentTime = moment().format('YYYY-MM-DD');
        if(moment(currentTime).isSame(newReset) || moment(currentTime).isAfter(newReset)) {
          const newResetDate = moment().add(1 , 'day').format('YYYY-MM-DD')
          executordb = {userid:userid,limit:0,newReset:newResetDate}
          const index = users.findIndex(user => user.userid === userid);
      users[index] = executordb;
      await protectDB.set(`roomsdelete_users_${guildid}` , users)
        }
        let limitrooms = protectDB.get(`antideleterooms_limit_${guildid}`)
      if(limit > limitrooms) {
        let member = guild.members.cache.find(m => m.id == userid)
       try {
         member.kick()
       } catch  {
        return;
       }
      }
      })
      
    } 
  }, 6 * 1000);
})

client27.on('channelDelete' , async(channel) => {
  let guildid = channel.guild.id
  let status = protectDB.get(`antideleterooms_status_${guildid}`)
  if(!status)return;
  if(status == "off") return;
  const fetchedLogs = await channel.guild.fetchAuditLogs({
    limit: 1,
    type: AuditLogEvent.ChannelDelete
  });
  const channelDeleteLog = fetchedLogs.entries.first();
  const { executor } = channelDeleteLog;
  const users = protectDB.get(`roomsdelete_users_${guildid}`)
  const endTime = moment().add(1 , 'day').format('YYYY-MM-DD')
  if(users.length <= 0) {
    await protectDB.push(`roomsdelete_users_${guildid}` , {userid:executor.id , limit:1 , newReset:endTime})
    return;
  }
  let executordb = users.find(user => user.userid == executor.id)
  if(!executordb) {
      await protectDB.push(`roomsdelete_users_${guildid}` , {userid:executor.id , limit:1 , newReset:endTime})
      return;
  }
  let oldexecutorlimit = executordb.limit
  let newexecutorlimit = oldexecutorlimit + 1
  executordb = {userid:executor.id,limit:newexecutorlimit,newReset:endTime}
  const index = users.findIndex(user => user.userid === executor.id);
users[index] = executordb;
  let deletelimit = protectDB.get(`antideleterooms_limit_${guildid}`)
  if(newexecutorlimit > deletelimit) {
    let guild = client27.guilds.cache.find(gu => gu.id == guildid)
    let member = guild.members.cache.find(ex => ex.id == executor.id)
   try {
    const logRoom = await protectDB.get(`protectLog_room_${member.guild.id}`)
    if(logRoom){
      const theLogRoom = await member.guild.channels.cache.find((ch) => ch.id == logRoom);
      theLogRoom.send({embeds : [new EmbedBuilder().setTitle('نظام الحماية').addFields({name : `العضو :` , value : `${member.user.username} \`${member.id}\``} , {name : `السبب :` , value : `حذف رومات`} , {name : `العقاب :` , value : `طرد العضو`})]})
    }
    member.kick()
   } catch  {
    return;
   }
    let filtered = users.filter(a => a.userid != executor.id)
    await protectDB.set(`roomsdelete_users_${guildid}` , filtered)
  } else {
    await protectDB.set(`roomsdelete_users_${guildid}` , users)
  }
})
// نهاية الحماية من حذف الرومات

//-

// بداية الحماية من حذف الرتب
client27.on('ready' , async() => {
  const guild = client27.guilds.cache.first()
  if(!guild) return;
  const guildid = guild.id
  let status = protectDB.get(`antideleteroles_status_${guildid}`)
  if(!status)return;
  if(status == "off") return;
  setInterval(() => {
  const users = protectDB.get(`rolesdelete_users_${guildid}`)
    if(!users) return;
    if(users.length > 0) {
      users.forEach(async(user) => {
        const { userid , limit , newReset } = user;
        const currentTime = moment().format('YYYY-MM-DD');
        if(moment(currentTime).isSame(newReset) || moment(currentTime).isAfter(newReset)) {
          const newResetDate = moment().add(1 , 'day').format('YYYY-MM-DD')
          executordb = {userid:userid,limit:0,newReset:newResetDate}
          const index = users.findIndex(user => user.userid === userid);
      users[index] = executordb;
      await protectDB.set(`rolesdelete_users_${guildid}` , users)
        }
        let limitrooms = protectDB.get(`antideleteroles_limit_${guildid}`)
      if(limit > limitrooms) {
        let member = guild.members.cache.find(m => m.id == userid)
       try {
         member.kick()
       } catch  {
        return;
       }
      }
      })
      
    } 
  }, 6 * 1000);
})

client27.on('roleDelete' , async(role) => {
  let guildid = role.guild.id
  let status = protectDB.get(`antideleteroles_status_${guildid}`)
  if(!status)return;
  if(status == "off") return;
  const fetchedLogs = await role.guild.fetchAuditLogs({
    limit: 1,
    type: AuditLogEvent.ChannelDelete
  });
  const channelDeleteLog = fetchedLogs.entries.first();
  const { executor } = channelDeleteLog;
  const users = protectDB.get(`rolesdelete_users_${guildid}`)
  const endTime = moment().add(1 , 'day').format('YYYY-MM-DD')
  if(users.length <= 0) {
    await protectDB.push(`rolesdelete_users_${guildid}` , {userid:executor.id , limit:1 , newReset:endTime})
    return;
  }
  let executordb = users.find(user => user.userid == executor.id)
  if(!executordb) {
      await protectDB.push(`rolesdelete_users_${guildid}` , {userid:executor.id , limit:1 , newReset:endTime})
      return;
  }
  let oldexecutorlimit = executordb.limit
  let newexecutorlimit = oldexecutorlimit + 1
  executordb = {userid:executor.id,limit:newexecutorlimit,newReset:endTime}
  const index = users.findIndex(user => user.userid === executor.id);
users[index] = executordb;
  let deletelimit = protectDB.get(`antideleteroles_limit_${guildid}`)
  if(newexecutorlimit > deletelimit) {
    let guild = client27.guilds.cache.find(gu => gu.id == guildid)
    let member = guild.members.cache.find(ex => ex.id == executor.id)
   try {
    const logRoom = await protectDB.get(`protectLog_room_${member.guild.id}`)
    if(logRoom){
      const theLogRoom = await member.guild.channels.cache.find((ch) => ch.id == logRoom);
      theLogRoom.send({embeds : [new EmbedBuilder().setTitle('نظام الحماية').addFields({name : `العضو :` , value : `${member.user.username} \`${member.id}\``} , {name : `السبب :` , value : `حذف رتب`} , {name : `العقاب :` , value : `طرد العضو`})]})
    }
    member.kick()
   } catch  {
    return;
   }
    let filtered = users.filter(a => a.userid != executor.id)
    await protectDB.set(`rolesdelete_users_${guildid}` , filtered)
  } else {
    await protectDB.set(`rolesdelete_users_${guildid}` , users)
  }
})

// نهاية الحماية من حذف الرتب

//-

// بداية الحماية من البان
client27.on('ready' , async() => {
  const guild = client27.guilds.cache.first()
  if(!guild) return;
  const guildid = guild.id
  let status = protectDB.get(`ban_status_${guildid}`)
  if(!status)return;
  if(status == "off") return;
  setInterval(() => {
  const users = protectDB.get(`ban_users_${guildid}`)
    if(!users) return;
    if(users.length > 0) {
      users.forEach(async(user) => {
        const { userid , limit , newReset } = user;
        const currentTime = moment().format('YYYY-MM-DD');
        if(moment(currentTime).isSame(newReset) || moment(currentTime).isAfter(newReset)) {
          const newResetDate = moment().add(1 , 'day').format('YYYY-MM-DD')
          executordb = {userid:userid,limit:0,newReset:newResetDate}
          const index = users.findIndex(user => user.userid === userid);
      users[index] = executordb;
      await protectDB.set(`ban_users_${guildid}` , users)
        }
        let limitrooms = protectDB.get(`ban_limit_${guildid}`)
      if(limit > limitrooms) {
        let member = guild.members.cache.find(m => m.id == userid)
       try {
         member.kick()
       } catch  {
        return;
       }
      }
      })
      
    } 
  }, 6 * 1000);
})

client27.on('guildBanAdd' , async(member) => {
  let guildid = member.guild.id
  let status = protectDB.get(`ban_status_${guildid}`)
  if(!status)return;
  if(status == "off") return;
  const fetchedLogs = await member.guild.fetchAuditLogs({
    limit: 1,
    type: AuditLogEvent.MemberBanAdd
  });
  const channelDeleteLog = fetchedLogs.entries.first();
  const { executor } = channelDeleteLog;
  const users = protectDB.get(`ban_users_${guildid}`)
  const endTime = moment().add(1 , 'day').format('YYYY-MM-DD')
  if(users.length <= 0) {
    await protectDB.push(`ban_users_${guildid}` , {userid:executor.id , limit:1 , newReset:endTime})
    return;
  }
  let executordb = users.find(user => user.userid == executor.id)
  if(!executordb) {
      await protectDB.push(`ban_users_${guildid}` , {userid:executor.id , limit:1 , newReset:endTime})
      return;
  }
  let oldexecutorlimit = executordb.limit
  let newexecutorlimit = oldexecutorlimit + 1
  executordb = {userid:executor.id,limit:newexecutorlimit,newReset:endTime}
  const index = users.findIndex(user => user.userid === executor.id);
users[index] = executordb;
  let deletelimit = protectDB.get(`ban_limit_${guildid}`)
  if(newexecutorlimit > deletelimit) {
    let guild = client27.guilds.cache.find(gu => gu.id == guildid)
    let member = guild.members.cache.find(ex => ex.id == executor.id)
   try {
    const logRoom = await protectDB.get(`protectLog_room_${member.guild.id}`)
    if(logRoom){
      const theLogRoom = await member.guild.channels.cache.find((ch) => ch.id == logRoom);
      theLogRoom.send({embeds : [new EmbedBuilder().setTitle('نظام الحماية').addFields({name : `العضو :` , value : `${member.user.username} \`${member.id}\``} , {name : `السبب :` , value : `حظر اعضاء`} , {name : `العقاب :` , value : `طرد العضو`})]})
    }
    member.kick()
   } catch  {
    return;
   }
    let filtered = users.filter(a => a.userid != executor.id)
    await protectDB.set(`ban_users_${guildid}` , filtered)
  } else {
    await protectDB.set(`ban_users_${guildid}` , users)
  }
})

client27.on('guildMemberRemove' , async(member) => {
  let guildid = member.guild.id
  let status = protectDB.get(`ban_status_${guildid}`)
  if(!status)return;
  if(status == "off") return;
  if(member.id === client27.user.id) return;
  const fetchedLogs = await member.guild.fetchAuditLogs({
    limit: 1,
    type: AuditLogEvent.MemberKick
  });
  const channelDeleteLog = fetchedLogs.entries.first();
  const { executor } = channelDeleteLog;
  const users = protectDB.get(`ban_users_${guildid}`)
  const endTime = moment().add(1 , 'day').format('YYYY-MM-DD')
  if(users.length <= 0) {
    await protectDB.push(`ban_users_${guildid}` , {userid:executor.id , limit:1 , newReset:endTime})
    return;
  }
  let executordb = users.find(user => user.userid == executor.id)
  if(!executordb) {
      await protectDB.push(`ban_users_${guildid}` , {userid:executor.id , limit:1 , newReset:endTime})
      return;
  }
  let oldexecutorlimit = executordb.limit
  let newexecutorlimit = oldexecutorlimit + 1
  executordb = {userid:executor.id,limit:newexecutorlimit,newReset:endTime}
  const index = users.findIndex(user => user.userid === executor.id);
users[index] = executordb;
  let deletelimit = protectDB.get(`ban_limit_${guildid}`)
  if(newexecutorlimit > deletelimit) {
    let guild = client27.guilds.cache.find(gu => gu.id == guildid)
    let member = guild.members.cache.find(ex => ex.id == executor.id)
   try {
    const logRoom = await protectDB.get(`protectLog_room_${member.guild.id}`)
    if(logRoom){
      const theLogRoom = await member.guild.channels.cache.find((ch) => ch.id == logRoom);
      theLogRoom.send({embeds : [new EmbedBuilder().setTitle('نظام الحماية').addFields({name : `العضو :` , value : `${member.user.username} \`${member.id}\``} , {name : `السبب :` , value : `طرد اعضاء`} , {name : `العقاب :` , value : `طرد العضو`})]})
    }
    member.kick()
   } catch  {
    return;
   }
    let filtered = users.filter(a => a.userid != executor.id)
    await protectDB.set(`ban_users_${guildid}` , filtered)
  } else {
    await protectDB.set(`ban_users_${guildid}` , users)
  }
})

// نهاية الحماية من البان

client27.on('messageDelete' , async(message) => {
  if(!message) return;
  if(!message.author) return;
  if(message.author.bot) return;
if (!logsDB.has(`log_messagedelete_${message.guild.id}`)) return;
let deletelog1 = logsDB.get(`log_messagedelete_${message.guild.id}`)
  let deletelog2 = message.guild.channels.cache.get(deletelog1)
  const fetchedLogs = await message.guild.fetchAuditLogs({
    limit: 1,
    type: AuditLogEvent.MessageDelete
  });
  const deletionLog = fetchedLogs.entries.first();
  const { executor, target } = deletionLog;
let deleteembed = new EmbedBuilder()
.setTitle(`**تم حذف رسالة**`)
    .addFields(
      {
        name: `**صاحب الرسالة : **`, value: `**\`\`\`${message.author.tag} - (${message.author.id})\`\`\`**`, inline: false
      },
      {
        name: `**حاذف الرسالة : **`, value: `**\`\`\`${executor.username} - (${executor.id})\`\`\`**`, inline: false
      },
      {
        name: `**محتوى الرسالة : **`, value: `**\`\`\`${message.content}\`\`\`**`, inline: false
      },
      {
        name: `**الروم الذي تم الحذف فيه : **`, value: `${message.channel}`, inline: false
      }
    )
    .setTimestamp();
  await deletelog2.send({ embeds: [deleteembed] })
})
client27.on('messageUpdate' , async(oldMessage, newMessage) => {
if(!oldMessage.author) return;
if(oldMessage.author.bot) return;
if (!logsDB.has(`log_messageupdate_${oldMessage.guild.id}`)) return;
const fetchedLogs = await oldMessage.guild.fetchAuditLogs({
limit: 1,
type: AuditLogEvent.MessageUpdate
});
let updateLog1 = logsDB.get(`log_messageupdate_${oldMessage.guild.id}`);
  let updateLog2 = oldMessage.guild.channels.cache.get(updateLog1); 
const updateLog = fetchedLogs.entries.first();
const { executor } = updateLog;
let updateEmbed = new EmbedBuilder()
.setTitle(`**تم تعديل رسالة**`)
.addFields(
{
  name: "**صاحب الرسالة:**",
  value: `**\`\`\`${oldMessage.author.tag} (${oldMessage.author.id})\`\`\`**`,
  inline: false
},
{
  name: "**المحتوى القديم:**",
  value: `**\`\`\`${oldMessage.content}\`\`\`**`,
  inline: false
},
{
  name: "**المحتوى الجديد:**",
  value: `**\`\`\`${newMessage.content}\`\`\`**`,
  inline: false
},
{
  name: "**الروم الذي تم التحديث فيه:**",
  value: `${oldMessage.channel}`,
  inline: false
}
)
.setTimestamp()
await updateLog2.send({ embeds: [updateEmbed] });
})
client27.on('roleCreate' , async(role) => {
if (!logsDB.has(`log_rolecreate_${role.guild.id}`)) return;
let roleCreateLog1 = logsDB.get(`log_rolecreate_${role.guild.id}`);
  let roleCreateLog2 = role.guild.channels.cache.get(roleCreateLog1);
  const fetchedLogs = await role.guild.fetchAuditLogs({
    limit: 1,
    type: AuditLogEvent.RoleCreate
  });
  const roleCreateLog = fetchedLogs.entries.first();
  const { executor } = roleCreateLog;
  let roleCreateEmbed = new EmbedBuilder()
    .setTitle('**تم انشاء رتبة**')
    .addFields(
      { name: 'اسم الرتبة :', value: `\`\`\`${role.name}\`\`\``, inline: true },
      { name: 'الذي قام بانشاء الرتبة :', value: `\`\`\`${executor.username} (${executor.id})\`\`\``, inline: true }
    )
    .setTimestamp();
  await roleCreateLog2.send({ embeds: [roleCreateEmbed] });
})
client27.on('roleDelete' , async(role) => {
if (!logsDB.has(`log_roledelete_${role.guild.id}`)) return;
let roleDeleteLog1 = logsDB.get(`log_roledelete_${role.guild.id}`);
  let roleDeleteLog2 = role.guild.channels.cache.get(roleDeleteLog1);
  const fetchedLogs = await role.guild.fetchAuditLogs({
    limit: 1,
    type: AuditLogEvent.RoleDelete
  });

  const roleDeleteLog = fetchedLogs.entries.first();
  const { executor } = roleDeleteLog;

  let roleDeleteEmbed = new EmbedBuilder()
    .setTitle('**تم حذف رتبة**')
    .addFields({name:'اسم الرتبة :', value:`\`\`\`${role.name}\`\`\``, inline:true},{name:'الذي قام بحذف الرتبة :', value:`\`\`\`${executor.username} (${executor.id})\`\`\``, inline:true})
    .setTimestamp();

  await roleDeleteLog2.send({ embeds: [roleDeleteEmbed] });
})




client27.on('channelCreate', async (channel) => {
if (logsDB.has(`log_channelcreate_${channel.guild.id}`)) {
let channelCreateLog1 = logsDB.get(`log_channelcreate_${channel.guild.id}`);
let channelCreateLog2 = channel.guild.channels.cache.get(channelCreateLog1);




const fetchedLogs = await channel.guild.fetchAuditLogs({
  limit: 1,
  type: AuditLogEvent.ChannelCreate
});

const channelCreateLog = fetchedLogs.entries.first();
const { executor } = channelCreateLog;

let channelCategory = channel.parent ? channel.parent.name : 'None';

let channelCreateEmbed = new EmbedBuilder()
  .setTitle('**تم انشاء روم**')
  .addFields(
    { name: 'اسم الروم : ', value: `\`\`\`${channel.name}\`\`\``, inline: true },
    { name: 'كاتيجوري الروم : ', value: `\`\`\`${channelCategory}\`\`\``, inline: true },
    { name: 'الذي قام بانشاء الروم : ', value: `\`\`\`${executor.username} (${executor.id})\`\`\``, inline: true }
  )
  .setTimestamp();

await channelCreateLog2.send({ embeds: [channelCreateEmbed] });
}
});




client27.on('channelDelete', async (channel) => {
if (logsDB.has(`log_channeldelete_${channel.guild.id}`)) {
let channelDeleteLog1 = logsDB.get(`log_channeldelete_${channel.guild.id}`);
let channelDeleteLog2 = channel.guild.channels.cache.get(channelDeleteLog1);




const fetchedLogs = await channel.guild.fetchAuditLogs({
  limit: 1,
  type: AuditLogEvent.ChannelDelete
});

const channelDeleteLog = fetchedLogs.entries.first();
const { executor } = channelDeleteLog;

let channelDeleteEmbed = new EmbedBuilder()
  .setTitle('**تم حذف روم**')
  .addFields(
    { name: 'اسم الروم : ', value: `\`\`\`${channel.name}\`\`\``, inline: true },
    { name: 'الذي قام بحذف الروم : ', value: `\`\`\`${executor.username} (${executor.id})\`\`\``, inline: true }
  )
  .setTimestamp();

await channelDeleteLog2.send({ embeds: [channelDeleteEmbed] });
}
});

client27.on('guildMemberUpdate', async (oldMember, newMember) => {
const guild = oldMember.guild;
const addedRoles = newMember.roles.cache.filter((role) => !oldMember.roles.cache.has(role.id));
const removedRoles = oldMember.roles.cache.filter((role) => !newMember.roles.cache.has(role.id));




if (addedRoles.size > 0 && logsDB.has(`log_rolegive_${guild.id}`)) {
let roleGiveLog1 = logsDB.get(`log_rolegive_${guild.id}`);
let roleGiveLog2 = guild.channels.cache.get(roleGiveLog1);

const fetchedLogs = await guild.fetchAuditLogs({
  limit: addedRoles.size,
  type: AuditLogEvent.MemberRoleUpdate
});

addedRoles.forEach((role) => {
  const roleGiveLog = fetchedLogs.entries.find((log) => log.target.id === newMember.id && log.changes[0].new[0].id === role.id);
  const roleGiver = roleGiveLog ? roleGiveLog.executor : null;
  const roleGiverUsername = roleGiver ? `${roleGiver.username} (${roleGiver.id})` : `UNKNOWN`;



  let roleGiveEmbed = new EmbedBuilder()
    .setTitle('**تم إعطاء رتبة لعضو**')
    .addFields(
      { name: 'اسم الرتبة:', value: `\`\`\`${role.name}\`\`\``, inline: true },
      { name: 'تم إعطاءها بواسطة:', value: `\`\`\`${roleGiverUsername}\`\`\``, inline: true },
      { name: 'تم إعطائها للعضو:', value: `\`\`\`${newMember.user.username} (${newMember.user.id})\`\`\``, inline: true }
    )
    .setTimestamp();

  roleGiveLog2.send({ embeds: [roleGiveEmbed] });
});
}

if (removedRoles.size > 0 && logsDB.has(`log_roleremove_${guild.id}`)) {
let roleRemoveLog1 = logsDB.get(`log_roleremove_${guild.id}`);
let roleRemoveLog2 = guild.channels.cache.get(roleRemoveLog1);

const fetchedLogs = await guild.fetchAuditLogs({
  limit: removedRoles.size,
  type: AuditLogEvent.MemberRoleUpdate
});




removedRoles.forEach((role) => {
  const roleRemoveLog = fetchedLogs.entries.find((log) => log.target.id === newMember.id && log.changes[0].new[0].id === role.id);
  const roleRemover = roleRemoveLog ? roleRemoveLog.executor : null;
  const roleRemoverUsername = roleRemover ? `${roleRemover.username} (${roleRemover.id})` : `UNKNOWN`;

  let roleRemoveEmbed = new EmbedBuilder()
    .setTitle('**تم إزالة رتبة من عضو**')
    .addFields(
      { name: 'اسم الرتبة:', value: `\`\`\`${role.name}\`\`\``, inline: true },
      { name: 'تم إزالتها بواسطة:', value: `\`\`\`${roleRemoverUsername}\`\`\``, inline: true },
      { name: 'تم إزالتها من العضو:', value: `\`\`\`${newMember.user.username} (${newMember.user.id})\`\`\``, inline: true }
    )
    .setTimestamp();


  roleRemoveLog2.send({ embeds: [roleRemoveEmbed] });
});
}
});
client27.on('guildMemberAdd', async (member) => {
const guild = member.guild;
if(!member.bot) return;
const fetchedLogs = await guild.fetchAuditLogs({
limit: 1,
type: AuditLogEvent.BotAdd
});




const botAddLog = fetchedLogs.entries.first();
const { executor, target } = botAddLog;

if (target.bot) {
let botAddLog1 = logsDB.get(`log_botadd_${guild.id}`);
let botAddLog2 = guild.channels.cache.get(botAddLog1);

let botAddEmbed = new EmbedBuilder()
  .setTitle('**تم اضافة بوت جديد الى السيرفر**')
  .addFields(
    { name: 'اسم البوت :', value: `\`\`\`${member.user.username}\`\`\``, inline: true },
    { name: 'ايدي البوت :', value: `\`\`\`${member.user.id}\`\`\``, inline: true },
    { name: 'هل لدية صلاحية الادمن ستريتور ؟ :', value: member.permissions.has('Administrator') ? `\`\`\`نعم لديه\`\`\`` : `\`\`\`لا ليس لديه\`\`\``, inline: true },
    { name: 'تم اضافته بواسطة :', value: `\`\`\`${executor.username} (${executor.id})\`\`\``, inline: false }
  )
  .setTimestamp();

botAddLog2.send({ embeds: [botAddEmbed] });
}
});





client27.on('guildBanAdd', async (guild, user) => {
if (logsDB.has(`log_banadd_${guild.id}`)) {
let banAddLog1 = logsDB.get(`log_banadd_${guild.id}`);
let banAddLog2 = guild.channels.cache.get(banAddLog1);

const fetchedLogs = await guild.fetchAuditLogs({
  limit: 1,
  type: AuditLogEvent.MemberBanAdd
});

const banAddLog = fetchedLogs.entries.first();
const banner = banAddLog ? banAddLog.executor : null;
const bannerUsername = banner ? `\`\`\`${banner.username} (${banner.id})\`\`\`` : `\`\`\`UNKNOWN\`\`\``;


let banAddEmbed = new EmbedBuilder()
  .setTitle('**تم حظر عضو**')
  .addFields(
    { name: 'العضو المحظور:', value: `\`\`\`${user.tag} (${user.id})\`\`\`` },
    { name: 'تم حظره بواسطة:', value: bannerUsername },
  )
  .setTimestamp();

banAddLog2.send({ embeds: [banAddEmbed] });
}
});




client27.on('guildBanRemove', async (guild, user) => {
if (logsDB.has(`log_bandelete_${guild.id}`)) {
let banRemoveLog1 = logsDB.get(`log_bandelete_${guild.id}`);
let banRemoveLog2 = guild.channels.cache.get(banRemoveLog1);

const fetchedLogs = await guild.fetchAuditLogs({
  limit: 1,
  type: AuditLogEvent.MemberBanRemove
});

const banRemoveLog = fetchedLogs.entries.first();
const unbanner = banRemoveLog ? banRemoveLog.executor : null;
const unbannerUsername = unbanner ? `\`\`\`${unbanner.username} (${unbanner.id})\`\`\`` : `\`\`\`UNKNOWN\`\`\``;

let banRemoveEmbed = new EmbedBuilder()
  .setTitle('**تم إزالة حظر عضو**')
  .addFields(
    { name: 'العضو المفكّر الحظر عنه:', value: `\`\`\`${user.tag} (${user.id})\`\`\`` },
    { name: 'تم إزالة الحظر بواسطة:', value: unbannerUsername }
  )
  .setTimestamp();


banRemoveLog2.send({ embeds: [banRemoveEmbed] });
}
});


client27.on('guildMemberRemove', async (member) => {
const guild = member.guild;
if (logsDB.has(`log_kickadd_${guild.id}`)) {
const kickLogChannelId = logsDB.get(`log_kickadd_${guild.id}`);
const kickLogChannel = guild.channels.cache.get(kickLogChannelId);

const fetchedLogs = await guild.fetchAuditLogs({
  limit: 1,
  type: AuditLogEvent.MemberKick,
});

const kickLog = fetchedLogs.entries.first();
const kicker = kickLog ? kickLog.executor : null;
const kickerUsername = kicker ? `\`\`\`${kicker.username} (${kicker.id})\`\`\`` : 'Unknown';

const kickEmbed = new EmbedBuilder()
  .setTitle('**تم طرد عضو**')
  .addFields(
    { name: 'العضو المطرود:', value: `\`\`\`${member.user.tag} (${member.user.id})\`\`\`` },
    { name: 'تم طرده بواسطة:', value: kickerUsername },
  )
  .setTimestamp();

kickLogChannel.send({ embeds: [kickEmbed] });
}
});

let invites = {}; 
const getInviteCounts = async (guild) => {
    return new Map(guild.invites.cache.map(invite => [invite.code, invite.uses]));
};

client27.on('inviteCreate', async invite => {
    if (!invites[invite.guild.id]) {
        invites[invite.guild.id] = new Map();
    }
    invites[invite.guild.id].set(invite.code, invite.uses);
});

client27.on('inviteDelete', async invite => {
    if (invites[invite.guild.id]) {
        invites[invite.guild.id].delete(invite.code);
    }
});

client27.on('guildMemberAdd', async member => {
    try {
        const welcomeChannelId = await systemDB.get(`welcome_channel_${member.guild.id}`);
        const welcomeRoleId = await systemDB.get(`welcome_role_${member.guild.id}`);
        const welcomeImage = await systemDB.get(`welcome_image_${member.guild.id}`);

        if (welcomeRoleId) {
            const role = member.guild.roles.cache.get(welcomeRoleId);
            if (role) {
                await member.roles.add(role);
            }
        }

        const newInvites = await member.guild.invites.fetch();
        const oldInvites = invites[member.guild.id] || new Map();

        const usedInvite = newInvites.find(inv => {
            const prevUses = oldInvites.get(inv.code) || 0;
            return inv.uses > prevUses;
        });

        let inviterMention = 'Unknown';
        if (usedInvite && usedInvite.inviter) {
            inviterMention = `<@${usedInvite.inviter.id}>`;
        }

        const fullUser = await client27.users.fetch(member.user.id, { force: true });

        const welcomeEmbed = new EmbedBuilder()
            .setAuthor({ name: member.guild.name, iconURL: member.guild.iconURL({ dynamic: true }) })
            .setFooter({ text: member.guild.name, iconURL: member.guild.iconURL({ dynamic: true }) })
            .setColor('#787575')
            .setTitle('Welcome to the Server!')
            .setDescription(`Hello ${member}, welcome to **${member.guild.name}**! Enjoy your stay.`)
            .addFields(
                { name: 'Username', value: member.user.tag, inline: true },
                { name: 'Invited By', value: inviterMention, inline: true },
                { name: 'Invite Used', value: usedInvite ? `||${usedInvite.code}||` : 'Direct Join', inline: true },
                { name: 'You\'re Member', value: `${member.guild.memberCount}`, inline: true }
            )
            .setThumbnail(member.user.displayAvatarURL())
            .setTimestamp();
        
        if (welcomeImage) {
            welcomeEmbed.setImage(welcomeImage);
        }

        const welcomeChannel = member.guild.channels.cache.get(welcomeChannelId);
        if (welcomeChannel) {
            await welcomeChannel.send({ embeds: [welcomeEmbed] });
        }

        invites[member.guild.id] = new Map(newInvites.map(invite => [invite.code, invite.uses]));
    } catch (error) {
        console.error('Error handling guildMemberAdd event:', error);
    }
});


client27.on("guildMemberAdd" , async(member) => {
  const theeGuild = member.guild
  let rooms = nadekoDB.get(`rooms_${theeGuild.id}`)
  const message = nadekoDB.get(`message_${theeGuild.id}`)
  if(!rooms) return;
  if(rooms.length <= 0) return;
  if(!message) return;
  await rooms.forEach(async(room) => {
    const theRoom = await theeGuild.channels.cache.find(ch => ch.id == room)
    if(!theRoom) return;
    await theRoom.send({content:`${member} - ${message}`}).then(async(msg) => {
      setTimeout(() => {
        msg.delete();
      }, 3000);
    })
  })
})

  client27.on("messageCreate" ,  async(message) => {
    if(message.author.bot) return;
    const autoReplys = one4allDB.get(`replys_${message.guild.id}`);
    if(!autoReplys) return;
    const data = autoReplys.find((r) => r.word == message.content);
    if(!data) return;
    message.reply(`${data.reply}`)
  })



  client27.on("interactionCreate" , async(interaction) => {
    /**
     * @desc : TAX COMMANDS
     */
    if(interaction.customId === "help_tax"){
      const embed = new EmbedBuilder()
          .setAuthor({name : interaction.guild.name , iconURL : interaction.guild.iconURL({dynamic : true})})
          .setTitle('قائمة اوامر البوت')
          .addFields(
            {name : `\`/set-tax-room\`` , value : `لتحديد روم الضريبة التلقائية`},
            {name : `\`/set-tax-line\`` , value : `لتحديد الخط`},
            {name : `\`/tax-mode\`` , value : `لتحديد شكل الضريبة`},
            {name : `\`/tax\` | \`${prefix}tax\`` , value : `لحساب ضريبة بروبوت اي مبلغ تريده`}
          )
          .setTimestamp()
          .setFooter({text : `Requested By ${interaction.user.username}` , iconURL : interaction.user.displayAvatarURL({dynamic : true})})
          .setColor('DarkButNotBlack');
          const btns1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('help_tax').setLabel('ضريبة').setStyle(ButtonStyle.Secondary).setEmoji('💰').setDisabled(true),
            new ButtonBuilder().setCustomId('help_autoline').setLabel('خط تلقائي').setStyle(ButtonStyle.Secondary).setEmoji('🤖'),
            new ButtonBuilder().setCustomId('help_suggestion').setLabel('اقتراحات').setStyle(ButtonStyle.Secondary).setEmoji('💡'),
            new ButtonBuilder().setCustomId('help_feedback').setLabel('اراء').setStyle(ButtonStyle.Secondary).setEmoji('💭'),
            new ButtonBuilder().setCustomId('help_system').setLabel('سيستم').setStyle(ButtonStyle.Secondary).setEmoji('⚙️'),
        )

        const btns2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('help_ticket').setLabel('تكت').setStyle(ButtonStyle.Secondary).setEmoji('🎫'),
            new ButtonBuilder().setCustomId('help_giveaway').setLabel('جيف اوي').setStyle(ButtonStyle.Secondary).setEmoji('🎁'),
            new ButtonBuilder().setCustomId('help_protection').setLabel('حماية').setStyle(ButtonStyle.Secondary).setEmoji('🛡️'),
            new ButtonBuilder().setCustomId('help_logs').setLabel('لوج').setStyle(ButtonStyle.Secondary).setEmoji('📜'),
            new ButtonBuilder().setCustomId('help_apply').setLabel('تقديمات').setStyle(ButtonStyle.Secondary).setEmoji('📝'),
        )

        const btns3 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('help_broadcast').setLabel('برودكاست').setStyle(ButtonStyle.Secondary).setEmoji('📢'),
            new ButtonBuilder().setCustomId('help_nadeko').setLabel('ناديكو').setStyle(ButtonStyle.Secondary).setEmoji('⏳'),
            new ButtonBuilder().setCustomId('help_autoreply').setLabel('رد تلقائي').setStyle(ButtonStyle.Secondary).setEmoji('💎'),
            new ButtonBuilder().setCustomId('help_autorole').setLabel('رتب تلقائية').setStyle(ButtonStyle.Secondary).setEmoji('⚡'),
        )

        await interaction.update({embeds : [embed] , components : [btns1 , btns2 , btns3]});
    }else 
    /**
     * @desc : AUTOLINE COMMANDS
     */
    if(interaction.customId === "help_autoline"){
      const embed = new EmbedBuilder()
      .setAuthor({name : interaction.guild.name , iconURL : interaction.guild.iconURL({dynamic : true})})
      .setTitle('قائمة اوامر البوت')
      .addFields(
        {name : `\`/set-autoline-line\`` , value : `لتحديد الخط`},
        {name : `\`/add-autoline-channel\`` , value : `لاضافة روم خط تلقائي`},
        {name : `\`/remove-autoline-channel\`` , value : `لازالة روم خط تلقائي`},
        {name : `\`/line-mode\`` , value : `تحديد طريقة ارسال الخط`},
        {name : `\`خط\` | \`-\`` , value : `لارسال خط`},
      )
      .setTimestamp()
      .setFooter({text : `Requested By ${interaction.user.username}` , iconURL : interaction.user.displayAvatarURL({dynamic : true})})
      .setColor('DarkButNotBlack');
      const btns1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('help_tax').setLabel('ضريبة').setStyle(ButtonStyle.Secondary).setEmoji('💰'),
        new ButtonBuilder().setCustomId('help_autoline').setLabel('خط تلقائي').setStyle(ButtonStyle.Secondary).setEmoji('🤖').setDisabled(true),
        new ButtonBuilder().setCustomId('help_suggestion').setLabel('اقتراحات').setStyle(ButtonStyle.Secondary).setEmoji('💡'),
        new ButtonBuilder().setCustomId('help_feedback').setLabel('اراء').setStyle(ButtonStyle.Secondary).setEmoji('💭'),
        new ButtonBuilder().setCustomId('help_system').setLabel('سيستم').setStyle(ButtonStyle.Secondary).setEmoji('⚙️'),
    )

    const btns2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('help_ticket').setLabel('تكت').setStyle(ButtonStyle.Secondary).setEmoji('🎫'),
        new ButtonBuilder().setCustomId('help_giveaway').setLabel('جيف اوي').setStyle(ButtonStyle.Secondary).setEmoji('🎁'),
        new ButtonBuilder().setCustomId('help_protection').setLabel('حماية').setStyle(ButtonStyle.Secondary).setEmoji('🛡️'),
        new ButtonBuilder().setCustomId('help_logs').setLabel('لوج').setStyle(ButtonStyle.Secondary).setEmoji('📜'),
        new ButtonBuilder().setCustomId('help_apply').setLabel('تقديمات').setStyle(ButtonStyle.Secondary).setEmoji('📝'),
    )

    const btns3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('help_broadcast').setLabel('برودكاست').setStyle(ButtonStyle.Secondary).setEmoji('📢'),
        new ButtonBuilder().setCustomId('help_nadeko').setLabel('ناديكو').setStyle(ButtonStyle.Secondary).setEmoji('⏳'),
        new ButtonBuilder().setCustomId('help_autoreply').setLabel('رد تلقائي').setStyle(ButtonStyle.Secondary).setEmoji('💎'),
        new ButtonBuilder().setCustomId('help_autorole').setLabel('رتب تلقائية').setStyle(ButtonStyle.Secondary).setEmoji('⚡'),
    )

    await interaction.update({embeds : [embed] , components : [btns1 , btns2 , btns3]});
    }else 
    /**
     * @desc : SUGGESTION COMMANDS
     */
    if(interaction.customId === "help_suggestion"){
      const embed = new EmbedBuilder()
      .setAuthor({name : interaction.guild.name , iconURL : interaction.guild.iconURL({dynamic : true})})
      .setTitle('قائمة اوامر البوت')
      .addFields(
        {name : `\`/set-suggestions-line\`` , value : `لتحديد خط الاقتراحات`},
        {name : `\`/set-suggestions-room\`` , value : `لتحديد روم الاقتراحات`},
        {name : `\`/suggestions-mode\`` , value : `لتحديد شكل الاقتراحات`},
      )
      .setTimestamp()
      .setFooter({text : `Requested By ${interaction.user.username}` , iconURL : interaction.user.displayAvatarURL({dynamic : true})})
      .setColor('DarkButNotBlack');
      const btns1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('help_tax').setLabel('ضريبة').setStyle(ButtonStyle.Secondary).setEmoji('💰'),
        new ButtonBuilder().setCustomId('help_autoline').setLabel('خط تلقائي').setStyle(ButtonStyle.Secondary).setEmoji('🤖'),
        new ButtonBuilder().setCustomId('help_suggestion').setLabel('اقتراحات').setStyle(ButtonStyle.Secondary).setEmoji('💡').setDisabled(true),
        new ButtonBuilder().setCustomId('help_feedback').setLabel('اراء').setStyle(ButtonStyle.Secondary).setEmoji('💭'),
        new ButtonBuilder().setCustomId('help_system').setLabel('سيستم').setStyle(ButtonStyle.Secondary).setEmoji('⚙️'),
    )

    const btns2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('help_ticket').setLabel('تكت').setStyle(ButtonStyle.Secondary).setEmoji('🎫'),
        new ButtonBuilder().setCustomId('help_giveaway').setLabel('جيف اوي').setStyle(ButtonStyle.Secondary).setEmoji('🎁'),
        new ButtonBuilder().setCustomId('help_protection').setLabel('حماية').setStyle(ButtonStyle.Secondary).setEmoji('🛡️'),
        new ButtonBuilder().setCustomId('help_logs').setLabel('لوج').setStyle(ButtonStyle.Secondary).setEmoji('📜'),
        new ButtonBuilder().setCustomId('help_apply').setLabel('تقديمات').setStyle(ButtonStyle.Secondary).setEmoji('📝'),
    )

    const btns3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('help_broadcast').setLabel('برودكاست').setStyle(ButtonStyle.Secondary).setEmoji('📢'),
        new ButtonBuilder().setCustomId('help_nadeko').setLabel('ناديكو').setStyle(ButtonStyle.Secondary).setEmoji('⏳'),
        new ButtonBuilder().setCustomId('help_autoreply').setLabel('رد تلقائي').setStyle(ButtonStyle.Secondary).setEmoji('💎'),
        new ButtonBuilder().setCustomId('help_autorole').setLabel('رتب تلقائية').setStyle(ButtonStyle.Secondary).setEmoji('⚡'),
    )

    await interaction.update({embeds : [embed] , components : [btns1 , btns2 , btns3]});
    }else 
    /**
     * @desc : FEEDBACK COMMANDS
    */
    if(interaction.customId === "help_feedback"){
      const embed = new EmbedBuilder()
      .setAuthor({name : interaction.guild.name , iconURL : interaction.guild.iconURL({dynamic : true})})
      .setTitle('قائمة اوامر البوت')
      .addFields(
        {name : `\`/set-feedback-line\`` , value : `لتحديد خط الاراء`},
        {name : `\`/set-feedback-room\`` , value : `لتحديد روم الاراء`},
        {name : `\`/feedback-mode\`` , value : `امبد أو رياكشن فقط`},
        {name : `\`/setup-rating\`` , value : `لتسطيب نظام تقييم الاداريين`},
        {name : `\`${prefix}تقييم\`` , value : `طلب تقييم`},
      )
      .setTimestamp()
      .setFooter({text : `Requested By ${interaction.user.username}` , iconURL : interaction.user.displayAvatarURL({dynamic : true})})
      .setColor('DarkButNotBlack');
      const btns1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('help_tax').setLabel('ضريبة').setStyle(ButtonStyle.Secondary).setEmoji('💰'),
        new ButtonBuilder().setCustomId('help_autoline').setLabel('خط تلقائي').setStyle(ButtonStyle.Secondary).setEmoji('🤖'),
        new ButtonBuilder().setCustomId('help_suggestion').setLabel('اقتراحات').setStyle(ButtonStyle.Secondary).setEmoji('💡'),
        new ButtonBuilder().setCustomId('help_feedback').setLabel('اراء').setStyle(ButtonStyle.Secondary).setEmoji('💭').setDisabled(true),
        new ButtonBuilder().setCustomId('help_system').setLabel('سيستم').setStyle(ButtonStyle.Secondary).setEmoji('⚙️'),
    )

    const btns2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('help_ticket').setLabel('تكت').setStyle(ButtonStyle.Secondary).setEmoji('🎫'),
        new ButtonBuilder().setCustomId('help_giveaway').setLabel('جيف اوي').setStyle(ButtonStyle.Secondary).setEmoji('🎁'),
        new ButtonBuilder().setCustomId('help_protection').setLabel('حماية').setStyle(ButtonStyle.Secondary).setEmoji('🛡️'),
        new ButtonBuilder().setCustomId('help_logs').setLabel('لوج').setStyle(ButtonStyle.Secondary).setEmoji('📜'),
        new ButtonBuilder().setCustomId('help_apply').setLabel('تقديمات').setStyle(ButtonStyle.Secondary).setEmoji('📝'),
    )

    const btns3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('help_broadcast').setLabel('برودكاست').setStyle(ButtonStyle.Secondary).setEmoji('📢'),
        new ButtonBuilder().setCustomId('help_nadeko').setLabel('ناديكو').setStyle(ButtonStyle.Secondary).setEmoji('⏳'),
        new ButtonBuilder().setCustomId('help_autoreply').setLabel('رد تلقائي').setStyle(ButtonStyle.Secondary).setEmoji('💎'),
        new ButtonBuilder().setCustomId('help_autorole').setLabel('رتب تلقائية').setStyle(ButtonStyle.Secondary).setEmoji('⚡'),
    )

    await interaction.update({embeds : [embed] , components : [btns1 , btns2 , btns3]});
    }else 
    /**
     * @desc : SYSTEM COMMANDS
    */
    if(interaction.customId === "help_system"){
      const embed = new EmbedBuilder()
      .setAuthor({name : interaction.guild.name , iconURL : interaction.guild.iconURL({dynamic : true})})
      .setTitle('قائمة اوامر البوت')
      .addFields(
        {name : `\`/avatar\`` , value : `لرؤية افتارك او فتار شخص اخر`},
        {name : `\`/server\` | \`${prefix}server\`` , value : `لرؤية معلومات السرفر`},
        {name : `\`/user\`` , value : `لرؤية معلومات حسابك او حساب شخص اخر`},
        {name : `\`/banner\`` , value : `لرؤية بانرك او بانر شخص اخر`},
        {name : `\`/setup-welcome\`` , value : `تسطيب نظام الترحيب`},
        {name : `\`/add-info-button\`` , value : `اضافة زر معلومات`},
        {name : `\`/ban\`` , value : `لاعطاء باند لشخص او ازالته`},
        {name : `\`/clear\` | \`${prefix}clear\`` , value : `لحذف عدد من الرسائل`},
        {name : `\`/come\` | \`${prefix}come\`` , value : `لاستدعاء شخص`},
        {name : `\`/embed\`` , value : `لقول كلام في ايمبد`},
        {name : `\`/hide\` | \`${prefix}hide\`` , value : `لاخفاء روم`},
        {name : `\`/kick\`` , value : `لاعطاء طرد لشخص او ازالته`},
        {name : `\`/lock\` | \`${prefix}lock\`` , value : `لقفل روم`},
        {name : `\`/nickname\`` , value : `اعطاء اسم مستعار لشخص او ازالته`},
        {name : `\`/mute\`` , value : `لاعطاء ميوت لشخص او ازالته`},
        {name : `\`/role\`` , value : `لاعطاء رتبة لشخص او ازالتها`},
        {name : `\`/roles\`` , value : `للاستعلام عن رتب السيرفر`},
        {name : `\`/say\` | \`${prefix}say\`` , value : `لقول كلام`},
        {name : `\`/send\`` , value : `لارسال رسالة لشخص ما`},
        {name : `\`/timeout\`` , value : `لاعطاء تايم اوت لشخص او ازالته`},
        {name : `\`/unhide\` | \`${prefix}unhide\`` , value : `لاظهار روم`},
        {name : `\`/unlock\` | \`${prefix}unlock\`` , value : `لفتح روم`},
      )
      .setTimestamp()
      .setFooter({text : `Requested By ${interaction.user.username}` , iconURL : interaction.user.displayAvatarURL({dynamic : true})})
      .setColor('DarkButNotBlack');
      const btns1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('help_tax').setLabel('ضريبة').setStyle(ButtonStyle.Secondary).setEmoji('💰'),
        new ButtonBuilder().setCustomId('help_autoline').setLabel('خط تلقائي').setStyle(ButtonStyle.Secondary).setEmoji('🤖'),
        new ButtonBuilder().setCustomId('help_suggestion').setLabel('اقتراحات').setStyle(ButtonStyle.Secondary).setEmoji('💡'),
        new ButtonBuilder().setCustomId('help_feedback').setLabel('اراء').setStyle(ButtonStyle.Secondary).setEmoji('💭'),
        new ButtonBuilder().setCustomId('help_system').setLabel('سيستم').setStyle(ButtonStyle.Secondary).setEmoji('⚙️').setDisabled(true),
    )

    const btns2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('help_ticket').setLabel('تكت').setStyle(ButtonStyle.Secondary).setEmoji('🎫'),
        new ButtonBuilder().setCustomId('help_giveaway').setLabel('جيف اوي').setStyle(ButtonStyle.Secondary).setEmoji('🎁'),
        new ButtonBuilder().setCustomId('help_protection').setLabel('حماية').setStyle(ButtonStyle.Secondary).setEmoji('🛡️'),
        new ButtonBuilder().setCustomId('help_logs').setLabel('لوج').setStyle(ButtonStyle.Secondary).setEmoji('📜'),
        new ButtonBuilder().setCustomId('help_apply').setLabel('تقديمات').setStyle(ButtonStyle.Secondary).setEmoji('📝'),
    )

    const btns3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('help_broadcast').setLabel('برودكاست').setStyle(ButtonStyle.Secondary).setEmoji('📢'),
        new ButtonBuilder().setCustomId('help_nadeko').setLabel('ناديكو').setStyle(ButtonStyle.Secondary).setEmoji('⏳'),
        new ButtonBuilder().setCustomId('help_autoreply').setLabel('رد تلقائي').setStyle(ButtonStyle.Secondary).setEmoji('💎'),
        new ButtonBuilder().setCustomId('help_autorole').setLabel('رتب تلقائية').setStyle(ButtonStyle.Secondary).setEmoji('⚡'),
    )

    await interaction.update({embeds : [embed] , components : [btns1 , btns2 , btns3]});
    }else 
    /**
     * @desc : TICKET COMMANDS
    */
    if(interaction.customId === "help_ticket"){
      const embed = new EmbedBuilder()
      .setAuthor({name : interaction.guild.name , iconURL : interaction.guild.iconURL({dynamic : true})})
      .setTitle('قائمة اوامر البوت')
      .addFields(
        {name : `\`/setup-ticket\`` , value : `لانشاء تكت جديد`},
        {name : `\`/add-ticket-button\`` , value : `لاضافة زر للتكت`},
        {name : `\`/to-select\`` , value : `لتحويل التكت الى سلكت منيو`},
        {name : `\`/set-ticket-log\`` , value : `لتحديد رومات اللوغ`},
        {name : `\`/add-user\`` , value : `لاضافة شخص للتكت`},
        {name : `\`/remove-user\`` , value : `لازالة شخص من التكت`},
        {name : `\`/rename\`` , value : `لتغيير اسم التكت`},
        {name : `\`/close\` | \`${prefix}close\`` , value : `لاغلاق التكت`},
        {name : `\`/delete\` | \`${prefix}delete\`` , value : `لحذف التكت`},
      )
      .setTimestamp()
      .setFooter({text : `Requested By ${interaction.user.username}` , iconURL : interaction.user.displayAvatarURL({dynamic : true})})
      .setColor('DarkButNotBlack');
      const btns1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('help_tax').setLabel('ضريبة').setStyle(ButtonStyle.Secondary).setEmoji('💰'),
        new ButtonBuilder().setCustomId('help_autoline').setLabel('خط تلقائي').setStyle(ButtonStyle.Secondary).setEmoji('🤖'),
        new ButtonBuilder().setCustomId('help_suggestion').setLabel('اقتراحات').setStyle(ButtonStyle.Secondary).setEmoji('💡'),
        new ButtonBuilder().setCustomId('help_feedback').setLabel('اراء').setStyle(ButtonStyle.Secondary).setEmoji('💭'),
        new ButtonBuilder().setCustomId('help_system').setLabel('سيستم').setStyle(ButtonStyle.Secondary).setEmoji('⚙️'),
    )

    const btns2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('help_ticket').setLabel('تكت').setStyle(ButtonStyle.Secondary).setEmoji('🎫').setDisabled(true),
        new ButtonBuilder().setCustomId('help_giveaway').setLabel('جيف اوي').setStyle(ButtonStyle.Secondary).setEmoji('🎁'),
        new ButtonBuilder().setCustomId('help_protection').setLabel('حماية').setStyle(ButtonStyle.Secondary).setEmoji('🛡️'),
        new ButtonBuilder().setCustomId('help_logs').setLabel('لوج').setStyle(ButtonStyle.Secondary).setEmoji('📜'),
        new ButtonBuilder().setCustomId('help_apply').setLabel('تقديمات').setStyle(ButtonStyle.Secondary).setEmoji('📝'),
    )

    const btns3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('help_broadcast').setLabel('برودكاست').setStyle(ButtonStyle.Secondary).setEmoji('📢'),
        new ButtonBuilder().setCustomId('help_nadeko').setLabel('ناديكو').setStyle(ButtonStyle.Secondary).setEmoji('⏳'),
        new ButtonBuilder().setCustomId('help_autoreply').setLabel('رد تلقائي').setStyle(ButtonStyle.Secondary).setEmoji('💎'),
        new ButtonBuilder().setCustomId('help_autorole').setLabel('رتب تلقائية').setStyle(ButtonStyle.Secondary).setEmoji('⚡'),
    )

    await interaction.update({embeds : [embed] , components : [btns1 , btns2 , btns3]});
    }else 
    /**
     * @desc : GIVEAWAY COMMANDS
    */
    if(interaction.customId === "help_giveaway"){
      const embed = new EmbedBuilder()
      .setAuthor({name : interaction.guild.name , iconURL : interaction.guild.iconURL({dynamic : true})})
      .setTitle('قائمة اوامر البوت')
      .addFields(
        {name : `\`/gstart\`` , value : `لبدا جيف اوي`},
        {name : `\`/gend\`` , value : `لانهاء جيف اوي`},
        {name : `\`/greroll\`` , value : `لاعادة الفائزين في جيف اوي`},
      )
      .setTimestamp()
      .setFooter({text : `Requested By ${interaction.user.username}` , iconURL : interaction.user.displayAvatarURL({dynamic : true})})
      .setColor('DarkButNotBlack');
      const btns1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('help_tax').setLabel('ضريبة').setStyle(ButtonStyle.Secondary).setEmoji('💰'),
        new ButtonBuilder().setCustomId('help_autoline').setLabel('خط تلقائي').setStyle(ButtonStyle.Secondary).setEmoji('🤖'),
        new ButtonBuilder().setCustomId('help_suggestion').setLabel('اقتراحات').setStyle(ButtonStyle.Secondary).setEmoji('💡'),
        new ButtonBuilder().setCustomId('help_feedback').setLabel('اراء').setStyle(ButtonStyle.Secondary).setEmoji('💭'),
        new ButtonBuilder().setCustomId('help_system').setLabel('سيستم').setStyle(ButtonStyle.Secondary).setEmoji('⚙️'),
    )

    const btns2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('help_ticket').setLabel('تكت').setStyle(ButtonStyle.Secondary).setEmoji('🎫'),
        new ButtonBuilder().setCustomId('help_giveaway').setLabel('جيف اوي').setStyle(ButtonStyle.Secondary).setEmoji('🎁').setDisabled(true),
        new ButtonBuilder().setCustomId('help_protection').setLabel('حماية').setStyle(ButtonStyle.Secondary).setEmoji('🛡️'),
        new ButtonBuilder().setCustomId('help_logs').setLabel('لوج').setStyle(ButtonStyle.Secondary).setEmoji('📜'),
        new ButtonBuilder().setCustomId('help_apply').setLabel('تقديمات').setStyle(ButtonStyle.Secondary).setEmoji('📝'),
    )

    const btns3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('help_broadcast').setLabel('برودكاست').setStyle(ButtonStyle.Secondary).setEmoji('📢'),
        new ButtonBuilder().setCustomId('help_nadeko').setLabel('ناديكو').setStyle(ButtonStyle.Secondary).setEmoji('⏳'),
        new ButtonBuilder().setCustomId('help_autoreply').setLabel('رد تلقائي').setStyle(ButtonStyle.Secondary).setEmoji('💎'),
        new ButtonBuilder().setCustomId('help_autorole').setLabel('رتب تلقائية').setStyle(ButtonStyle.Secondary).setEmoji('⚡'),
    )

    await interaction.update({embeds : [embed] , components : [btns1 , btns2 , btns3]});
    }else 
        /**
     * @desc : PROTECTION COMMANDS
    */
    if(interaction.customId === "help_protection"){
      const embed = new EmbedBuilder()
      .setAuthor({name : interaction.guild.name , iconURL : interaction.guild.iconURL({dynamic : true})})
      .setTitle('قائمة اوامر البوت')
      .addFields(
        {name : `\`/anti-ban\`` , value : `لتسطيب نظام الحماية من الباند`},
        {name : `\`/anti-bots\`` , value : `لتسطيب نظام الحماية من البوتات`},
        {name : `\`/anti-delete-roles\`` , value : `لتسطيب نظام الحماية من حذف الرتب`},
        {name : `\`/anti-delete-rooms\`` , value : `لتسطيب نظام الحماية من حذف الرومات`},
        {name : `\`/protection-status\`` , value : `للاستعلام عن حالة نظام الحماية`},
        {name : `\`/set-protect-logs\`` , value : `لتحديد روم لوج الحماية`},
      )
      .setTimestamp()
      .setFooter({text : `Requested By ${interaction.user.username}` , iconURL : interaction.user.displayAvatarURL({dynamic : true})})
      .setColor('DarkButNotBlack');
      const btns1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('help_tax').setLabel('ضريبة').setStyle(ButtonStyle.Secondary).setEmoji('💰'),
        new ButtonBuilder().setCustomId('help_autoline').setLabel('خط تلقائي').setStyle(ButtonStyle.Secondary).setEmoji('🤖'),
        new ButtonBuilder().setCustomId('help_suggestion').setLabel('اقتراحات').setStyle(ButtonStyle.Secondary).setEmoji('💡'),
        new ButtonBuilder().setCustomId('help_feedback').setLabel('اراء').setStyle(ButtonStyle.Secondary).setEmoji('💭'),
        new ButtonBuilder().setCustomId('help_system').setLabel('سيستم').setStyle(ButtonStyle.Secondary).setEmoji('⚙️'),
    )

    const btns2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('help_ticket').setLabel('تكت').setStyle(ButtonStyle.Secondary).setEmoji('🎫'),
        new ButtonBuilder().setCustomId('help_giveaway').setLabel('جيف اوي').setStyle(ButtonStyle.Secondary).setEmoji('🎁'),
        new ButtonBuilder().setCustomId('help_protection').setLabel('حماية').setStyle(ButtonStyle.Secondary).setEmoji('🛡️').setDisabled(true),
        new ButtonBuilder().setCustomId('help_logs').setLabel('لوج').setStyle(ButtonStyle.Secondary).setEmoji('📜'),
        new ButtonBuilder().setCustomId('help_apply').setLabel('تقديمات').setStyle(ButtonStyle.Secondary).setEmoji('📝'),
    )

    const btns3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('help_broadcast').setLabel('برودكاست').setStyle(ButtonStyle.Secondary).setEmoji('📢'),
        new ButtonBuilder().setCustomId('help_nadeko').setLabel('ناديكو').setStyle(ButtonStyle.Secondary).setEmoji('⏳'),
        new ButtonBuilder().setCustomId('help_autoreply').setLabel('رد تلقائي').setStyle(ButtonStyle.Secondary).setEmoji('💎'),
        new ButtonBuilder().setCustomId('help_autorole').setLabel('رتب تلقائية').setStyle(ButtonStyle.Secondary).setEmoji('⚡'),
    )

    await interaction.update({embeds : [embed] , components : [btns1 , btns2 , btns3]});
    }else 
            /**
     * @desc : LOGS COMMANDS
    */
    if(interaction.customId === "help_logs"){
      const embed = new EmbedBuilder()
      .setAuthor({name : interaction.guild.name , iconURL : interaction.guild.iconURL({dynamic : true})})
      .setTitle('قائمة اوامر البوت')
      .addFields(
        {name : `\`/logs-info\`` , value : `لمعرفة معلومات نظام اللوج في السيرفر`},
        {name : `\`/setup-logs\`` , value : `لتسطيب نظام اللوج في السيرفر`},
      )
      .setTimestamp()
      .setFooter({text : `Requested By ${interaction.user.username}` , iconURL : interaction.user.displayAvatarURL({dynamic : true})})
      .setColor('DarkButNotBlack');
      const btns1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('help_tax').setLabel('ضريبة').setStyle(ButtonStyle.Secondary).setEmoji('💰'),
        new ButtonBuilder().setCustomId('help_autoline').setLabel('خط تلقائي').setStyle(ButtonStyle.Secondary).setEmoji('🤖'),
        new ButtonBuilder().setCustomId('help_suggestion').setLabel('اقتراحات').setStyle(ButtonStyle.Secondary).setEmoji('💡'),
        new ButtonBuilder().setCustomId('help_feedback').setLabel('اراء').setStyle(ButtonStyle.Secondary).setEmoji('💭'),
        new ButtonBuilder().setCustomId('help_system').setLabel('سيستم').setStyle(ButtonStyle.Secondary).setEmoji('⚙️'),
    )

    const btns2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('help_ticket').setLabel('تكت').setStyle(ButtonStyle.Secondary).setEmoji('🎫'),
        new ButtonBuilder().setCustomId('help_giveaway').setLabel('جيف اوي').setStyle(ButtonStyle.Secondary).setEmoji('🎁'),
        new ButtonBuilder().setCustomId('help_protection').setLabel('حماية').setStyle(ButtonStyle.Secondary).setEmoji('🛡️'),
        new ButtonBuilder().setCustomId('help_logs').setLabel('لوج').setStyle(ButtonStyle.Secondary).setEmoji('📜').setDisabled(true),
        new ButtonBuilder().setCustomId('help_apply').setLabel('تقديمات').setStyle(ButtonStyle.Secondary).setEmoji('📝'),
    )

    const btns3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('help_broadcast').setLabel('برودكاست').setStyle(ButtonStyle.Secondary).setEmoji('📢'),
        new ButtonBuilder().setCustomId('help_nadeko').setLabel('ناديكو').setStyle(ButtonStyle.Secondary).setEmoji('⏳'),
        new ButtonBuilder().setCustomId('help_autoreply').setLabel('رد تلقائي').setStyle(ButtonStyle.Secondary).setEmoji('💎'),
        new ButtonBuilder().setCustomId('help_autorole').setLabel('رتب تلقائية').setStyle(ButtonStyle.Secondary).setEmoji('⚡'),
    )

    await interaction.update({embeds : [embed] , components : [btns1 , btns2 , btns3]});
    }else 
    /**
     * @desc : APPLY COMMANDS
    */
    if(interaction.customId === "help_apply"){
      const embed = new EmbedBuilder()
      .setAuthor({name : interaction.guild.name , iconURL : interaction.guild.iconURL({dynamic : true})})
      .setTitle('قائمة اوامر البوت')
      .addFields(
        {name : `\`/setup-apply\`` , value : `لتسطيب نظام التقديم`},
        {name : `\`/new-apply\`` , value : `لانشاء تقديم جديد`},
        {name : `\`/dm-mode\`` , value : `لارسال رسالة لخاص المتقدم عند الرفض او القبول`},
        {name : `\`/close-apply\`` , value : `لانهاء التقديم المفتوح`},
      )
      .setTimestamp()
      .setFooter({text : `Requested By ${interaction.user.username}` , iconURL : interaction.user.displayAvatarURL({dynamic : true})})
      .setColor('DarkButNotBlack');
      const btns1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('help_tax').setLabel('ضريبة').setStyle(ButtonStyle.Secondary).setEmoji('💰'),
        new ButtonBuilder().setCustomId('help_autoline').setLabel('خط تلقائي').setStyle(ButtonStyle.Secondary).setEmoji('🤖'),
        new ButtonBuilder().setCustomId('help_suggestion').setLabel('اقتراحات').setStyle(ButtonStyle.Secondary).setEmoji('💡'),
        new ButtonBuilder().setCustomId('help_feedback').setLabel('اراء').setStyle(ButtonStyle.Secondary).setEmoji('💭'),
        new ButtonBuilder().setCustomId('help_system').setLabel('سيستم').setStyle(ButtonStyle.Secondary).setEmoji('⚙️'),
    )

    const btns2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('help_ticket').setLabel('تكت').setStyle(ButtonStyle.Secondary).setEmoji('🎫'),
        new ButtonBuilder().setCustomId('help_giveaway').setLabel('جيف اوي').setStyle(ButtonStyle.Secondary).setEmoji('🎁'),
        new ButtonBuilder().setCustomId('help_protection').setLabel('حماية').setStyle(ButtonStyle.Secondary).setEmoji('🛡️'),
        new ButtonBuilder().setCustomId('help_logs').setLabel('لوج').setStyle(ButtonStyle.Secondary).setEmoji('📜'),
        new ButtonBuilder().setCustomId('help_apply').setLabel('تقديمات').setStyle(ButtonStyle.Secondary).setEmoji('📝').setDisabled(true),
    )

    const btns3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('help_broadcast').setLabel('برودكاست').setStyle(ButtonStyle.Secondary).setEmoji('📢'),
        new ButtonBuilder().setCustomId('help_nadeko').setLabel('ناديكو').setStyle(ButtonStyle.Secondary).setEmoji('⏳'),
        new ButtonBuilder().setCustomId('help_autoreply').setLabel('رد تلقائي').setStyle(ButtonStyle.Secondary).setEmoji('💎'),
        new ButtonBuilder().setCustomId('help_autorole').setLabel('رتب تلقائية').setStyle(ButtonStyle.Secondary).setEmoji('⚡'),
    )

    await interaction.update({embeds : [embed] , components : [btns1 , btns2 , btns3]});
    }else 
            /**
     * @desc : BROADCAST COMMANDS
    */
    if(interaction.customId === "help_broadcast"){
      const embed = new EmbedBuilder()
      .setAuthor({name : interaction.guild.name , iconURL : interaction.guild.iconURL({dynamic : true})})
      .setTitle('قائمة اوامر البوت')
      .addFields(
        {name : `\`/send-broadcast-panel\`` , value : `ارسال بانل التحكم في البرودكاست`},
        {name : `\`${prefix}obc\`` , value : `لارسال رسالة للأعضاء الأونلاين`},
        {name : `\`${prefix}bc\`` , value : `ارسال رسالة للكل`},
        {name : `\`/remove-token\`` , value : `ازالة توكن محدد من بوتات البرودكاست`},
        {name : `\`/remove-all-tokens\`` , value : `ازالة جميع توكنات البرودكاست`},
      )
      .setTimestamp()
      .setFooter({text : `Requested By ${interaction.user.username}` , iconURL : interaction.user.displayAvatarURL({dynamic : true})})
      .setColor('DarkButNotBlack');
      const btns1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('help_tax').setLabel('ضريبة').setStyle(ButtonStyle.Secondary).setEmoji('💰'),
        new ButtonBuilder().setCustomId('help_autoline').setLabel('خط تلقائي').setStyle(ButtonStyle.Secondary).setEmoji('🤖'),
        new ButtonBuilder().setCustomId('help_suggestion').setLabel('اقتراحات').setStyle(ButtonStyle.Secondary).setEmoji('💡'),
        new ButtonBuilder().setCustomId('help_feedback').setLabel('اراء').setStyle(ButtonStyle.Secondary).setEmoji('💭'),
        new ButtonBuilder().setCustomId('help_system').setLabel('سيستم').setStyle(ButtonStyle.Secondary).setEmoji('⚙️'),
    )

    const btns2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('help_ticket').setLabel('تكت').setStyle(ButtonStyle.Secondary).setEmoji('🎫'),
        new ButtonBuilder().setCustomId('help_giveaway').setLabel('جيف اوي').setStyle(ButtonStyle.Secondary).setEmoji('🎁'),
        new ButtonBuilder().setCustomId('help_protection').setLabel('حماية').setStyle(ButtonStyle.Secondary).setEmoji('🛡️'),
        new ButtonBuilder().setCustomId('help_logs').setLabel('لوج').setStyle(ButtonStyle.Secondary).setEmoji('📜'),
        new ButtonBuilder().setCustomId('help_apply').setLabel('تقديمات').setStyle(ButtonStyle.Secondary).setEmoji('📝'),
    )

    const btns3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('help_broadcast').setLabel('برودكاست').setStyle(ButtonStyle.Secondary).setEmoji('📢').setDisabled(true),
        new ButtonBuilder().setCustomId('help_nadeko').setLabel('ناديكو').setStyle(ButtonStyle.Secondary).setEmoji('⏳'),
        new ButtonBuilder().setCustomId('help_autoreply').setLabel('رد تلقائي').setStyle(ButtonStyle.Secondary).setEmoji('💎'),
        new ButtonBuilder().setCustomId('help_autorole').setLabel('رتب تلقائية').setStyle(ButtonStyle.Secondary).setEmoji('⚡'),
    )

    await interaction.update({embeds : [embed] , components : [btns1 , btns2 , btns3]});
    }else 
    /**
     * @desc : NADEKO COMMANDS
    */
    if(interaction.customId === "help_nadeko"){
      const embed = new EmbedBuilder()
      .setAuthor({name : interaction.guild.name , iconURL : interaction.guild.iconURL({dynamic : true})})
      .setTitle('قائمة اوامر البوت')
      .addFields(
        {name : `\`/set-message\`` , value : `لتحديد الرسالة عند الدخول`},
        {name : `\`/add-nadeko-room\`` , value : `لاضافة روم يتم تفعيل الخاصية فيها`},
        {name : `\`/remove-nadeko-room\`` , value : `لازالة روم مفعل الخاصية فيها`},
      )
      .setTimestamp()
      .setFooter({text : `Requested By ${interaction.user.username}` , iconURL : interaction.user.displayAvatarURL({dynamic : true})})
      .setColor('DarkButNotBlack');
      const btns1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('help_tax').setLabel('ضريبة').setStyle(ButtonStyle.Secondary).setEmoji('💰'),
        new ButtonBuilder().setCustomId('help_autoline').setLabel('خط تلقائي').setStyle(ButtonStyle.Secondary).setEmoji('🤖'),
        new ButtonBuilder().setCustomId('help_suggestion').setLabel('اقتراحات').setStyle(ButtonStyle.Secondary).setEmoji('💡'),
        new ButtonBuilder().setCustomId('help_feedback').setLabel('اراء').setStyle(ButtonStyle.Secondary).setEmoji('💭'),
        new ButtonBuilder().setCustomId('help_system').setLabel('سيستم').setStyle(ButtonStyle.Secondary).setEmoji('⚙️'),
    )

    const btns2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('help_ticket').setLabel('تكت').setStyle(ButtonStyle.Secondary).setEmoji('🎫'),
        new ButtonBuilder().setCustomId('help_giveaway').setLabel('جيف اوي').setStyle(ButtonStyle.Secondary).setEmoji('🎁'),
        new ButtonBuilder().setCustomId('help_protection').setLabel('حماية').setStyle(ButtonStyle.Secondary).setEmoji('🛡️'),
        new ButtonBuilder().setCustomId('help_logs').setLabel('لوج').setStyle(ButtonStyle.Secondary).setEmoji('📜'),
        new ButtonBuilder().setCustomId('help_apply').setLabel('تقديمات').setStyle(ButtonStyle.Secondary).setEmoji('📝'),
    )

    const btns3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('help_broadcast').setLabel('برودكاست').setStyle(ButtonStyle.Secondary).setEmoji('📢'),
        new ButtonBuilder().setCustomId('help_nadeko').setLabel('ناديكو').setStyle(ButtonStyle.Secondary).setEmoji('⏳').setDisabled(true),
        new ButtonBuilder().setCustomId('help_autoreply').setLabel('رد تلقائي').setStyle(ButtonStyle.Secondary).setEmoji('💎'),
        new ButtonBuilder().setCustomId('help_autorole').setLabel('رتب تلقائية').setStyle(ButtonStyle.Secondary).setEmoji('⚡'),
    )

    await interaction.update({embeds : [embed] , components : [btns1 , btns2 , btns3]});
    }else 
            /**
     * @desc : AUTOROLE COMMANDS
    */
    if(interaction.customId === "help_autorole"){
      const embed = new EmbedBuilder()
      .setAuthor({name : interaction.guild.name , iconURL : interaction.guild.iconURL({dynamic : true})})
      .setTitle('قائمة اوامر البوت')
      .addFields(
        {name : `\`/new-panel\`` , value : `انشاء بنل رتب جديد`},
        {name : `\`/add-button\`` , value : `اضافة زر جديد للرتبة`},
      )
      .setTimestamp()
      .setFooter({text : `Requested By ${interaction.user.username}` , iconURL : interaction.user.displayAvatarURL({dynamic : true})})
      .setColor('DarkButNotBlack');
      const btns1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('help_tax').setLabel('ضريبة').setStyle(ButtonStyle.Secondary).setEmoji('💰'),
        new ButtonBuilder().setCustomId('help_autoline').setLabel('خط تلقائي').setStyle(ButtonStyle.Secondary).setEmoji('🤖'),
        new ButtonBuilder().setCustomId('help_suggestion').setLabel('اقتراحات').setStyle(ButtonStyle.Secondary).setEmoji('💡'),
        new ButtonBuilder().setCustomId('help_feedback').setLabel('اراء').setStyle(ButtonStyle.Secondary).setEmoji('💭'),
        new ButtonBuilder().setCustomId('help_system').setLabel('سيستم').setStyle(ButtonStyle.Secondary).setEmoji('⚙️'),
    )

    const btns2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('help_ticket').setLabel('تكت').setStyle(ButtonStyle.Secondary).setEmoji('🎫'),
        new ButtonBuilder().setCustomId('help_giveaway').setLabel('جيف اوي').setStyle(ButtonStyle.Secondary).setEmoji('🎁'),
        new ButtonBuilder().setCustomId('help_protection').setLabel('حماية').setStyle(ButtonStyle.Secondary).setEmoji('🛡️'),
        new ButtonBuilder().setCustomId('help_logs').setLabel('لوج').setStyle(ButtonStyle.Secondary).setEmoji('📜'),
        new ButtonBuilder().setCustomId('help_apply').setLabel('تقديمات').setStyle(ButtonStyle.Secondary).setEmoji('📝'),
    )

    const btns3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('help_broadcast').setLabel('برودكاست').setStyle(ButtonStyle.Secondary).setEmoji('📢'),
        new ButtonBuilder().setCustomId('help_nadeko').setLabel('ناديكو').setStyle(ButtonStyle.Secondary).setEmoji('⏳'),
        new ButtonBuilder().setCustomId('help_autoreply').setLabel('رد تلقائي').setStyle(ButtonStyle.Secondary).setEmoji('💎'),
        new ButtonBuilder().setCustomId('help_autorole').setLabel('رتب تلقائية').setStyle(ButtonStyle.Secondary).setEmoji('⚡').setDisabled(true),
    )

    await interaction.update({embeds : [embed] , components : [btns1 , btns2 , btns3]});
    }else
    /**
     * @desc : AUTOREPLY COMMANDS
    */
    if(interaction.customId === "help_autoreply"){
      const embed = new EmbedBuilder()
      .setAuthor({name : interaction.guild.name , iconURL : interaction.guild.iconURL({dynamic : true})})
      .setTitle('قائمة اوامر البوت')
      .addFields(
        {name : `\`/autoreply-add\`` , value : `لاضافة رد تلقائي`},
        {name : `\`/autoreply-remove\`` , value : `لازالة رد تلقائي`},
        {name : `\`/autoreply-list\`` , value : `لرؤية جميع الردود`},
      )
      .setTimestamp()
      .setFooter({text : `Requested By ${interaction.user.username}` , iconURL : interaction.user.displayAvatarURL({dynamic : true})})
      .setColor('DarkButNotBlack');
      const btns1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('help_tax').setLabel('ضريبة').setStyle(ButtonStyle.Secondary).setEmoji('💰'),
        new ButtonBuilder().setCustomId('help_autoline').setLabel('خط تلقائي').setStyle(ButtonStyle.Secondary).setEmoji('🤖'),
        new ButtonBuilder().setCustomId('help_suggestion').setLabel('اقتراحات').setStyle(ButtonStyle.Secondary).setEmoji('💡'),
        new ButtonBuilder().setCustomId('help_feedback').setLabel('اراء').setStyle(ButtonStyle.Secondary).setEmoji('💭'),
        new ButtonBuilder().setCustomId('help_system').setLabel('سيستم').setStyle(ButtonStyle.Secondary).setEmoji('⚙️'),
    )

    const btns2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('help_ticket').setLabel('تكت').setStyle(ButtonStyle.Secondary).setEmoji('🎫'),
        new ButtonBuilder().setCustomId('help_giveaway').setLabel('جيف اوي').setStyle(ButtonStyle.Secondary).setEmoji('🎁'),
        new ButtonBuilder().setCustomId('help_protection').setLabel('حماية').setStyle(ButtonStyle.Secondary).setEmoji('🛡️'),
        new ButtonBuilder().setCustomId('help_logs').setLabel('لوج').setStyle(ButtonStyle.Secondary).setEmoji('📜'),
        new ButtonBuilder().setCustomId('help_apply').setLabel('تقديمات').setStyle(ButtonStyle.Secondary).setEmoji('📝'),
    )

    const btns3 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('help_broadcast').setLabel('برودكاست').setStyle(ButtonStyle.Secondary).setEmoji('📢'),
        new ButtonBuilder().setCustomId('help_nadeko').setLabel('ناديكو').setStyle(ButtonStyle.Secondary).setEmoji('⏳'),
        new ButtonBuilder().setCustomId('help_autoreply').setLabel('رد تلقائي').setStyle(ButtonStyle.Secondary).setEmoji('💎').setDisabled(true),
        new ButtonBuilder().setCustomId('help_autorole').setLabel('رتب تلقائية').setStyle(ButtonStyle.Secondary).setEmoji('⚡'),
    )

    await interaction.update({embeds : [embed] , components : [btns1 , btns2 , btns3]});
    }
  })

  //-------------------------- جميع الاكواد هنا ----------------------//

client27.login(token);
