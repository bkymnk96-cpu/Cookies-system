const {
    SlashCommandBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionsBitField,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    MessageFlags
} = require('discord.js');

const keyValueService = require("../../services/keyValueService");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add-ticket-button')
        .setDescription('إضافة زر تذكرة بشكل تفاعلي (مثل setup-ticket)'),

    /**
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     * @param {import('discord.js').Client} client
     */
    async execute(interaction, client) {
        // التحقق من صلاحية الأدمن
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({
                content: '❌ تحتاج إلى صلاحية `Administrator` لاستخدام هذا الأمر.',
                flags: MessageFlags.Ephemeral
            });
        }

        // ========== الخطوة 1: مودال لجمع البيانات الأساسية ==========
        const modal = new ModalBuilder()
            .setCustomId('add_ticket_modal')
            .setTitle('➕ إضافة زر تذكرة');

        const messageIdInput = new TextInputBuilder()
            .setCustomId('message_id')
            .setLabel('معرف الرسالة (Message ID)')
            .setPlaceholder('أدخل معرف الرسالة التي تحتوي على الأزرار')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const buttonNameInput = new TextInputBuilder()
            .setCustomId('button_name')
            .setLabel('اسم الزر')
            .setPlaceholder('مثال: افتح تذكرة')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const buttonEmojiInput = new TextInputBuilder()
            .setCustomId('button_emoji')
            .setLabel('إيموجي الزر (اختياري)')
            .setPlaceholder('مثال: 🎫 أو :ticket:')
            .setStyle(TextInputStyle.Short)
            .setRequired(false);

        const askInput = new TextInputBuilder()
            .setCustomId('ask')
            .setLabel('تفعيل السؤال عن سبب الفتح؟')
            .setPlaceholder('اكتب on أو off')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setValue('on');

        modal.addComponents(
            new ActionRowBuilder().addComponents(messageIdInput),
            new ActionRowBuilder().addComponents(buttonNameInput),
            new ActionRowBuilder().addComponents(buttonEmojiInput),
            new ActionRowBuilder().addComponents(askInput)
        );

        await interaction.showModal(modal);

        let modalSubmit;
        try {
            modalSubmit = await interaction.awaitModalSubmit({
                time: 120_000,
                filter: (i) => i.user.id === interaction.user.id,
            });
        } catch (err) {
            return interaction.editReply({
                content: '⏰ انتهت مهلة إدخال البيانات.',
                flags: MessageFlags.Ephemeral
            }).catch(() => {});
        }

        const messageId = modalSubmit.fields.getTextInputValue('message_id').trim();
        const buttonName = modalSubmit.fields.getTextInputValue('button_name').trim();
        const buttonEmoji = modalSubmit.fields.getTextInputValue('button_emoji').trim() || null;
        const askOption = modalSubmit.fields.getTextInputValue('ask').trim().toLowerCase();
        
        // التحقق من قيمة ask
        if (askOption !== 'on' && askOption !== 'off') {
            return modalSubmit.reply({
                content: '❌ قيمة السؤال يجب أن تكون `on` أو `off`.',
                flags: MessageFlags.Ephemeral
            });
        }

        // ========== الخطوة 2: اختيار لون الزر ==========
        const colorOptions = [
            { label: '🔴 أحمر (Danger)', value: 'red' },
            { label: '🟢 أخضر (Success)', value: 'green' },
            { label: '🔵 أزرق (Primary)', value: 'blue' },
            { label: '⚪ رمادي (Secondary)', value: 'secondary' }
        ];
        const colorSelect = new StringSelectMenuBuilder()
            .setCustomId('select_button_color')
            .setPlaceholder('اختر لون الزر')
            .addOptions(colorOptions);

        const colorRow = new ActionRowBuilder().addComponents(colorSelect);

        await modalSubmit.reply({
            content: '🎨 **اختر لون الزر:**',
            components: [colorRow],
            flags: MessageFlags.Ephemeral
        });

        let buttonColor;
        try {
            const colorInteraction = await modalSubmit.channel.awaitMessageComponent({
                filter: (i) => i.user.id === interaction.user.id && i.customId === 'select_button_color',
                time: 60_000
            });
            buttonColor = colorInteraction.values[0];
            await colorInteraction.deferUpdate();
        } catch (err) {
            return interaction.editReply({
                content: '⏰ لم تختر لون الزر في الوقت المحدد.',
                components: [],
                flags: MessageFlags.Ephemeral
            });
        }

        // ========== الخطوة 3: اختيار رتبة الدعم ==========
        const supportRoles = interaction.guild.roles.cache.filter(r => r.name !== '@everyone');
        if (supportRoles.size === 0) {
            return interaction.editReply({
                content: '❌ لا توجد رتب في السيرفر لإختيارها.',
                components: [],
                flags: MessageFlags.Ephemeral
            });
        }

        const roleOptions = supportRoles.map(role => ({
            label: role.name,
            value: role.id,
            description: `رتبة: ${role.name}`
        })).slice(0, 25);

        const roleSelect = new StringSelectMenuBuilder()
            .setCustomId('select_support_role')
            .setPlaceholder('اختر رتبة الدعم')
            .addOptions(roleOptions);

        const roleRow = new ActionRowBuilder().addComponents(roleSelect);

        await interaction.editReply({
            content: '👥 **اختر رتبة الدعم التي ستتعامل مع التذاكر:**',
            components: [roleRow],
            flags: MessageFlags.Ephemeral
        });

        let supportRole;
        try {
            const roleInteraction = await interaction.channel.awaitMessageComponent({
                filter: (i) => i.user.id === interaction.user.id && i.customId === 'select_support_role',
                time: 60_000
            });
            supportRole = interaction.guild.roles.cache.get(roleInteraction.values[0]);
            if (!supportRole) throw new Error();
            await roleInteraction.deferUpdate();
        } catch (err) {
            return interaction.editReply({
                content: '⏰ لم تختر رتبة الدعم في الوقت المحدد.',
                components: [],
                flags: MessageFlags.Ephemeral
            });
        }

        // ========== الخطوة 4: اختيار الكاتيجوري ==========
        const categories = interaction.guild.channels.cache.filter(c => c.type === 4); // Category
        if (categories.size === 0) {
            return interaction.editReply({
                content: '❌ لا توجد كاتيجوريات في السيرفر.',
                components: [],
                flags: MessageFlags.Ephemeral
            });
        }

        const catOptions = categories.map(cat => ({
            label: cat.name,
            value: cat.id,
            description: `كاتيجوري: ${cat.name}`
        })).slice(0, 25);

        const catSelect = new StringSelectMenuBuilder()
            .setCustomId('select_category')
            .setPlaceholder('اختر الكاتيجوري التي ستُنشأ فيها التذاكر')
            .addOptions(catOptions);

        const catRow = new ActionRowBuilder().addComponents(catSelect);

        await interaction.editReply({
            content: '📁 **اختر الكاتيجوري (المجلد) الذي ستُنشأ فيه التذاكر:**',
            components: [catRow],
            flags: MessageFlags.Ephemeral
        });

        let category;
        try {
            const catInteraction = await interaction.channel.awaitMessageComponent({
                filter: (i) => i.user.id === interaction.user.id && i.customId === 'select_category',
                time: 60_000
            });
            category = interaction.guild.channels.cache.get(catInteraction.values[0]);
            if (!category) throw new Error();
            await catInteraction.deferUpdate();
        } catch (err) {
            return interaction.editReply({
                content: '⏰ لم تختر الكاتيجوري في الوقت المحدد.',
                components: [],
                flags: MessageFlags.Ephemeral
            });
        }

        // ========== الخطوة 5: اختيار نوع رسالة الترحيب ==========
        const welcomeTypeOptions = [
            { label: '📘 Embed', value: 'embed', description: 'رسالة ترحيب بشكل إمبيد' },
            { label: '📝 Message', value: 'message', description: 'رسالة ترحيب عادية' }
        ];
        const welcomeTypeSelect = new StringSelectMenuBuilder()
            .setCustomId('select_welcome_type')
            .setPlaceholder('اختر نوع رسالة الترحيب')
            .addOptions(welcomeTypeOptions);

        const welcomeTypeRow = new ActionRowBuilder().addComponents(welcomeTypeSelect);

        await interaction.editReply({
            content: '📢 **اختر نوع رسالة الترحيب داخل التذكرة:**',
            components: [welcomeTypeRow],
            flags: MessageFlags.Ephemeral
        });

        let welcomeType;
        try {
            const wtInteraction = await interaction.channel.awaitMessageComponent({
                filter: (i) => i.user.id === interaction.user.id && i.customId === 'select_welcome_type',
                time: 60_000
            });
            welcomeType = wtInteraction.values[0];
            await wtInteraction.deferUpdate();
        } catch (err) {
            return interaction.editReply({
                content: '⏰ لم تختر نوع رسالة الترحيب في الوقت المحدد.',
                components: [],
                flags: MessageFlags.Ephemeral
            });
        }

        // ========== الخطوة 6: اختيار قالب الترحيب (بنفس طريقة setup-ticket) ==========
        const templates = (await keyValueService.get('welcomeTemplates', interaction.guild.id)) || {};
        const templateNames = Object.keys(templates);

        if (templateNames.length === 0) {
            return interaction.editReply({
                content: '❌ لا توجد قوالب مسجلة. استخدم الأمر `/welcome-setup` أولاً.',
                components: [],
                flags: MessageFlags.Ephemeral
            });
        }

        const templateSelectOptions = [
            {
                label: '🚫 بدون قالب',
                value: '__none__',
                description: 'لن يتم استخدام أي قالب ترحيب'
            },
            ...templateNames.map(name => ({
                label: name,
                value: `template_${name}`,
                description: `القالب: ${name}`
            }))
        ];

        const templateMenu = new StringSelectMenuBuilder()
            .setCustomId('select_template_for_ticket')
            .setPlaceholder('📄 اختر قالب الترحيب (أو بدون قالب)')
            .addOptions(templateSelectOptions);

        const templateRow = new ActionRowBuilder().addComponents(templateMenu);

        await interaction.editReply({
            content: '🎨 **اختر قالب الترحيب الذي تريد استخدامه:**',
            components: [templateRow],
            flags: MessageFlags.Ephemeral
        });

        let selectedTemplate = null;
        let selectedTemplateName = null;
        try {
            const templateInteraction = await interaction.channel.awaitMessageComponent({
                filter: (i) => i.user.id === interaction.user.id && i.customId === 'select_template_for_ticket',
                time: 120_000
            });
            const selectedValue = templateInteraction.values[0];
            if (selectedValue !== '__none__') {
                selectedTemplateName = selectedValue.replace('template_', '');
                selectedTemplate = templates[selectedTemplateName];
                if (!selectedTemplate) throw new Error();
            }
            await templateInteraction.deferUpdate();
        } catch (err) {
            return interaction.editReply({
                content: '⏰ لم تختر قالباً في الوقت المحدد.',
                components: [],
                flags: MessageFlags.Ephemeral
            });
        }

        if (!selectedTemplate) {
            return interaction.editReply({
                content: '❌ لا يمكن متابعة العملية بدون اختيار قالب صالح (أو قمت باختيار "بدون قالب" وهو غير مسموح).',
                components: [],
                flags: MessageFlags.Ephemeral
            });
        }

        // ========== الخطوة النهائية: إنشاء الزر وتعديل الرسالة وحفظ البيانات ==========
        try {
            const message = await interaction.channel.messages.fetch(messageId);
            if (!message) {
                return interaction.editReply({
                    content: '❌ لم أتمكن من العثور على الرسالة. تأكد من أن المعرف صحيح وأن الرسالة موجودة في هذه القناة.',
                    components: [],
                    flags: MessageFlags.Ephemeral
                });
            }

            const currentComponents = message.components || [];
            const randomId = `ticket_${Math.random().toString(36).substring(2, 11)}`;

            const newButton = new ButtonBuilder()
                .setCustomId(randomId)
                .setLabel(buttonName)
                .setStyle(
                    buttonColor === 'red' ? ButtonStyle.Danger :
                    buttonColor === 'green' ? ButtonStyle.Success :
                    buttonColor === 'blue' ? ButtonStyle.Primary :
                    ButtonStyle.Secondary
                );
            if (buttonEmoji) newButton.setEmoji(buttonEmoji);

            const newRow = new ActionRowBuilder().addComponents([
                ...(currentComponents[0]?.components || []),
                newButton
            ]);

            await message.edit({ components: [newRow] });

            const ticketData = {
                Support: supportRole.id,
                Category: category.id,
                Type: welcomeType,
                Ask: askOption,
                WelcomeTemplateName: selectedTemplateName,
                WelcomeTemplate: selectedTemplate
            };

            await keyValueService.set('ticketDB', `Ticket_${interaction.channel.id}_${randomId}`, ticketData);

            await interaction.editReply({
                content: `✅ تم إضافة الزر \`${buttonName}\` بنجاح وربطه بقالب الترحيب \`${selectedTemplateName}\`.`,
                components: [],
                flags: MessageFlags.Ephemeral
            });

        } catch (err) {
            console.error(err);
            await interaction.editReply({
                content: '❌ حدث خطأ أثناء محاولة إضافة الزر. تأكد من أن الرسالة موجودة في هذه القناة وحاول مرة أخرى.',
                components: [],
                flags: MessageFlags.Ephemeral
            });
        }
    }
};