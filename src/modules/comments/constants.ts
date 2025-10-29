/**
 * Comments Module Constants & DI Tokens
 *
 * This file contains all dependency injection tokens and constants
 * used throughout the comments module to ensure consistent naming
 * and avoid magic strings.
 */

// ========== DEPENDENCY INJECTION TOKENS ==========

/**
 * Domain Layer Tokens
 */
export const COMMENT_TOKENS = {
  // Repositories
  COMMENT_REPOSITORY: 'COMMENT_REPOSITORY',

  // Domain Services
  COMMENT_DOMAIN_SERVICE: 'COMMENT_DOMAIN_SERVICE',
} as const;

/**
 * Application Layer Tokens
 */
export const APPLICATION_TOKENS = {
  // Application Services
  COMMENT_APPLICATION_SERVICE: 'COMMENT_APPLICATION_SERVICE',
  COMMENT_ENRICHMENT_SERVICE: 'COMMENT_ENRICHMENT_SERVICE',

  // Mappers
  COMMENT_MAPPER: 'COMMENT_MAPPER',
} as const;

/**
 * Infrastructure Layer Tokens
 */
export const INFRASTRUCTURE_TOKENS = {
  // External Service Adapters
  USER_SERVICE_ADAPTER: 'USER_SERVICE_ADAPTER',
  POST_SERVICE_ADAPTER: 'POST_SERVICE_ADAPTER',
} as const;

// ========== BUSINESS CONSTANTS ==========

/**
 * Comment Business Rules
 */
export const COMMENT_CONSTANTS = {
  // Content validation
  MIN_CONTENT_LENGTH: 1,
  MAX_CONTENT_LENGTH: 1000,

  // Reply nesting
  MAX_REPLY_DEPTH: 3,

  // Pagination defaults
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,

  // Sorting options
  SORT_OPTIONS: {
    NEWEST: 'newest',
    OLDEST: 'oldest',
    POPULAR: 'popular',
  },
} as const;

/**
 * Reaction Types (matching domain entity)
 */
export const REACTION_TYPES = {
  LIKE: 'like',
  LOVE: 'love',
  LAUGH: 'laugh',
  ANGRY: 'angry',
  SAD: 'sad',
} as const;

// ========== ERROR MESSAGES ==========

/**
 * Standard error messages for consistency
 */
export const ERROR_MESSAGES = {
  // Not found errors
  COMMENT_NOT_FOUND: 'Comment not found',
  USER_NOT_FOUND: 'User not found',
  POST_NOT_FOUND: 'Post not found',

  // Validation errors
  INVALID_CONTENT: 'Comment content is invalid',
  CONTENT_TOO_SHORT: 'Comment content is too short',
  CONTENT_TOO_LONG: 'Comment content is too long',

  // Business rule violations
  UNAUTHORIZED_ACTION: 'Unauthorized to perform this action',
  REPLY_DEPTH_EXCEEDED: 'Maximum reply depth exceeded',
  PARENT_COMMENT_MISMATCH: 'Parent comment does not belong to the same post',

  // Reaction errors
  REACTION_ALREADY_EXISTS: 'User has already reacted with this type',
  REACTION_NOT_FOUND: 'User reaction not found',
} as const;

// ========== TYPE EXPORTS ==========

/**
 * Type-safe token access
 */
export type CommentToken = (typeof COMMENT_TOKENS)[keyof typeof COMMENT_TOKENS];
export type ApplicationToken =
  (typeof APPLICATION_TOKENS)[keyof typeof APPLICATION_TOKENS];
export type InfrastructureToken =
  (typeof INFRASTRUCTURE_TOKENS)[keyof typeof INFRASTRUCTURE_TOKENS];
export type ReactionType = (typeof REACTION_TYPES)[keyof typeof REACTION_TYPES];
export type SortOption =
  (typeof COMMENT_CONSTANTS.SORT_OPTIONS)[keyof typeof COMMENT_CONSTANTS.SORT_OPTIONS];
