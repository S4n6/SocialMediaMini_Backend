import { Injectable, Inject } from '@nestjs/common';
import { INotificationDomainRepository } from '../../domain/repositories/notification-domain-repository.interface';
import { NotificationDomainService } from '../../domain/services/notification-domain.service';
import {
  NotificationNotFoundException,
  UnauthorizedNotificationAccessException,
} from '../../domain/notification.exceptions';
import { NOTIFICATION_REPOSITORY_TOKEN } from './create-notification.use-case';

/**
 * Use case for deleting notification(s)
 */
@Injectable()
export class DeleteNotificationUseCase {
  constructor(
    private readonly notificationDomainService: NotificationDomainService,
    @Inject(NOTIFICATION_REPOSITORY_TOKEN)
    private readonly notificationRepository: INotificationDomainRepository,
  ) {}

  /**
   * Delete a single notification
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

    // Mark for deletion (adds domain event)
    notification.delete();

    // Delete from repository
    await this.notificationRepository.delete(notificationId);
  }

  /**
   * Delete multiple notifications
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

    // Mark all for deletion
    notifications.forEach((notification) => notification.delete());

    // Use bulk delete for better performance
    await this.notificationRepository.deleteBulk(notificationIds, userId);
  }

  /**
   * Delete all read notifications for a user (cleanup)
   */
  async executeReadCleanup(
    userId: string,
    olderThanDays: number = 30,
  ): Promise<number> {
    // Get read notifications older than specified days
    const result = await this.notificationRepository.findByUserId(userId, {
      isRead: true,
      page: 1,
      limit: 1000, // Process in batches
    });

    const oldNotifications = result.notifications.filter((notification) => {
      const notificationEntity = {
        createdAt: notification.createdAt,
        isOlderThan: (days: number) => {
          const millisecondsInDay = 24 * 60 * 60 * 1000;
          const age = Date.now() - notification.createdAt.getTime();
          return age > days * millisecondsInDay;
        },
      };
      return notificationEntity.isOlderThan(olderThanDays);
    });

    if (oldNotifications.length === 0) {
      return 0;
    }

    const oldNotificationIds = oldNotifications.map((n) => n.id);

    // Delete old notifications
    await this.notificationRepository.deleteBulk(oldNotificationIds, userId);

    return oldNotifications.length;
  }

  /**
   * Delete all notifications for a user (complete cleanup)
   */
  async executeAllForUser(userId: string): Promise<void> {
    // Get all notifications for user
    const result = await this.notificationRepository.findByUserId(userId, {
      page: 1,
      limit: 10000, // Large limit to get all notifications
    });

    if (result.notifications.length === 0) {
      return; // No notifications to delete
    }

    const notificationIds = result.notifications.map((n) => n.id);

    // Use bulk delete
    await this.notificationRepository.deleteBulk(notificationIds, userId);
  }
}
