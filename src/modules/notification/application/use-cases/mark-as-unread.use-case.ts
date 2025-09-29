import { Injectable, Inject } from '@nestjs/common';
import { INotificationDomainRepository } from '../../domain/repositories/notification-domain-repository.interface';
import { NotificationDomainService } from '../../domain/services/notification-domain.service';
import {
  NotificationNotFoundException,
  UnauthorizedNotificationAccessException,
} from '../../domain/notification.exceptions';
import { NOTIFICATION_REPOSITORY_TOKEN } from './create-notification.use-case';

/**
 * Use case for marking notification(s) as unread
 */
@Injectable()
export class MarkAsUnreadUseCase {
  constructor(
    private readonly notificationDomainService: NotificationDomainService,
    @Inject(NOTIFICATION_REPOSITORY_TOKEN)
    private readonly notificationRepository: INotificationDomainRepository,
  ) {}

  /**
   * Mark a single notification as unread
   */
  async executeSingle(notificationId: string, userId: string): Promise<void> {
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

    // Mark as unread
    notification.markAsUnread();

    // Save changes
    await this.notificationRepository.save(notification);
  }

  /**
   * Mark multiple notifications as unread
   */
  async executeBulk(notificationIds: string[], userId: string): Promise<void> {
    // Find all notifications
    const notifications =
      await this.notificationRepository.findByIds(notificationIds);

    // Validate that all notifications exist
    const foundIds = notifications.map((n) => n.id);
    const missingIds = notificationIds.filter((id) => !foundIds.includes(id));

    if (missingIds.length > 0) {
      throw new NotificationNotFoundException(
        `Notifications not found: ${missingIds.join(', ')}`,
      );
    }

    // Validate permissions for all notifications
    this.notificationDomainService.validateBulkOperationPermissions(
      notifications,
      userId,
    );

    // Mark all as unread
    notifications.forEach((notification) => {
      if (notification.isRead) {
        notification.markAsUnread();
      }
    });

    // Use bulk update for better performance
    await this.notificationRepository.markAsUnreadBulk(notificationIds, userId);
  }
}
