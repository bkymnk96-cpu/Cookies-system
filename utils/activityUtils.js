const keyValueService = require("../services/keyValueService");

const ACTIVITY_NAMESPACE = "activityDB";
const activeVoiceSessions = new Map();

// الفترات الزمنية المعتمدة
const TIMEFRAMES = ["alltime", "daily", "weekly", "monthly"];

function voiceSessionKey(guildId, userId) {
  return `${guildId}:${userId}`;
}

function normalizeScores(scores) {
  return scores && typeof scores === "object" && !Array.isArray(scores) ? scores : {};
}

// جلب نقاط الكتابي لفترة معينة (الافتراضي: الشامل)
async function getTextScores(guildId, timeframe = "alltime") {
  return normalizeScores(await keyValueService.get(ACTIVITY_NAMESPACE, `text_${guildId}_${timeframe}`));
}

// جلب نقاط الصوتي لفترة معينة مع إضافة الجلسات النشطة حالياً للحساب الفوري
async function getVoiceScores(guildId, timeframe = "alltime", includeActive = true) {
  const scores = normalizeScores(await keyValueService.get(ACTIVITY_NAMESPACE, `voice_${guildId}_${timeframe}`));
  if (includeActive) {
    const now = Date.now();
    for (const [key, session] of activeVoiceSessions.entries()) {
      if (!key.startsWith(`${guildId}:`)) continue;
      const current = Number(scores[session.userId] || 0);
      scores[session.userId] = current + Math.max(0, now - session.startedAt);
    }
  }
  return scores;
}

// زيادة نقاط الكتابي في كل الفترات الزمنية بالتزامن
async function incrementTextActivity(guildId, userId, amount = 1) {
  for (const tf of TIMEFRAMES) {
    const scores = normalizeScores(await keyValueService.get(ACTIVITY_NAMESPACE, `text_${guildId}_${tf}`));
    scores[userId] = Number(scores[userId] || 0) + amount;
    await keyValueService.set(ACTIVITY_NAMESPACE, `text_${guildId}_${tf}`, scores);
  }
}

// زيادة نقاط الصوتي في كل الفترات الزمنية بالتزامن
async function addVoiceActivity(guildId, userId, durationMs) {
  const safeDuration = Math.max(0, Number(durationMs) || 0);
  if (!safeDuration) return;
  for (const tf of TIMEFRAMES) {
    const scores = normalizeScores(await keyValueService.get(ACTIVITY_NAMESPACE, `voice_${guildId}_${tf}`));
    scores[userId] = Number(scores[userId] || 0) + safeDuration;
    await keyValueService.set(ACTIVITY_NAMESPACE, `voice_${guildId}_${tf}`, scores);
  }
}

async function trackTextActivity(message) {
  if (!message?.guild || message.author?.bot) return false;
  await incrementTextActivity(message.guild.id, message.author.id, 1);
  return true;
}

function startVoiceSession(guildId, userId) {
  activeVoiceSessions.set(voiceSessionKey(guildId, userId), {
    guildId,
    userId,
    startedAt: Date.now(),
  });
}

async function endVoiceSession(guildId, userId) {
  const key = voiceSessionKey(guildId, userId);
  const session = activeVoiceSessions.get(key);
  if (!session) return;
  activeVoiceSessions.delete(key);
  await addVoiceActivity(guildId, userId, Date.now() - session.startedAt);
}

async function handleVoiceStateActivity(oldState, newState) {
  const member = newState?.member || oldState?.member;
  if (!member || member.user?.bot) return false;

  const guildId = (newState?.guild || oldState?.guild)?.id;
  const userId = member.id;
  const oldChannelId = oldState?.channelId || null;
  const newChannelId = newState?.channelId || null;

  if (!guildId || oldChannelId === newChannelId) return false;

  if (!oldChannelId && newChannelId) {
    startVoiceSession(guildId, userId);
    return true;
  }

  if (oldChannelId && !newChannelId) {
    await endVoiceSession(guildId, userId);
    return true;
  }

  return true;
}

function initializeVoiceSessions(client) {
  const now = Date.now();
  client.guilds.cache.forEach((guild) => {
    guild.voiceStates.cache.forEach((state) => {
      if (!state.member || state.member.user?.bot || !state.channelId) return;
      activeVoiceSessions.set(voiceSessionKey(guild.id, state.member.id), {
        guildId: guild.id,
        userId: state.member.id,
        startedAt: now,
      });
    });
  });
}

function getTopEntries(scores, limit) {
  return Object.entries(normalizeScores(scores))
    .map(([userId, value]) => [userId, Number(value) || 0])
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}

// دالة لحساب ترتيب مستدعي الأمر ونقاطه
function getUserRankAndScore(scores, userId) {
  const sorted = Object.entries(normalizeScores(scores))
    .map(([id, val]) => [id, Number(val) || 0])
    .filter(([, val]) => val > 0)
    .sort((a, b) => b[1] - a[1]);

  const index = sorted.findIndex(([id]) => id === userId);
  if (index === -1) return { rank: "?", score: 0 };
  return { rank: index + 1, score: sorted[index][1] };
}

// دالة لحساب وقت التصفير القادم بالـ Unix Timestamp لديسكورد
function getNextResetTimestamp(timeframe) {
  const now = new Date();
  if (timeframe === "daily") {
    const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    return Math.floor(next.getTime() / 1000);
  }
  if (timeframe === "weekly") {
    const resultDate = new Date(now.getTime());
    resultDate.setDate(now.getDate() + ((7 - now.getDay() + 1) % 7 || 7));
    resultDate.setHours(0, 0, 0, 0);
    return Math.floor(resultDate.getTime() / 1000);
  }
  if (timeframe === "monthly") {
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return Math.floor(next.getTime() / 1000);
  }
  return null;
}

function formatVoiceDuration(ms) {
  const totalSeconds = Math.floor(Math.max(0, Number(ms) || 0) / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const parts = [];
  if (days) parts.push(`${days} يوم`);
  if (hours) parts.push(`${hours} ساعة`);
  if (minutes) parts.push(`${minutes} دقيقة`);
  if (!parts.length) parts.push("أقل من دقيقة");
  return parts.join(" و ");
}

module.exports = {
  trackTextActivity,
  handleVoiceStateActivity,
  initializeVoiceSessions,
  getTextScores,
  getVoiceScores,
  getTopEntries,
  getUserRankAndScore,
  getNextResetTimestamp,
  formatVoiceDuration,
};