import Redis from 'ioredis';

declare global {
  // eslint-disable-next-line no-var
  var __myapp_redis: Redis | undefined;
}

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

let redis: Redis | null = null;

if (!globalThis.__myapp_redis) {
  globalThis.__myapp_redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 2,
    enableReadyCheck: true,
    lazyConnect: false,
  });
}
redis = globalThis.__myapp_redis;

export default redis;
