export const REDIS = {
  URL: process.env.REDIS_URL,
  TTL_POSTS: 5 * 60 * 1000, // minutes in milliseconds
} as const;
