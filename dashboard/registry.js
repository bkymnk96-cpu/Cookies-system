const SECTIONS = [
  { id: 'overview', title: 'لوحة القيادة', icon: '🚀', group: 'الرئيسية', description: 'ملخص حالة ZEUS داخل السيرفر.' },
  { id: 'general', title: 'الإعدادات العامة', icon: '⚙️', group: 'الرئيسية', description: 'هوية عامة ومظهر وتحكم أساسي.', fields: [
    { key: 'dashboard_theme', ns: 'systemDB', label: 'ثيم الواجهة', type: 'theme', default: 'void-white' },
    { key: 'dashboard_brand', ns: 'systemDB', label: 'اسم الهوية', type: 'text', default: 'ZEUS' },
    { key: 'dashboard_accent', ns: 'systemDB', label: 'لون التمييز', type: 'color', default: '#f0a6bd' },
  ]},
  { id: 'permissions', title: 'الإدارة والصلاحيات', icon: '🛡️', group: 'الرئيسية', fields: [
    { key: 'dashboard_admin_roles', ns: 'systemDB', label: 'رتب مسموحة للداشبورد', type: 'roles', default: [] },
    { key: 'dashboard_audit_channel', ns: 'systemDB', label: 'قناة السجلات الإدارية', type: 'channel' },
  ]},
  { id: 'tickets', title: 'التذاكر', icon: '🎫', group: 'أنظمة الدعم', fields: [
    { key: 'LogsRoom', ns: 'ticketDB', label: 'لوق التذاكر', type: 'channel' },
    { key: 'TransRoom', ns: 'ticketDB', label: 'روم transcript', type: 'channel' },
    { key: 'TicketCounter', ns: 'ticketDB', label: 'عداد التذاكر', type: 'number', default: 0 },
    { key: 'ticket_panel_preview', ns: 'ticketDB', label: 'معاينة/ملاحظات لوحة التذاكر', type: 'textarea' },
  ]},
  { id: 'apply', title: 'التقديمات', icon: '📝', group: 'أنظمة الدعم', fields: [
    { key: 'apply_settings', ns: 'applyDB', label: 'إعدادات التقديم', type: 'json' },
    { key: 'apply', ns: 'applyDB', label: 'أسئلة التقديم الحالية', type: 'json' },
    { key: 'dm', ns: 'applyDB', label: 'رسائل الخاص', type: 'toggle', default: false },
  ]},
  { id: 'broadcast', title: 'البرودكاست', icon: '📢', group: 'أنظمة النمو', fields: [
    { key: 'tokens', ns: 'BroadcastDB', label: 'توكنات البرودكاست', type: 'tokens', sensitive: true, default: [] },
    { key: 'broadcast_msg', ns: 'BroadcastDB', label: 'رسالة البرودكاست', type: 'textarea' },
    { key: 'msgid', ns: 'BroadcastDB', label: 'رسالة لوحة البرودكاست', type: 'text' },
  ]},
  { id: 'giveaway', title: 'الجيف أواي', icon: '🎁', group: 'أنظمة النمو', fields: [
    { key: 'giveaways', ns: 'giveawayDB', label: 'قائمة الجيف أواي', type: 'json', default: [] },
  ]},
  { id: 'suggestions', title: 'الاقتراحات', icon: '💡', group: 'التفاعل', fields: [
    { key: 'suggestions_room', ns: 'suggestionsDB', label: 'قناة الاقتراحات', type: 'channel' },
    { key: 'suggestion_mode', ns: 'suggestionsDB', label: 'وضع الاقتراحات', type: 'select', options: [['buttons','أزرار'],['reactions','رياكشنات']], default: 'buttons' },
    { key: 'thread_mode', ns: 'suggestionsDB', label: 'الثريد التلقائي', type: 'select', options: [['enabled','مفعل'],['disabled','متوقف']], default: 'enabled' },
    { key: 'line', ns: 'suggestionsDB', label: 'خط الاقتراحات', type: 'text' },
  ]},
  { id: 'feedback', title: 'التقييمات والفيدباك', icon: '⭐', group: 'التفاعل', fields: [
    { key: 'feedback_room', ns: 'feedbackDB', label: 'قناة الفيدباك', type: 'channel' },
    { key: 'feedback_mode', ns: 'feedbackDB', label: 'وضع العرض', type: 'select', options: [['embed','إمبد'],['reactions','رياكشن']], default: 'embed' },
    { key: 'feedback_emoji', ns: 'feedbackDB', label: 'إيموجي التفاعل', type: 'text', default: '❤' },
    { key: 'line', ns: 'feedbackDB', label: 'خط الفيدباك', type: 'text' },
    { key: 'staff_role', ns: 'feedbackDB', label: 'رتبة الستاف للتقييم', type: 'role' },
    { key: 'rank_room', ns: 'feedbackDB', label: 'قناة التقييم', type: 'channel' },
  ]},
  { id: 'autoline', title: 'الخط التلقائي', icon: '➖', group: 'التفاعل', fields: [
    { key: 'line_channels', ns: 'autolineDB', label: 'قنوات الخط التلقائي', type: 'channels', default: [] },
    { key: 'line_mode', ns: 'autolineDB', label: 'نوع الخط', type: 'select', options: [['image','صورة'],['link','رابط']], default: 'image' },
    { key: 'line', ns: 'autolineDB', label: 'رابط/صورة الخط', type: 'text' },
  ]},
  { id: 'autoreply', title: 'الردود التلقائية', icon: '🤖', group: 'التفاعل', fields: [
    { key: 'replys', ns: 'CookiesDB', label: 'الردود التلقائية', type: 'json', default: [] },
  ]},
  { id: 'autoreactions', title: 'الرياكشنات التلقائية', icon: '✨', group: 'التفاعل', fields: [
    { key: 'auto_reactions', ns: 'systemDB', label: 'قواعد الرياكشن التلقائي', type: 'json', default: [] },
  ]},
  { id: 'welcome', title: 'الترحيب', icon: '👋', group: 'التفاعل', fields: [
    { key: 'welcome_config', ns: 'systemDB', label: 'إعداد الترحيب المتقدم', type: 'welcome' },
  ]},
  { id: 'nadeko', title: 'ناديكو', icon: '⏳', group: 'التفاعل', fields: [
    { key: 'rooms', ns: 'nadekoDB', label: 'رومات ناديكو', type: 'channels', default: [] },
    { key: 'message', ns: 'nadekoDB', label: 'رسالة ناديكو', type: 'textarea' },
  ]},
  { id: 'tax', title: 'الضريبة', icon: '💰', group: 'الأدوات', fields: [
    { key: 'tax_room', ns: 'taxDB', label: 'روم الضريبة', type: 'channel' },
    { key: 'tax_mode', ns: 'taxDB', label: 'وضع الرد', type: 'select', options: [['embed','إمبد'],['message','رسالة']], default: 'embed' },
    { key: 'tax_color', ns: 'taxDB', label: 'لون إمبد الضريبة', type: 'color', default: '#0099FF' },
    { key: 'tax_line', ns: 'taxDB', label: 'خط الضريبة', type: 'text' },
  ]},
  { id: 'shortcuts', title: 'الاختصارات', icon: '⌨️', group: 'الأدوات', fields: [
    { key: 'shortcuts', ns: 'shortcutDB', label: 'اختصارات الأوامر', type: 'json', default: {} },
  ]},
  { id: 'logs', title: 'اللوق', icon: '📜', group: 'الأمان', fields: [
    ...['messagedelete','messageupdate','rolecreate','roledelete','rolegive','roleremove','channelcreate','channeldelete','botadd','banadd','bandelete','kickadd'].map((name) => ({ key: `log_${name}`, ns: 'logsDB', label: `لوق ${name}`, type: 'channel' })),
  ]},
  { id: 'protection', title: 'الحماية', icon: '🧬', group: 'الأمان', fields: [
    { key: 'protectLog_room', ns: 'protectDB', label: 'قناة لوق الحماية', type: 'channel' },
    { key: 'ban_status', ns: 'protectDB', label: 'حماية الباند/الطرد', type: 'select', options: [['on','مفعل'],['off','متوقف']], default: 'off' },
    { key: 'ban_limit', ns: 'protectDB', label: 'حد الباند/الطرد', type: 'number', default: 3 },
    { key: 'antibots_status', ns: 'protectDB', label: 'حماية البوتات', type: 'select', options: [['on','مفعل'],['off','متوقف']], default: 'off' },
    { key: 'antideleteroles_status', ns: 'protectDB', label: 'حماية حذف الرتب', type: 'select', options: [['on','مفعل'],['off','متوقف']], default: 'off' },
    { key: 'antideleteroles_limit', ns: 'protectDB', label: 'حد حذف الرتب', type: 'number', default: 3 },
    { key: 'antideleterooms_status', ns: 'protectDB', label: 'حماية حذف الرومات', type: 'select', options: [['on','مفعل'],['off','متوقف']], default: 'off' },
    { key: 'antideleterooms_limit', ns: 'protectDB', label: 'حد حذف الرومات', type: 'number', default: 3 },
    { key: 'ban_users', ns: 'protectDB', label: 'مخالفات الباند/الطرد', type: 'json', default: [] },
    { key: 'rolesdelete_users', ns: 'protectDB', label: 'مخالفات حذف الرتب', type: 'json', default: [] },
    { key: 'roomsdelete_users', ns: 'protectDB', label: 'مخالفات حذف الرومات', type: 'json', default: [] },
  ]},
  { id: 'autorole', title: 'الرتب التلقائية', icon: '⚡', group: 'الإدارة', fields: [
    { key: 'autorole_panels', ns: 'systemDB', label: 'لوحات الرتب التلقائية', type: 'json', default: [] },
  ]},
  { id: 'adminpoints', title: 'نقاط الإدارة', icon: '🏅', group: 'الإدارة', fields: [
    { key: 'admin_points_config', ns: 'systemDB', label: 'إعداد نقاط الإدارة', type: 'json' },
    { key: 'admin_points', ns: 'systemDB', label: 'نقاط الإداريين', type: 'json', default: {} },
  ]},
  { id: 'activity', title: 'النشاط والإحصائيات', icon: '📈', group: 'الإدارة', fields: [
    { key: 'text', ns: 'activityDB', label: 'نشاط الرسائل', type: 'json', default: {} },
    { key: 'voice', ns: 'activityDB', label: 'نشاط الصوت', type: 'json', default: {} },
  ]},
  { id: 'tokens', title: 'التوكنات والبوتات', icon: '🔐', group: 'الإدارة', fields: [
    { key: 'tokens', ns: 'BroadcastDB', label: 'توكنات البرودكاست', type: 'tokens', sensitive: true, default: [] },
    { key: 'dashboard_bot_notes', ns: 'systemDB', label: 'ملاحظات تشغيل البوتات المتعددة', type: 'textarea' },
  ]},
  { id: 'backup', title: 'النسخ والاستيراد', icon: '💾', group: 'الإدارة', fields: [] },
  { id: 'docs', title: 'التوثيق الداخلي', icon: '📚', group: 'الإدارة', fields: [] },
];

const SECTION_MAP = new Map(SECTIONS.map((section) => [section.id, section]));
function scopedKey(field, guildId) { return ['replys','shortcuts'].includes(field.key) ? `${field.key}_${guildId}` : `${field.key}_${guildId}`; }
module.exports = { SECTIONS, SECTION_MAP, scopedKey };