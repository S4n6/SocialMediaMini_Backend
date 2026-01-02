// Module tokens for dependency injection
export const EXTERNAL_POST_SERVICE = Symbol('ExternalPostService');
export const EXTERNAL_COMMENT_SERVICE = Symbol('ExternalCommentService');
export const EXTERNAL_USER_SERVICE = Symbol('ExternalUserService');
export const NOTIFICATION_SERVICE = Symbol('NotificationService');
export const EVENT_BUS = Symbol('EventBus');

// Domain constants
export const REACTION_TYPES = {
  LIKE: 'LIKE',
  LOVE: 'LOVE',
  HAHA: 'HAHA',
  WOW: 'WOW',
  SAD: 'SAD',
  ANGRY: 'ANGRY',
} as const;

export type ReactionType = (typeof REACTION_TYPES)[keyof typeof REACTION_TYPES];

export const VALID_REACTION_TYPES: ReactionType[] =
  Object.values(REACTION_TYPES);

// Business rules constants
export const REACTION_BUSINESS_RULES = {
  MAX_REACTIONS_PER_USER_PER_TARGET: 1,
  ALLOWED_TARGET_TYPES: ['post', 'comment'] as const,
} as const;

export type TargetType =
  (typeof REACTION_BUSINESS_RULES.ALLOWED_TARGET_TYPES)[number];

// Repository injection tokens
export const REACTION_BASE_REPOSITORY = Symbol('IReactionBaseRepository');
export const REACTION_FINDER_REPOSITORY = Symbol('IReactionFinderRepository');
export const REACTION_STATS_REPOSITORY = Symbol('IReactionStatsRepository');
