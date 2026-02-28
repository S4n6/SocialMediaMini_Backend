/**
 * Dependency Injection Tokens for Follow Module
 */

// Repository Interface Tokens
export const FOLLOW_REPOSITORY_TOKEN = 'FOLLOW_REPOSITORY';

// External Service Tokens (Application Ports)
export const EXTERNAL_USER_SERVICE_TOKEN = 'EXTERNAL_USER_SERVICE';
export const NOTIFICATION_SERVICE_TOKEN = 'NOTIFICATION_SERVICE';

/**
 * @deprecated Use flat token constants instead.
 * Kept for backward compatibility during migration.
 */
export const FOLLOW_MODULE_TOKENS = {
  FOLLOW_REPOSITORY: FOLLOW_REPOSITORY_TOKEN,
  EXTERNAL_USER_SERVICE: EXTERNAL_USER_SERVICE_TOKEN,
  NOTIFICATION_SERVICE: NOTIFICATION_SERVICE_TOKEN,
} as const;

export const FOLLOW_MODULE_CONSTANTS = {
  // Business Rules
  MAX_FOLLOWING_LIMIT: 5000,
  MAX_FOLLOWERS_LIMIT: 10000,

  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,

  // Messages
  MESSAGES: {
    FOLLOW_SUCCESS: 'User followed successfully',
    UNFOLLOW_SUCCESS: 'User unfollowed successfully',
    FOLLOWERS_RETRIEVED: 'Followers retrieved successfully',
    FOLLOWING_RETRIEVED: 'Following list retrieved successfully',
    FOLLOW_STATUS_RETRIEVED: 'Follow status retrieved successfully',
    FOLLOWS_RETRIEVED: 'Follows retrieved successfully',
  },
} as const;
