import { Injectable, Inject } from '@nestjs/common';
import { INotificationDomainRepository } from '../../domain/repositories/notification-domain-repository.interface';
import { NotificationDomainService } from '../../domain/services/notification-domain.service';
import {
  NotificationNotFoundException,
  UnauthorizedNotificationAccessException,
} from '../../domain/notification.exceptions';
import {
  UpdateNotificationDto,
  NotificationResponseDto,
} from '../dto/notification.dto';
import { NOTIFICATION_REPOSITORY_TOKEN } from './create-notification.use-case';

/**
 * Use case for updating a notification
 */
@Injectable()
export class UpdateNotificationUseCase {
  constructor(
    private readonly notificationDomainService: NotificationDomainService,
    @Inject(NOTIFICATION_REPOSITORY_TOKEN)
    private readonly notificationRepository: INotificationDomainRepository,
  ) {}

  async execute(
    notificationId: string,
    userId: string,
    dto: UpdateNotificationDto,
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

    // Update notification content if provided
    if (dto.title || dto.content) {
      notification.updateContent(
        dto.title || notification.title,
        dto.content || notification.content,
      );
    }

    // Update read status if provided
    if (dto.isRead !== undefined) {
      if (dto.isRead && !notification.isRead) {
        notification.markAsRead();
      } else if (!dto.isRead && notification.isRead) {
        notification.markAsUnread();
      }
    }

    // Save changes
    const updatedNotification =
      await this.notificationRepository.save(notification);

    // Convert to response DTO
    return this.mapToResponseDto(updatedNotification);
  }

  private mapToResponseDto(notification: unknown): NotificationResponseDto {
    const asRecord = (v: unknown): Record<string, any> =>
      (v as Record<string, any>) || {};
    const pn = asRecord(notification);
    const getString = (k: string) => (typeof pn[k] === 'string' ? pn[k] : '');
    const getBoolean = (k: string) =>
      typeof pn[k] === 'boolean' ? pn[k] : false;
    const getDate = (k: string) =>
      pn[k] instanceof Date ? pn[k] : new Date(pn[k] ?? Date.now());

    const priority = this.notificationDomainService.getNotificationPriority(
      pn.type,
    );

    return {
      id: getString('id'),
      type: pn.type,
      title: getString('title'),
      content: getString('content'),
      userId: getString('userId'),
      isRead: getBoolean('isRead'),
      entityId: getString('entityId'),
      entityType: pn.entityType,
      createdAt: getDate('createdAt'),
      priority,
    };
  }
}
