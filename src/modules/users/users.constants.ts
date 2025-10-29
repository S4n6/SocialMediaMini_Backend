/**
 * User Module Constants
 * Contains dependency injection tokens and module-specific constants
 */

// Dependency Injection Tokens
export const USER_REPOSITORY_TOKEN = Symbol('USER_REPOSITORY');
export const EVENT_BUS_TOKEN = Symbol('EVENT_BUS');

// Business Constants
export const USER_CONSTANTS = {
  // Profile update restrictions
  PROFILE_UPDATE_COOLDOWN_HOURS: 24,

  // Following limits
  MAX_FOLLOWING_COUNT: 7500,
  NEW_ACCOUNT_DAILY_FOLLOW_LIMIT: 20,

  // Popular user threshold
  POPULAR_USER_FOLLOWER_THRESHOLD: 10000,

  // Account restrictions
  POST_CREATION_MINIMUM_ACCOUNT_AGE_HOURS: 1,

  // Validation limits
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 30,
  FULL_NAME_MIN_LENGTH: 2,
  FULL_NAME_MAX_LENGTH: 100,
  BIO_MAX_LENGTH: 500,
  USER_ID_MAX_LENGTH: 36,
} as const;

// Cache keys
export const USER_CACHE_KEYS = {
  USER_BY_ID: (id: string) => `user:${id}`,
  USER_FOLLOWING: (id: string) => `user:${id}:following`,
  USER_FOLLOWERS: (id: string) => `user:${id}:followers`,
  USER_STATS: (id: string) => `user:${id}:stats`,
} as const;

// Event names
export const USER_EVENTS = {
  REGISTERED: 'user.registered',
  FOLLOWED: 'user.followed',
  UNFOLLOWED: 'user.unfollowed',
  PROFILE_UPDATED: 'user.profile.updated',
  EMAIL_VERIFIED: 'user.email.verified',
} as const;
