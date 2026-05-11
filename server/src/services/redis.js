const Redis = require('ioredis');

let client;

if (process.env.REDIS_URL) {

  client = new Redis(process.env.REDIS_URL, {

    // Never crash app on retry limit
    maxRetriesPerRequest: null,

    // Queue commands while reconnecting
    enableOfflineQueue: true,

    // Retry reconnect automatically
    retryStrategy(times) {
      console.log(`🔄 Redis reconnect attempt ${times}`);

      // retry after increasing delay
      return Math.min(times * 1000, 5000);
    },
  });

  // Connected
  client.on('connect', () => {
    console.log('✅ Redis connected');
  });

  // Error handling
  client.on('error', (err) => {
    console.warn('⚠️ Redis error:', err.message);
  });

} else {

  // Fallback if Redis unavailable
  console.warn('⚠️ REDIS_URL not set — using in-memory store');

  const store = new Map();

  client = {

    get: async (k) => store.get(k) ?? null,

    set: async (k, v) => {
      store.set(k, v);
      return 'OK';
    },

    del: async (k) => {
      store.delete(k);
      return 1;
    },

    expire: async () => 1,

    lrange: async (k, s, e) => {
      const arr = store.get(k) || [];
      return e === -1 ? arr.slice(s) : arr.slice(s, e + 1);
    },

    rpush: async (k, ...vals) => {
      const arr = store.get(k) || [];
      arr.push(...vals);
      store.set(k, arr);
      return arr.length;
    },

    ltrim: async (k, s, e) => {
      const arr = store.get(k) || [];
      store.set(k, arr.slice(s, e + 1));
      return 'OK';
    },
  };
}

module.exports = client;