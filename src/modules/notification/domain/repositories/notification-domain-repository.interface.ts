import {
  NotificationEntity,
  NotificationType,
  NotificationEntityType,
} from '../notification.entity';

/**
 * Domain repository interface for Notification aggregate
 * This interface defines the contract for notification persistence operations
 */
export interface INotificationDomainRepository {
  // Basic CRUD operations
  save(notification: NotificationEntity): Promise<NotificationEntity>;
  findById(id: string): Promise<NotificationEntity | null>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;

  // Query operations
  findByUserId(
    userId: string,
    filters: {
      isRead?: boolean;
      type?: NotificationType;
      entityType?: NotificationEntityType;
      page: number;
      limit: number;
      sortBy?: 'newest' | 'oldest';
    },
  ): Promise<{
    notifications: NotificationEntity[];
    total: number;
    unreadCount: number;
  }>;

  findAll(filters: {
    userId?: string;
    isRead?: boolean;
    type?: NotificationType;
    entityType?: NotificationEntityType;
    entityId?: string;
    page: number;
    limit: number;
    sortBy?: 'newest' | 'oldest';
  }): Promise<{
    notifications: NotificationEntity[];
    total: number;
  }>;

  // Bulk operations
  findByIds(ids: string[]): Promise<NotificationEntity[]>;

  markAsReadBulk(notificationIds: string[], userId: string): Promise<void>;

  markAsUnreadBulk(notificationIds: string[], userId: string): Promise<void>;

  deleteBulk(notificationIds: string[], userId: string): Promise<void>;

  // Entity-related operations
  findByEntity(
    entityId: string,
    entityType: NotificationEntityType,
    userId?: string,
  ): Promise<NotificationEntity[]>;

  deleteByEntity(
    entityId: string,
    entityType: NotificationEntityType,
    userId?: string,
  ): Promise<void>;

  // Statistics and counts
  getUnreadCount(userId: string): Promise<number>;

  getUnreadCountByType(userId: string, type: NotificationType): Promise<number>;

  // Cleanup operations
  deleteOldNotifications(olderThanDays: number): Promise<number>;

  deleteReadNotifications(
    userId: string,
    olderThanDays: number,
  ): Promise<number>;

  // Notification preferences (if needed)
  findUserNotificationPreferences(userId: string): Promise<{
    enabledTypes: NotificationType[];
    mutedEntityIds: string[];
  } | null>;

  // Real-time operations
  getLatestNotifications(
    userId: string,
    sinceTimestamp: Date,
    limit?: number,
  ): Promise<NotificationEntity[]>;
}
