function parseTokens(value) {
  if (!value) return [];
  return value
    .split(/[\n,; ]+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

const configuredTokens = [
  ...parseTokens(process.env.DISCORD_TOKENS || process.env.BOT_TOKENS),
  ...parseTokens(process.env.DISCORD_TOKEN || process.env.TOKEN),
];

module.exports = {
  // يمكن وضع توكن واحد في DISCORD_TOKEN/TOKEN أو عدة توكنات مفصولة بفواصل/أسطر في DISCORD_TOKENS/BOT_TOKENS.
  botTokens: configuredTokens,
  token: configuredTokens[0],

  // تم تعطيل نظام البريفكس القديم، ويعتمد البوت الآن على السلاش والاختصارات الحديثة

  // ضع الأيدي الخاص بك هنا مباشرة بين علامتي التنصيص
  owner: process.env.OWNER_ID || "656783724662226963",
};
