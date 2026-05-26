const { connectDatabase } = require('../handlers/database');
const kv = require('../services/keyValueService');

class Database {
  constructor(namespace) {
    this.namespace = String(namespace || 'default');
  }

  normalizeKey(key) {
    return String(key);
  }

  async get(key) {
    await connectDatabase();
    return kv.get(this.namespace, this.normalizeKey(key));
  }

  async set(key, value) {
    await connectDatabase();
    return kv.set(this.namespace, this.normalizeKey(key), value);
  }

  async delete(key) {
    await connectDatabase();
    return kv.delete(this.namespace, this.normalizeKey(key));
  }

  async has(key) {
    await connectDatabase();
    return kv.has(this.namespace, this.normalizeKey(key));
  }

  async push(key, value) {
    await connectDatabase();
    return kv.push(this.namespace, this.normalizeKey(key), value);
  }
}

module.exports = { Database };
