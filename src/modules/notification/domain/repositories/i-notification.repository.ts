import { NotificationEntity } from '../entities/notification.entity';

/**
 * Domain repository interface — pure TypeScript, no framework imports.
 *
 * Implementation lives in infrastructure/persistence/repositories/.
 * Uses smart-save (upsert) pattern consistent with the project convention.
 */
export interface INotificationRepository {
  /** Upsert — create or update */
  save(notification: NotificationEntity): Promise<void>;

  findById(id: string): Promise<NotificationEntity | null>;

  /** Paginated list for a user, ordered by createdAt DESC */
  findByUserId(
    userId: string,
    options: { page: number; limit: number },
  ): Promise<NotificationEntity[]>;

  /** Unread count badge */
  countUnread(userId: string): Promise<number>;

  /** Bulk mark-all-read (single UPDATE query) */
  markAllAsRead(userId: string): Promise<number>;

  delete(id: string): Promise<void>;

  /**
   * Fetch notifications created after a given timestamp.
   * Used for "missed notifications" on SSE reconnect with Last-Event-ID.
   */
  findAfterTimestamp(userId: string, since: Date): Promise<NotificationEntity[]>;

  /** Cleanup — returns number of deleted rows */
  deleteOlderThan(days: number): Promise<number>;
}
