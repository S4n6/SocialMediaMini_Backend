/**
 * Notification Module Constants & Dependency Injection Tokens
 *
 * This file contains all constants and DI tokens used throughout the notification module.
 * Following Clean Architecture principles, tokens are defined here to avoid circular dependencies.
 */

// =============================================================================
// DEPENDENCY INJECTION TOKENS
// =============================================================================

/**
 * Domain Repository Interface Token
 * Used to inject the domain repository implementation
 */
export const NOTIFICATION_REPOSITORY_TOKEN = 'INotificationDomainRepository';

/**
 * Application Repository Interface Token
 * Used to inject the application repository implementation
 */
export const NOTIFICATION_APPLICATION_REPOSITORY_TOKEN =
  'INotificationApplicationRepository';

/**
 * External Service Tokens
 */
export const EMAIL_NOTIFICATION_SERVICE_TOKEN = 'IEmailNotificationService';
export const PUSH_NOTIFICATION_SERVICE_TOKEN = 'IPushNotificationService';
export const REALTIME_NOTIFICATION_SERVICE_TOKEN =
  'IRealtimeNotificationService';

/**
 * Domain Event Publisher Token
 */
export const DOMAIN_EVENT_PUBLISHER_TOKEN = 'IDomainEventPublisher';

// =============================================================================
// MODULE CONSTANTS
// =============================================================================

/**
 * Default pagination settings
 */
export const NOTIFICATION_PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1,
} as const;

/**
 * Notification content limits
 */
export const NOTIFICATION_LIMITS = {
  TITLE_MAX_LENGTH: 200,
  CONTENT_MAX_LENGTH: 1000,
  BULK_ACTION_MAX_COUNT: 100,
} as const;

/**
 * Cleanup settings
 */
export const NOTIFICATION_CLEANUP = {
  DEFAULT_CLEANUP_DAYS: 30,
  SYSTEM_CLEANUP_DAYS: 90,
  MAX_CLEANUP_DAYS: 365,
  MIN_CLEANUP_DAYS: 1,
} as const;

/**
 * Real-time notification settings
 */
export const NOTIFICATION_REALTIME = {
  DEFAULT_REALTIME_LIMIT: 50,
  MAX_REALTIME_LIMIT: 200,
  WEBSOCKET_ROOM_PREFIX: 'notification_user_',
  EVENT_NAMES: {
    NEW_NOTIFICATION: 'new_notification',
    NOTIFICATION_READ: 'notification_read',
    NOTIFICATION_DELETED: 'notification_deleted',
    BULK_READ: 'notifications_bulk_read',
  },
} as const;

/**
 * Queue names and job priorities
 */
export const NOTIFICATION_QUEUE = {
  MAIN_QUEUE: 'notification',
  EMAIL_QUEUE: 'notification-email',
  PUSH_QUEUE: 'notification-push',
  CLEANUP_QUEUE: 'notification-cleanup',
  JOB_PRIORITIES: {
    HIGH: 10,
    NORMAL: 5,
    LOW: 1,
  },
} as const;

/**
 * Cache settings
 */
export const NOTIFICATION_CACHE = {
  STATS_TTL: 300, // 5 minutes
  UNREAD_COUNT_TTL: 60, // 1 minute
  USER_NOTIFICATIONS_TTL: 180, // 3 minutes
  CACHE_KEY_PREFIX: 'notification:',
  STATS_KEY_SUFFIX: ':stats',
  UNREAD_KEY_SUFFIX: ':unread_count',
  LIST_KEY_SUFFIX: ':list',
} as const;

// =============================================================================
// ERROR CODES & MESSAGES
// =============================================================================

/**
 * Domain error codes
 */
export const NOTIFICATION_ERROR_CODES = {
  // Validation errors
  INVALID_TYPE: 'NOTIFICATION_INVALID_TYPE',
  INVALID_CONTENT: 'NOTIFICATION_INVALID_CONTENT',
  EMPTY_TITLE: 'NOTIFICATION_EMPTY_TITLE',
  EMPTY_CONTENT: 'NOTIFICATION_EMPTY_CONTENT',
  INVALID_USER_ID: 'NOTIFICATION_INVALID_USER_ID',

  // State errors
  ALREADY_READ: 'NOTIFICATION_ALREADY_READ',
  ALREADY_UNREAD: 'NOTIFICATION_ALREADY_UNREAD',

  // Not found errors
  NOT_FOUND: 'NOTIFICATION_NOT_FOUND',
  USER_NOT_FOUND: 'NOTIFICATION_USER_NOT_FOUND',

  // Access errors
  ACCESS_DENIED: 'NOTIFICATION_ACCESS_DENIED',
  UNAUTHORIZED: 'NOTIFICATION_UNAUTHORIZED',

  // Business logic errors
  BULK_ACTION_LIMIT_EXCEEDED: 'NOTIFICATION_BULK_ACTION_LIMIT_EXCEEDED',
  CLEANUP_INVALID_DAYS: 'NOTIFICATION_CLEANUP_INVALID_DAYS',
} as const;

/**
 * Success messages for logging/auditing
 */
export const NOTIFICATION_SUCCESS_MESSAGES = {
  CREATED: 'Notification created successfully',
  UPDATED: 'Notification updated successfully',
  DELETED: 'Notification deleted successfully',
  MARKED_READ: 'Notification marked as read',
  MARKED_UNREAD: 'Notification marked as unread',
  BULK_READ: 'Notifications marked as read in bulk',
  BULK_UNREAD: 'Notifications marked as unread in bulk',
  BULK_DELETED: 'Notifications deleted in bulk',
  CLEANUP_COMPLETED: 'Notification cleanup completed',
} as const;
