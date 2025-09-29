import { Injectable, Inject } from '@nestjs/common';
import { INotificationDomainRepository } from '../../domain/repositories/notification-domain-repository.interface';
import { NotificationDomainService } from '../../domain/services/notification-domain.service';
import { NotificationResponseDto } from '../dto/notification.dto';
import { NOTIFICATION_REPOSITORY_TOKEN } from './create-notification.use-case';

/**
 * Use case for getting real-time notifications
 * Used for WebSocket/SSE connections to get latest notifications
 */
@Injectable()
export class GetRealtimeNotificationsUseCase {
  constructor(
    private readonly notificationDomainService: NotificationDomainService,
    @Inject(NOTIFICATION_REPOSITORY_TOKEN)
    private readonly notificationRepository: INotificationDomainRepository,
  ) {}

  /**
   * Get latest notifications since a specific timestamp
   */
  async execute(
    userId: string,
    sinceTimestamp: Date,
    limit: number = 50,
  ): Promise<NotificationResponseDto[]> {
    // Get latest notifications from repository
    const notifications =
      await this.notificationRepository.getLatestNotifications(
        userId,
        sinceTimestamp,
        limit,
      );

    // Convert entities to DTOs
    return notifications.map((notification) =>
      this.mapToResponseDto(notification),
    );
  }

  /**
   * Get unread notifications for initial connection
   */
  async getUnreadNotifications(
    userId: string,
    limit: number = 20,
  ): Promise<NotificationResponseDto[]> {
    const result = await this.notificationRepository.findByUserId(userId, {
      isRead: false,
      page: 1,
      limit,
      sortBy: 'newest',
    });

    return result.notifications.map((notification) =>
      this.mapToResponseDto(notification),
    );
  }

  /**
   * Get notifications for a specific time range (used for reconnection)
   */
  async getNotificationsInRange(
    userId: string,
    startTime: Date,
    endTime: Date,
    limit: number = 100,
  ): Promise<NotificationResponseDto[]> {
    // This would need a new method in domain repository for time range queries
    // For now, we'll use the existing method with since timestamp
    const notifications =
      await this.notificationRepository.getLatestNotifications(
        userId,
        startTime,
        limit,
      );

    // Filter by end time
    const filteredNotifications = notifications.filter(
      (notification) => notification.createdAt <= endTime,
    );

    return filteredNotifications.map((notification) =>
      this.mapToResponseDto(notification),
    );
  }

  private mapToResponseDto(notification: any): NotificationResponseDto {
    const priority = this.notificationDomainService.getNotificationPriority(
      notification.type,
    );

    return {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      content: notification.content,
      userId: notification.userId,
      isRead: notification.isRead,
      entityId: notification.entityId,
      entityType: notification.entityType,
      createdAt: notification.createdAt,
      priority,
    };
  }
}
