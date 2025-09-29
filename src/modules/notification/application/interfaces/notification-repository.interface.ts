import {
  CreateNotificationDto,
  UpdateNotificationDto,
  NotificationResponseDto,
  NotificationListResponseDto,
  NotificationStatsDto,
  NotificationQueryDto,
} from '../dto/notification.dto';

/**
 * Application repository interface for Notification operations
 * This interface is used by use cases and is implemented by infrastructure layer
 */
export interface INotificationRepository {
  // Basic CRUD operations
  create(dto: CreateNotificationDto): Promise<NotificationResponseDto>;

  findById(id: string): Promise<NotificationResponseDto | null>;

  update(
    id: string,
    dto: UpdateNotificationDto,
  ): Promise<NotificationResponseDto>;

  delete(id: string): Promise<void>;

  exists(id: string): Promise<boolean>;

  // Query operations
  findByUserId(
    userId: string,
    query: NotificationQueryDto,
  ): Promise<NotificationListResponseDto>;

  findAll(
    query: NotificationQueryDto & { userId?: string },
  ): Promise<NotificationListResponseDto>;

  // Bulk operations
  markAsReadBulk(notificationIds: string[], userId: string): Promise<void>;

  markAsUnreadBulk(notificationIds: string[], userId: string): Promise<void>;

  deleteBulk(notificationIds: string[], userId: string): Promise<void>;

  // Statistics
  getStats(userId: string): Promise<NotificationStatsDto>;

  getUnreadCount(userId: string): Promise<number>;

  // Real-time operations
  getLatestNotifications(
    userId: string,
    sinceTimestamp: Date,
    limit?: number,
  ): Promise<NotificationResponseDto[]>;

  // Cleanup operations
  cleanupOldNotifications(olderThanDays: number): Promise<number>;

  cleanupReadNotifications(
    userId: string,
    olderThanDays: number,
  ): Promise<number>;
}
