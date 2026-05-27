const {
    SlashCommandBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    MessageFlags,
} = require('discord.js');

const keyValueService = require('../../services/keyValueService');

module.exports = {
    adminsOnly: true,

    data: new SlashCommandBuilder()
        .setName('to-select')
        .setDescription('تحويل التكت الى سلكت منيو')

        .addStringOption(option =>
            option
                .setName('message_id')
                .setDescription('ايدي الرسالة')
                .setRequired(true)
        )

        // اختيار القالب من القوالب المحفوظة
        .addStringOption(option => {
            option
                .setName('template')
                .setDescription('اختر قالب الترحيب')
                .setRequired(true)
                .setAutocomplete(true);

            return option;
        })

        .addStringOption(option =>
            option.setName('description1')
                .setDescription('وصف الخيار الأول')
                .setRequired(false)
        )

        .addStringOption(option =>
            option.setName('description2')
                .setDescription('وصف الخيار الثاني')
                .setRequired(false)
        )

        .addStringOption(option =>
            option.setName('description3')
                .setDescription('وصف الخيار الثالث')
                .setRequired(false)
        )

        .addStringOption(option =>
            option.setName('description4')
                .setDescription('وصف الخيار الرابع')
                .setRequired(false)
        )

        .addStringOption(option =>
            option.setName('description5')
                .setDescription('وصف الخيار الخامس')
                .setRequired(false)
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

    async execute(interaction) {

        const messageId = interaction.options.getString('message_id');

        const templateName = interaction.options.getString('template');

        const descriptions = [
            interaction.options.getString('description1'),
            interaction.options.getString('description2'),
            interaction.options.getString('description3'),
            interaction.options.getString('description4'),
            interaction.options.getString('description5'),
        ];

        try {

            // جلب القوالب
            const templates =
                (await keyValueService.get(
                    'welcomeTemplates',
                    interaction.guild.id
                )) || {};

            // التأكد من وجود القالب
            const selectedTemplate = templates[templateName];

            if (!selectedTemplate) {
                return interaction.reply({
                    content: '❌ القالب غير موجود.',
                    flags: MessageFlags.Ephemeral,
                });
            }

            // جلب الرسالة
            const message = await interaction.channel.messages.fetch(messageId);

            // البحث عن صف الأزرار
            const buttonRow = message.components.find(row =>
                row.components.some(component => component.type === 2)
            );

            if (!buttonRow) {
                return interaction.reply({
                    content: 'لا توجد أزرار في الرسالة.',
                    flags: MessageFlags.Ephemeral,
                });
            }

            // إنشاء السلكت منيو
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('ticket_select')
                .setPlaceholder('Select Problem Type !');

            // تحويل الأزرار إلى خيارات
            buttonRow.components.forEach((button, index) => {

                const option = new StringSelectMenuOptionBuilder()
                    .setLabel(button.label)
                    .setValue(button.customId);

                // الايموجي
                if (button.emoji) {
                    option.setEmoji(button.emoji);
                }

                // الوصف
                if (descriptions[index]) {
                    option.setDescription(descriptions[index]);
                }

                selectMenu.addOptions(option);
            });

            // زر الريسيت
            selectMenu.addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel('Reset')
                    .setValue('reset')
            );

            // صف السلكت منيو
            const selectRow = new ActionRowBuilder().addComponents(selectMenu);

            // تعديل الرسالة
            await message.edit({
                components: [selectRow],
            });

            // حفظ القالب المختار بنفس طريقة welcome
            await keyValueService.set(
                'ticketSelectTemplate',
                interaction.guild.id,
                {
                    templateName,
                    template: selectedTemplate,
                }
            );

            // الرد
            await interaction.reply({
                content: `✅ تم تحويل الأزرار إلى قائمة خيارات وربطها بالقالب \`${templateName}\`.`,
                flags: MessageFlags.Ephemeral,
            });

        } catch (error) {

            console.error(error);

            return interaction.reply({
                content: 'سوي الأمر في نفس الروم اللي فيه الرسالة',
                flags: MessageFlags.Ephemeral,
            });
        }
    }
};