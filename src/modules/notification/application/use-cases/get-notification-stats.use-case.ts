import { Injectable, Inject } from '@nestjs/common';
import { INotificationDomainRepository } from '../../domain/repositories/notification-domain-repository.interface';
import { NotificationDomainService } from '../../domain/services/notification-domain.service';
import { NotificationStatsDto } from '../dto/notification.dto';
import { NOTIFICATION_REPOSITORY_TOKEN } from './create-notification.use-case';

/**
 * Use case for getting notification statistics
 */
@Injectable()
export class GetNotificationStatsUseCase {
  constructor(
    private readonly notificationDomainService: NotificationDomainService,
    @Inject(NOTIFICATION_REPOSITORY_TOKEN)
    private readonly notificationRepository: INotificationDomainRepository,
  ) {}

  async execute(userId: string): Promise<NotificationStatsDto> {
    // Get all notifications for user (for stats calculation)
    const result = await this.notificationRepository.findByUserId(userId, {
      page: 1,
      limit: 10000, // Large limit to get all for stats
    });

    // Use domain service to create digest
    const digest = this.notificationDomainService.createNotificationDigest(
      result.notifications,
    );

    return {
      totalCount: digest.totalCount,
      unreadCount: digest.unreadCount,
      typeBreakdown: digest.typeBreakdown,
      priorityBreakdown: digest.priorityBreakdown,
    };
  }

  /**
   * Get unread count only (more efficient for badges)
   */
  async getUnreadCount(userId: string): Promise<number> {
    return await this.notificationRepository.getUnreadCount(userId);
  }

  /**
   * Get stats by time period
   */
  async getStatsByPeriod(
    userId: string,
    days: number = 30,
  ): Promise<NotificationStatsDto & { period: string }> {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    // Get notifications from the specified period
    const allResult = await this.notificationRepository.findByUserId(userId, {
      page: 1,
      limit: 10000,
    });

    // Filter by date
    const recentNotifications = allResult.notifications.filter(
      (notification) => notification.createdAt >= sinceDate,
    );

    // Use domain service to create digest
    const digest =
      this.notificationDomainService.createNotificationDigest(
        recentNotifications,
      );

    return {
      totalCount: digest.totalCount,
      unreadCount: digest.unreadCount,
      typeBreakdown: digest.typeBreakdown,
      priorityBreakdown: digest.priorityBreakdown,
      period: `Last ${days} days`,
    };
  }
}
