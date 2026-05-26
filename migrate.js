const fs = require('fs');
const path = require('path');
const { connectDatabase } = require('./handlers/database');
const keyValueService = require('./services/keyValueService');

const DB_ROOT = path.join(__dirname, 'Json-db');
const BACKUP_DIR = path.join(__dirname, 'backup-json-db');

async function migrateFile(filePath) {
  const rel = path.relative(__dirname, filePath).replace(/\\/g, '/');
  const namespace = `/${rel.replace(/\.json$/i, '')}`;
  let raw;

  try {
    raw = fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`[migrate] Failed to read ${rel}:`, error.message);
    return;
  }

  let parsed;
  try {
    parsed = JSON.parse(raw || '{}');
  } catch (error) {
    console.error(`[migrate] Invalid JSON ${rel}:`, error.message);
    return;
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    await keyValueService.set(namespace, '__root__', parsed);
    console.log(`[migrate] migrated root payload for ${rel}`);
    return;
  }

  const entries = Object.entries(parsed);
  for (const [key, value] of entries) {
    await keyValueService.set(namespace, key, value);
  }

  console.log(`[migrate] migrated ${entries.length} keys from ${rel}`);
}

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) out.push(...walk(full));
    else if (entry.endsWith('.json')) out.push(full);
  }
  return out;
}

async function main() {
  await connectDatabase();

  if (fs.existsSync(DB_ROOT)) {
    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const stamp = new Date().toISOString().replace(/[.:]/g, '-');
    const backupPath = path.join(BACKUP_DIR, `Json-db-${stamp}`);
    fs.cpSync(DB_ROOT, backupPath, { recursive: true });
    console.log(`[migrate] backup created at ${backupPath}`);

    const files = walk(DB_ROOT);
    for (const file of files) {
      await migrateFile(file);
    }
  } else {
    console.warn('[migrate] Json-db directory not found, nothing to migrate');
  }

  console.log('[migrate] done');
  process.exit(0);
}

main().catch((err) => {
  console.error('[migrate] failed:', err);
  process.exit(1);
});
