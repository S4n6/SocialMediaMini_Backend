import { Injectable, Inject } from '@nestjs/common';
import { INotificationDomainRepository } from '../../domain/repositories/notification-domain-repository.interface';
import { NotificationDomainService } from '../../domain/services/notification-domain.service';
import { NOTIFICATION_REPOSITORY_TOKEN } from './create-notification.use-case';

export interface CleanupResult {
  deletedCount: number;
  message: string;
}

/**
 * Use case for cleaning up old notifications
 * Used for maintenance and storage optimization
 */
@Injectable()
export class NotificationCleanupUseCase {
  constructor(
    private readonly notificationDomainService: NotificationDomainService,
    @Inject(NOTIFICATION_REPOSITORY_TOKEN)
    private readonly notificationRepository: INotificationDomainRepository,
  ) {}

  /**
   * Clean up old read notifications for a specific user
   */
  async cleanupUserReadNotifications(
    userId: string,
    olderThanDays: number = 30,
  ): Promise<CleanupResult> {
    const deletedCount =
      await this.notificationRepository.deleteReadNotifications(
        userId,
        olderThanDays,
      );

    return {
      deletedCount,
      message: `Deleted ${deletedCount} read notifications older than ${olderThanDays} days for user ${userId}`,
    };
  }

  /**
   * Clean up all old notifications system-wide (admin operation)
   */
  async cleanupSystemOldNotifications(
    olderThanDays: number = 90,
  ): Promise<CleanupResult> {
    const deletedCount =
      await this.notificationRepository.deleteOldNotifications(olderThanDays);

    return {
      deletedCount,
      message: `System cleanup: Deleted ${deletedCount} notifications older than ${olderThanDays} days`,
    };
  }

  /**
   * Clean up notifications related to a deleted entity
   */
  async cleanupNotificationsByEntity(
    entityId: string,
    entityType: any, // NotificationEntityType
    userId?: string,
  ): Promise<CleanupResult> {
    // Find notifications to be deleted first (for counting)
    const notificationsToDelete =
      await this.notificationRepository.findByEntity(
        entityId,
        entityType,
        userId,
      );

    // Delete the notifications
    await this.notificationRepository.deleteByEntity(
      entityId,
      entityType,
      userId,
    );

    const deletedCount = notificationsToDelete.length;
    const userScope = userId ? `for user ${userId}` : 'system-wide';

    return {
      deletedCount,
      message: `Deleted ${deletedCount} notifications related to ${entityType} ${entityId} ${userScope}`,
    };
  }

  /**
   * Batch cleanup for multiple users (admin operation)
   */
  async batchCleanupUsers(
    userIds: string[],
    olderThanDays: number = 30,
  ): Promise<CleanupResult[]> {
    const results: CleanupResult[] = [];

    for (const userId of userIds) {
      try {
        const result = await this.cleanupUserReadNotifications(
          userId,
          olderThanDays,
        );
        results.push(result);
      } catch (error) {
        results.push({
          deletedCount: 0,
          message: `Failed to cleanup notifications for user ${userId}: ${error.message}`,
        });
      }
    }

    return results;
  }

  /**
   * Get cleanup statistics before performing cleanup
   */
  async getCleanupStats(
    userId?: string,
    olderThanDays: number = 30,
  ): Promise<{
    totalNotifications: number;
    readNotifications: number;
    oldReadNotifications: number;
    estimatedCleanupCount: number;
  }> {
    const filters = userId ? { userId } : {};

    // Get all notifications
    const allResult = await this.notificationRepository.findAll({
      ...filters,
      page: 1,
      limit: 100000, // Large number to get all
    });

    // Get read notifications
    const readResult = await this.notificationRepository.findAll({
      ...filters,
      isRead: true,
      page: 1,
      limit: 100000,
    });

    // Calculate old read notifications
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const oldReadNotifications = readResult.notifications.filter(
      (notification) => notification.createdAt < cutoffDate,
    );

    return {
      totalNotifications: allResult.total,
      readNotifications: readResult.total,
      oldReadNotifications: oldReadNotifications.length,
      estimatedCleanupCount: oldReadNotifications.length,
    };
  }
}
