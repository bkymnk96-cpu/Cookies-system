const KeyValueStore = require('../models/KeyValueStore');

async function get(namespace, key) {
  const doc = await KeyValueStore.findOne({ namespace, key }).lean();
  return doc ? doc.value : undefined;
}

async function set(namespace, key, value) {
  await KeyValueStore.updateOne(
    { namespace, key },
    { $set: { value } },
    { upsert: true }
  );
  return value;
}

async function del(namespace, key) {
  await KeyValueStore.deleteOne({ namespace, key });
  return true;
}

async function has(namespace, key) {
  const count = await KeyValueStore.countDocuments({ namespace, key });
  return count > 0;
}

async function push(namespace, key, value) {
  const current = (await get(namespace, key)) || [];
  if (!Array.isArray(current)) throw new Error(`Cannot push into non-array key: ${key}`);
  current.push(value);
  await set(namespace, key, current);
  return current;
}

module.exports = { get, set, delete: del, has, push };
