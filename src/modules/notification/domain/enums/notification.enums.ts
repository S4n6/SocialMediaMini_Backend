/**
 * Notification Domain Enums
 *
 * Aligned with Prisma schema enum values.
 */

/** Source types — what triggered the notification */
export enum NotificationType {
  LIKE = 'LIKE',
  COMMENT = 'COMMENT',
  FOLLOW = 'FOLLOW',
  FOLLOW_REQUEST = 'FOLLOW_REQUEST',
  MESSAGE = 'MESSAGE',
  MENTION = 'MENTION',
  MEDIA_PROCESSED = 'MEDIA_PROCESSED',
  SYSTEM = 'SYSTEM',
}

/** Entity the notification refers to — mirrors Prisma `NotificationEntity` */
export enum NotificationEntityType {
  POST = 'POST',
  COMMENT = 'COMMENT',
  USER = 'USER',
  STORY = 'STORY',
  FOLLOW = 'FOLLOW',
  MESSAGE = 'MESSAGE',
}
