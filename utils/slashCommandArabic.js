const ARABIC_COMMANDS = {
  'autoreply-add': ['اضافة-رد-تلقائي', 'إضافة أو تعديل رد تلقائي'],
  'autoreply-edit': ['تعديل-رد-تلقائي', 'تعديل رد تلقائي موجود'],
  'autoreply-list': ['قائمة-الردود', 'عرض الردود التلقائية'],
  'autoreply-remove': ['حذف-رد-تلقائي', 'حذف رد تلقائي'],
  'add-button': ['اضافة-زر', 'إضافة زر رتبة'],
  'new-panel': ['لوحة-رتب', 'إنشاء لوحة رتب'],
  'add-autoline-channel': ['اضافة-خط-تلقائي', 'إضافة قناة للخط التلقائي'],
  'line-mode': ['وضع-الخط', 'اختيار طريقة إرسال الخط'],
  'remove-autoline-channel': ['حذف-خط-تلقائي', 'حذف قناة من الخط التلقائي'],
  'set-autoline-line': ['تحديد-الخط', 'تحديد صورة أو رابط الخط'],
  broadcast: ['برودكاست', 'إرسال برودكاست للأعضاء'],
  'remove-all-tokens': ['حذف-كل-التوكنات', 'حذف كل توكنات البرودكاست'],
  'remove-token': ['حذف-توكن', 'حذف توكن برودكاست'],
  'send-broadcast-panel': ['لوحة-البرودكاست', 'إرسال لوحة البرودكاست'],
  'feedback-mode': ['وضع-الاراء', 'اختيار وضع الآراء'],
  'set-feedback-room': ['روم-الاراء', 'تحديد قناة الآراء'],
  'set-feedback-line': ['خط-الاراء', 'تحديد خط الآراء'],
  'setup-rating': ['تسطيب-التقييم', 'تسطيب نظام التقييم'],
  'copy-emoji': ['نسخ-ايموجي', 'نسخ إيموجي'],
  help: ['مساعدة', 'قائمة أوامر البوت'],
  ping: ['بنق', 'قياس سرعة البوت'],
  'set-shortcut': ['تحديد-اختصار', 'إدارة اختصارات الأوامر'],
  top: ['توب', 'عرض توب النشاط'],
  gend: ['انهاء-قيف', 'إنهاء قيف أواي'],
  greroll: ['اعادة-قيف', 'إعادة اختيار فائزين'],
  gstart: ['بدء-قيف', 'بدء قيف أواي'],
  'logs-info': ['معلومات-اللوق', 'معلومات نظام اللوق'],
  'setup-logs': ['تسطيب-اللوق', 'تسطيب نظام اللوق'],
  'add-nadeko-room': ['اضافة-ناديكو', 'إضافة قناة ناديكو'],
  'remove-nadeko-room': ['حذف-ناديكو', 'حذف قناة ناديكو'],
  'set-message': ['تحديد-رسالة', 'تحديد رسالة الدخول'],
  'set-suggestions-line': ['خط-الاقتراحات', 'تحديد خط الاقتراحات'],
  'set-suggestions-room': ['روم-الاقتراحات', 'تحديد قناة الاقتراحات'],
  'suggestion-mode': ['وضع-الاقتراحات', 'اختيار وضع الاقتراحات'],
  'add-info-button': ['زر-معلومات', 'إضافة زر معلومات'],
  'admin-points': ['نقاط-الادارة', 'لوحة تفاعلية لنقاط الإدارة والترقيات'],
  'auto-reactions': ['رياكشن-تلقائي', 'تسطيب الرياكشن التلقائي'],
  avatar: ['افتار', 'عرض افتار عضو'],
  ban: ['باند', 'حظر أو فك حظر عضو'],
  banner: ['بنر', 'عرض بنر عضو'],
  clear: ['مسح', 'حذف رسائل'],
  come: ['نداء', 'استدعاء عضو'],
  embed: ['امبد', 'إرسال رسالة إمبد'],
  hide: ['اخفاء', 'إخفاء القناة'],
  kick: ['طرد', 'طرد عضو'],
  lock: ['قفل', 'قفل القناة'],
  mute: ['ميوت', 'إعطاء أو إزالة ميوت'],
  nickname: ['اسم-مستعار', 'تغيير اسم مستعار'],
  role: ['رتبة', 'إعطاء أو إزالة رتبة'],
  roles: ['الرتب', 'عرض رتب السيرفر'],
  say: ['قل', 'إرسال كلام عبر البوت'],
  send: ['ارسال', 'إرسال رسالة لعضو'],
  server: ['السيرفر', 'معلومات السيرفر'],
  'setup-welcome': ['تسطيب-الترحيب', 'لوحة تفاعلية لتسطيب الترحيب'],
  timeout: ['تايم-اوت', 'إعطاء أو إزالة تايم أوت'],
  unhide: ['اظهار', 'إظهار القناة'],
  unlock: ['فتح', 'فتح القناة'],
  user: ['عضو', 'معلومات عضو'],
  'set-tax-line': ['خط-الضريبة', 'تحديد خط الضريبة'],
  'set-tax-room': ['روم-الضريبة', 'تحديد روم الضريبة'],
  'tax-mode': ['وضع-الضريبة', 'اختيار وضع الضريبة'],
  tax: ['ضريبة', 'حساب ضريبة رقم'],
  'add-ticket-button': ['زر-تذكرة', 'إضافة زر تذكرة'],
  'add-user': ['اضافة-عضو', 'إضافة عضو للتذكرة'],
  close: ['اغلاق', 'إغلاق التذكرة'],
  delete: ['حذف', 'حذف التذكرة'],
  'remove-user': ['ازالة-عضو', 'إزالة عضو من التذكرة'],
  rename: ['تسمية', 'تغيير اسم التذكرة'],
  'send-preset': ['ارسال-قالب', 'إرسال قالب تذاكر'],
  'set-ticket-log': ['لوق-التكت', 'تحديد لوق التذاكر'],
  'setup-ticket': ['تسطيب-التكت', 'تسطيب نظام التذاكر'],
  'to-select': ['تحويل-لسلكت', 'تحويل التكت إلى قائمة'],
  'welcome-setup': ['قالب-ترحيب-التكت', 'تصميم قالب ترحيب للتذاكر'],
  'close-apply': ['اغلاق-التقديم', 'إغلاق التقديم'],
  'dm-mode': ['وضع-الخاص', 'وضع رسائل الخاص للتقديم'],
  'new-apply': ['تقديم-جديد', 'إنشاء تقديم جديد'],
  'setup-apply': ['تسطيب-التقديم', 'تسطيب نظام التقديم'],
  'anti-ban': ['حماية-الباند', 'تسطيب حماية الباند'],
  'anti-bots': ['حماية-البوتات', 'تسطيب حماية البوتات'],
  'anti-delete-roles': ['حماية-الرتب', 'تسطيب حماية حذف الرتب'],
  'anti-delete-rooms': ['حماية-الرومات', 'تسطيب حماية حذف الرومات'],
  'protection-status': ['حالة-الحماية', 'عرض حالة الحماية'],
  'set-protect-logs': ['لوق-الحماية', 'تحديد لوق الحماية'],
};

function applyArabicCommandLocalization(command) {
  const entry = ARABIC_COMMANDS[command?.data?.name];
  if (!entry) return command;
  const [name, description] = entry;
  if (typeof command.data.setName === 'function') command.data.setName(name);
  if (typeof command.data.setDescription === 'function') command.data.setDescription(description);
  return command;
}

function getArabicCommandName(name) {
  return ARABIC_COMMANDS[name]?.[0] || name;
}

function getOriginalCommandName(arabicName) {
  const found = Object.entries(ARABIC_COMMANDS).find(([, value]) => value[0] === arabicName);
  return found?.[0] || arabicName;
}

module.exports = { applyArabicCommandLocalization, getArabicCommandName, getOriginalCommandName, ARABIC_COMMANDS };
