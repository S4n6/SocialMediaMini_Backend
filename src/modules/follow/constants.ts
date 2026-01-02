// Module constants & tokens
export const FOLLOW_MODULE_TOKENS = {
  // Repository
  FOLLOW_REPOSITORY: 'FOLLOW_REPOSITORY',

  // External Services
  EXTERNAL_USER_SERVICE: 'EXTERNAL_USER_SERVICE',
  NOTIFICATION_SERVICE: 'NOTIFICATION_SERVICE',

  // Domain Services
  FOLLOW_DOMAIN_SERVICE: 'FOLLOW_DOMAIN_SERVICE',

  // Application Services
  FOLLOW_APPLICATION_SERVICE: 'FOLLOW_APPLICATION_SERVICE',
  FOLLOW_ENRICHMENT_SERVICE: 'FOLLOW_ENRICHMENT_SERVICE',
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
