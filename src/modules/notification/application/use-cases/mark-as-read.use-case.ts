import { Injectable, Inject } from '@nestjs/common';
import { INotificationDomainRepository } from '../../domain/repositories/notification-domain-repository.interface';
import { NotificationDomainService } from '../../domain/services/notification-domain.service';
import {
  NotificationNotFoundException,
  UnauthorizedNotificationAccessException,
} from '../../domain/notification.exceptions';
import { NOTIFICATION_REPOSITORY_TOKEN } from './create-notification.use-case';

/**
 * Use case for marking notification(s) as read
 */
@Injectable()
export class MarkAsReadUseCase {
  constructor(
    private readonly notificationDomainService: NotificationDomainService,
    @Inject(NOTIFICATION_REPOSITORY_TOKEN)
    private readonly notificationRepository: INotificationDomainRepository,
  ) {}

  /**
   * Mark a single notification as read
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

    // Mark as read
    notification.markAsRead();

    // Save changes
    await this.notificationRepository.save(notification);
  }

  /**
   * Mark multiple notifications as read
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

    // Mark all as read
    notifications.forEach((notification) => {
      if (!notification.isRead) {
        notification.markAsRead();
      }
    });

    // Use bulk update for better performance
    await this.notificationRepository.markAsReadBulk(notificationIds, userId);
  }

  /**
   * Mark all user notifications as read
   */
  async executeAll(userId: string): Promise<void> {
    // Get all unread notifications for user
    const result = await this.notificationRepository.findByUserId(userId, {
      isRead: false,
      page: 1,
      limit: 1000, // Reasonable limit for bulk operation
    });

    if (result.notifications.length === 0) {
      return; // No unread notifications
    }

    const notificationIds = result.notifications.map((n) => n.id);

    // Use bulk update
    await this.notificationRepository.markAsReadBulk(notificationIds, userId);
  }
}
