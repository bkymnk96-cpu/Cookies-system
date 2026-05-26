const mongoose = require('mongoose');

let isConnecting = false;
let connectPromise = null;

async function connectDatabase() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (connectPromise) return connectPromise;

  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is missing in environment variables');
  }

  isConnecting = true;
  let attempts = 0;
  const maxAttempts = 5;

  connectPromise = (async () => {
    while (attempts < maxAttempts) {
      try {
        attempts++;
        await mongoose.connect(uri, {
          autoIndex: true,
          serverSelectionTimeoutMS: 10000,
          maxPoolSize: 20,
        });
        console.log(`[MongoDB] Connected on attempt ${attempts}`);
        isConnecting = false;
        return mongoose.connection;
      } catch (error) {
        console.error(`[MongoDB] Connection attempt ${attempts} failed:`, error.message);
        if (attempts >= maxAttempts) {
          isConnecting = false;
          connectPromise = null;
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, 2000 * attempts));
      }
    }
  })();

  return connectPromise;
}

mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB] Disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('[MongoDB] Reconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('[MongoDB] Error:', err.message);
});

module.exports = {
  connectDatabase,
  mongoose,
  isConnecting: () => isConnecting,
};
