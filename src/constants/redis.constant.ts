export const REDIS = {
  URL: process.env.REDIS_URL,
  URL_WORKER: process.env.REDIS_URL_WORKER,
  TTL_POSTS: 5 * 60 * 1000, // minutes in milliseconds
} as const;
