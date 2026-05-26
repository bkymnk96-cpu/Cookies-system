const { readdirSync } = require('fs');
const ascii = require('ascii-table');

let table = new ascii('Events').setJustify();
table.setHeading('Event Name', 'Loaded Status');

module.exports = (client27) => {
  const events = readdirSync('./events/').filter((file) => file.endsWith('.js'));
  for (const file of events) {
    try {
      let pull = require(`../events/${file}`);
      
      // إذا كان الملف يصدر دالة، قم باستدعائها مباشرة (تمرير الكلاينت)
      if (typeof pull === 'function') {
        pull(client27);
        table.addRow(file, '✔');
      }
      // التوافق مع التنسيق القديم (event + run) إن وُجد
      else if (pull.event && typeof pull.run === 'function') {
        client27.on(pull.event, pull.run.bind(null, client27));
        table.addRow(file, '✔');
      }
      else {
        table.addRow(file, '❌ (تنسيق غير صالح)');
      }
    } catch (error) {
      console.error(`Error loading event '${file}':`, error);
      table.addRow(file, '❌ (خطأ في التحميل)');
    }
  }
  console.log(table.toString());
};