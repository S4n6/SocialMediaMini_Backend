import { Injectable, Inject } from '@nestjs/common';
import { INotificationDomainRepository } from '../../domain/repositories/notification-domain-repository.interface';
import { NotificationDomainService } from '../../domain/services/notification-domain.service';
import {
  NotificationNotFoundException,
  UnauthorizedNotificationAccessException,
} from '../../domain/notification.exceptions';
import { NotificationResponseDto } from '../dto/notification.dto';
import { NOTIFICATION_REPOSITORY_TOKEN } from './create-notification.use-case';

/**
 * Use case for getting a single notification
 */
@Injectable()
export class GetNotificationUseCase {
  constructor(
    private readonly notificationDomainService: NotificationDomainService,
    @Inject(NOTIFICATION_REPOSITORY_TOKEN)
    private readonly notificationRepository: INotificationDomainRepository,
  ) {}

  async execute(
    notificationId: string,
    userId: string,
  ): Promise<NotificationResponseDto> {
    // Find notification
    const notification =
      await this.notificationRepository.findById(notificationId);

    if (!notification) {
      throw new NotificationNotFoundException(notificationId);
    }

    // Validate access permissions
    this.notificationDomainService.validateNotificationAccess(
      notification,
      userId,
    );

    // Convert to response DTO
    return this.mapToResponseDto(notification);
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
