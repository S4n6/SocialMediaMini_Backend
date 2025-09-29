import { Injectable, Inject } from '@nestjs/common';
import { INotificationDomainRepository } from '../../domain/repositories/notification-domain-repository.interface';
import { NotificationDomainService } from '../../domain/services/notification-domain.service';
import {
  NotificationQueryDto,
  NotificationListResponseDto,
  NotificationResponseDto,
} from '../dto/notification.dto';
import { NOTIFICATION_REPOSITORY_TOKEN } from './create-notification.use-case';

/**
 * Use case for getting user notifications with pagination and filtering
 */
@Injectable()
export class GetNotificationsUseCase {
  constructor(
    private readonly notificationDomainService: NotificationDomainService,
    @Inject(NOTIFICATION_REPOSITORY_TOKEN)
    private readonly notificationRepository: INotificationDomainRepository,
  ) {}

  async execute(
    userId: string,
    query: NotificationQueryDto,
  ): Promise<NotificationListResponseDto> {
    // Get notifications from repository
    const result = await this.notificationRepository.findByUserId(userId, {
      ...query,
      page: query.page || 1,
      limit: Math.min(query.limit || 20, 100), // Max 100 items per page
    });

    // Convert entities to DTOs
    const notifications = result.notifications.map((notification) =>
      this.mapToResponseDto(notification),
    );

    // Calculate pagination info
    const totalPages = Math.ceil(result.total / (query.limit || 20));

    return {
      notifications,
      total: result.total,
      unreadCount: result.unreadCount,
      page: query.page || 1,
      limit: query.limit || 20,
      totalPages,
    };
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
