import { Injectable } from '@nestjs/common';
import { CreateNotificationUseCase } from './use-cases/create-notification.use-case';
import { GetNotificationUseCase } from './use-cases/get-notification.use-case';
import { GetNotificationsUseCase } from './use-cases/get-notifications.use-case';
import { UpdateNotificationUseCase } from './use-cases/update-notification.use-case';
import { MarkAsReadUseCase } from './use-cases/mark-as-read.use-case';
import { MarkAsUnreadUseCase } from './use-cases/mark-as-unread.use-case';
import { DeleteNotificationUseCase } from './use-cases/delete-notification.use-case';
import { GetNotificationStatsUseCase } from './use-cases/get-notification-stats.use-case';
import { GetRealtimeNotificationsUseCase } from './use-cases/get-realtime-notifications.use-case';
import {
  NotificationCleanupUseCase,
  CleanupResult,
} from './use-cases/notification-cleanup.use-case';
import {
  CreateNotificationDto,
  UpdateNotificationDto,
  NotificationResponseDto,
  NotificationListResponseDto,
  NotificationQueryDto,
  NotificationStatsDto,
} from './dto/notification.dto';

/**
 * Application service that orchestrates notification use cases
 * This is the main entry point for the notification module's application layer
 */
@Injectable()
export class NotificationApplicationService {
  constructor(
    private readonly createNotificationUseCase: CreateNotificationUseCase,
    private readonly getNotificationUseCase: GetNotificationUseCase,
    private readonly getNotificationsUseCase: GetNotificationsUseCase,
    private readonly updateNotificationUseCase: UpdateNotificationUseCase,
    private readonly markAsReadUseCase: MarkAsReadUseCase,
    private readonly markAsUnreadUseCase: MarkAsUnreadUseCase,
    private readonly deleteNotificationUseCase: DeleteNotificationUseCase,
    private readonly getNotificationStatsUseCase: GetNotificationStatsUseCase,
    private readonly getRealtimeNotificationsUseCase: GetRealtimeNotificationsUseCase,
    private readonly notificationCleanupUseCase: NotificationCleanupUseCase,
  ) {}

  // Basic CRUD operations
  async createNotification(
    dto: CreateNotificationDto,
  ): Promise<NotificationResponseDto> {
    return await this.createNotificationUseCase.execute(dto);
  }

  async getNotification(
    notificationId: string,
    userId: string,
  ): Promise<NotificationResponseDto> {
    return await this.getNotificationUseCase.execute(notificationId, userId);
  }

  async getNotifications(
    userId: string,
    query: NotificationQueryDto,
  ): Promise<NotificationListResponseDto> {
    return await this.getNotificationsUseCase.execute(userId, query);
  }

  async updateNotification(
    notificationId: string,
    userId: string,
    dto: UpdateNotificationDto,
  ): Promise<NotificationResponseDto> {
    return await this.updateNotificationUseCase.execute(
      notificationId,
      userId,
      dto,
    );
  }

  // Read status operations
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    return await this.markAsReadUseCase.executeSingle(notificationId, userId);
  }

  async markAsReadBulk(
    notificationIds: string[],
    userId: string,
  ): Promise<void> {
    return await this.markAsReadUseCase.executeBulk(notificationIds, userId);
  }

  async markAllAsRead(userId: string): Promise<void> {
    return await this.markAsReadUseCase.executeAll(userId);
  }

  async markAsUnread(notificationId: string, userId: string): Promise<void> {
    return await this.markAsUnreadUseCase.executeSingle(notificationId, userId);
  }

  async markAsUnreadBulk(
    notificationIds: string[],
    userId: string,
  ): Promise<void> {
    return await this.markAsUnreadUseCase.executeBulk(notificationIds, userId);
  }

  // Delete operations
  async deleteNotification(
    notificationId: string,
    userId: string,
  ): Promise<void> {
    return await this.deleteNotificationUseCase.executeSingle(
      notificationId,
      userId,
    );
  }

  async deleteNotificationsBulk(
    notificationIds: string[],
    userId: string,
  ): Promise<void> {
    return await this.deleteNotificationUseCase.executeBulk(
      notificationIds,
      userId,
    );
  }

  async cleanupReadNotifications(
    userId: string,
    olderThanDays: number = 30,
  ): Promise<number> {
    return await this.deleteNotificationUseCase.executeReadCleanup(
      userId,
      olderThanDays,
    );
  }

  async deleteAllNotifications(userId: string): Promise<void> {
    return await this.deleteNotificationUseCase.executeAllForUser(userId);
  }

  // Statistics operations
  async getNotificationStats(userId: string): Promise<NotificationStatsDto> {
    return await this.getNotificationStatsUseCase.execute(userId);
  }

  async getUnreadCount(userId: string): Promise<number> {
    return await this.getNotificationStatsUseCase.getUnreadCount(userId);
  }

  async getStatsByPeriod(
    userId: string,
    days: number = 30,
  ): Promise<NotificationStatsDto & { period: string }> {
    return await this.getNotificationStatsUseCase.getStatsByPeriod(
      userId,
      days,
    );
  }

  // Real-time operations (for WebSocket/SSE)
  async getLatestNotifications(
    userId: string,
    sinceTimestamp: Date,
    limit: number = 50,
  ): Promise<NotificationResponseDto[]> {
    return await this.getRealtimeNotificationsUseCase.execute(
      userId,
      sinceTimestamp,
      limit,
    );
  }

  async getUnreadNotifications(
    userId: string,
    limit: number = 20,
  ): Promise<NotificationResponseDto[]> {
    return await this.getRealtimeNotificationsUseCase.getUnreadNotifications(
      userId,
      limit,
    );
  }

  async getNotificationsInRange(
    userId: string,
    startTime: Date,
    endTime: Date,
    limit: number = 100,
  ): Promise<NotificationResponseDto[]> {
    return await this.getRealtimeNotificationsUseCase.getNotificationsInRange(
      userId,
      startTime,
      endTime,
      limit,
    );
  }

  // Cleanup operations
  async cleanupUserReadNotifications(
    userId: string,
    olderThanDays: number = 30,
  ): Promise<CleanupResult> {
    return await this.notificationCleanupUseCase.cleanupUserReadNotifications(
      userId,
      olderThanDays,
    );
  }

  async cleanupSystemOldNotifications(
    olderThanDays: number = 90,
  ): Promise<CleanupResult> {
    return await this.notificationCleanupUseCase.cleanupSystemOldNotifications(
      olderThanDays,
    );
  }

  async cleanupNotificationsByEntity(
    entityId: string,
    entityType: any,
    userId?: string,
  ): Promise<CleanupResult> {
    return await this.notificationCleanupUseCase.cleanupNotificationsByEntity(
      entityId,
      entityType,
      userId,
    );
  }

  async getCleanupStats(
    userId?: string,
    olderThanDays: number = 30,
  ): Promise<{
    totalNotifications: number;
    readNotifications: number;
    oldReadNotifications: number;
    estimatedCleanupCount: number;
  }> {
    return await this.notificationCleanupUseCase.getCleanupStats(
      userId,
      olderThanDays,
    );
  }
}
