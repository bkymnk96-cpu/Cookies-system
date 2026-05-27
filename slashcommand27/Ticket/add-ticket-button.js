const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionsBitField,
} = require('discord.js');

const keyValueService = require("../../services/keyValueService");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add-ticket-button')
        .setDescription('تثبيت التذكرة')

        .addStringOption(option =>
            option.setName('message_id')
                .setDescription('ايدي الرسالة')
                .setRequired(true)
        )

        .addStringOption(option =>
            option.setName('button_name')
                .setDescription('اسم الزر')
                .setRequired(true)
        )

        .addStringOption(option =>
            option.setName('button_color')
                .setDescription('لون الزر')
                .setRequired(true)
                .addChoices(
                    { name: 'Red', value: 'red' },
                    { name: 'Green', value: 'green' },
                    { name: 'Blue', value: 'blue' },
                    { name: 'Gray', value: 'secondary' }
                )
        )

        .addRoleOption(option =>
            option.setName('support_role')
                .setDescription('رتبة الدعم')
                .setRequired(true)
        )

        .addChannelOption(option =>
            option.setName('category')
                .setDescription('الكاتيجوري')
                .addChannelTypes(4)
                .setRequired(true)
        )

        .addStringOption(option =>
            option.setName('welcome-type')
                .setDescription('نوع رسالة الترحيب')
                .setRequired(true)
                .addChoices(
                    { name: 'Embed', value: 'embed' },
                    { name: 'Message', value: 'message' }
                )
        )

        // اختيار قالب الترحيب من القوالب المحفوظة
        .addStringOption(option =>
            option.setName('welcome_template')
                .setDescription('اختر قالب الترحيب')
                .setRequired(true)
                .setAutocomplete(true)
        )

        .addStringOption(option =>
            option.setName('button_emoji')
                .setDescription('ايموجي الزر')
                .setRequired(false)
        )

        .addStringOption(option =>
            option.setName('ask')
                .setDescription('تفعيل أو تعطيل السؤال')
                .setRequired(false)
                .addChoices(
                    { name: 'On', value: 'on' },
                    { name: 'Off', value: 'off' }
                )
        ),

    // الاوتوكومبليت للقوالب
    async autocomplete(interaction) {

        const focusedValue = interaction.options.getFocused();

        const templates =
            (await keyValueService.get(
                'welcomeTemplates',
                interaction.guild.id
            )) || {};

        const choices = Object.keys(templates);

        const filtered = choices
            .filter(choice =>
                choice.toLowerCase().includes(focusedValue.toLowerCase())
            )
            .slice(0, 25);

        await interaction.respond(
            filtered.map(choice => ({
                name: choice,
                value: choice,
            }))
        );
    },

    /**
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     * @param {import('discord.js').Client} client
     */
    async execute(interaction, client) {

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({
                content: '❌ You need Administrator permission to use this command.',
                ephemeral: true
            });
        }

        const messageId = interaction.options.getString('message_id');

        const buttonName = interaction.options.getString('button_name');

        const buttonEmoji = interaction.options.getString('button_emoji') || null;

        const buttonColor = interaction.options.getString('button_color');

        const supportRole = interaction.options.getRole('support_role');

        const category = interaction.options.getChannel('category');

        const messageType = interaction.options.getString('welcome-type');

        const askOption = interaction.options.getString('ask');

        // القالب المختار
        const selectedTemplateName =
            interaction.options.getString('welcome_template');

        try {

            // جلب جميع القوالب
            const templates =
                (await keyValueService.get(
                    'welcomeTemplates',
                    interaction.guild.id
                )) || {};

            // جلب القالب المحدد
            const selectedTemplate =
                templates[selectedTemplateName];

            // التحقق من وجود القالب
            if (!selectedTemplate) {
                return interaction.reply({
                    content: '❌ قالب الترحيب غير موجود.',
                    ephemeral: true
                });
            }

            const message =
                await interaction.channel.messages.fetch(messageId);

            if (!message) {
                return interaction.reply({
                    content: 'سوي الأمر في نفس الروم اللي فيه الرسالة',
                    ephemeral: true
                });
            }

            const currentComponents =
                message.components || [];

            const randomId =
                `ticket_${Math.random().toString(36).substr(2, 9)}`;

            const newButton = new ButtonBuilder()
                .setCustomId(randomId)
                .setLabel(buttonName);

            if (buttonEmoji) {
                newButton.setEmoji(buttonEmoji);
            }

            switch (buttonColor) {

                case 'red':
                    newButton.setStyle(ButtonStyle.Danger);
                    break;

                case 'green':
                    newButton.setStyle(ButtonStyle.Success);
                    break;

                case 'blue':
                    newButton.setStyle(ButtonStyle.Primary);
                    break;

                default:
                    newButton.setStyle(ButtonStyle.Secondary);
            }

            const newRow =
                new ActionRowBuilder().addComponents([
                    ...(currentComponents[0]?.components || []),
                    newButton,
                ]);

            await message.edit({
                components: [newRow]
            });

            const ticketData = {

                Support: supportRole.id,

                Category: category.id,

                Type: messageType,

                Ask: askOption,

                // اسم القالب
                WelcomeTemplateName: selectedTemplateName,

                // بيانات القالب كاملة
                WelcomeTemplate: selectedTemplate,
            };

            await keyValueService.set(
                'ticketDB',
                `Ticket_${interaction.channel.id}_${randomId}`,
                ticketData
            );

            // حذف طريقة رسالة الترحيب القديمة
            // وجعل النظام يعتمد بالكامل على القوالب

            await interaction.reply({
                content: `✅ تم إضافة الزر وربطه بقالب الترحيب \`${selectedTemplateName}\`.`,
                ephemeral: true
            });

        } catch (error) {

            console.error(error);

            interaction.reply({
                content: '❌ حدث خطأ أثناء محاولة اضافة الزر.',
                ephemeral: true
            });
        }
    },
};