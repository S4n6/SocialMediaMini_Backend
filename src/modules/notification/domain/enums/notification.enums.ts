/**
 * Notification Domain Enums
 *
 * Contains all enums used in the notification domain.
 * Separated from entities to follow Clean Architecture principles.
 */

/**
 * Types of notifications supported by the system
 */
export enum NotificationType {
  LIKE = 'like',
  COMMENT = 'comment',
  FOLLOW = 'follow',
  MESSAGE = 'message',
  POST_MENTION = 'post_mention',
  COMMENT_MENTION = 'comment_mention',
  SYSTEM = 'system',
  FRIEND_REQUEST = 'friend_request',
  BIRTHDAY = 'birthday',
  POST_SHARE = 'post_share',
}

/**
 * Types of entities that can be referenced in notifications
 */
export enum NotificationEntityType {
  POST = 'post',
  USER = 'user',
  COMMENT = 'comment',
  MESSAGE = 'message',
}

/**
 * Notification status for processing
 */
export enum NotificationStatus {
  PENDING = 'pending',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  READ = 'read',
}

/**
 * Priority levels for notifications
 */
export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}
