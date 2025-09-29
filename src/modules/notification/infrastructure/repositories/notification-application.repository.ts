import { Injectable, Inject } from '@nestjs/common';
import {
  INotificationRepository,
  CreateNotificationDto,
  UpdateNotificationDto,
  NotificationResponseDto,
  NotificationListResponseDto,
  NotificationStatsDto,
  NotificationQueryDto,
} from '../../application';
import {
  INotificationDomainRepository,
  NotificationDomainService,
  NotificationFactory,
} from '../../domain';

export const NOTIFICATION_REPOSITORY_TOKEN = 'NOTIFICATION_REPOSITORY';

/**
 * Application-layer repository implementation that adapts domain repository
 * This acts as an adapter between the application and domain layers
 */
@Injectable()
export class NotificationApplicationRepository
  implements INotificationRepository
{
  constructor(
    @Inject(NOTIFICATION_REPOSITORY_TOKEN)
    private readonly domainRepository: INotificationDomainRepository,
    private readonly notificationFactory: NotificationFactory,
    private readonly domainService: NotificationDomainService,
  ) {}

  async create(dto: CreateNotificationDto): Promise<NotificationResponseDto> {
    // Create domain entity using factory
    const notification = this.notificationFactory.createNotification({
      type: dto.type,
      userId: dto.userId,
      entityId: dto.entityId,
      entityType: dto.entityType,
      customTitle: dto.title,
      customContent: dto.content,
    });

    // Save using domain repository
    const savedNotification = await this.domainRepository.save(notification);

    // Convert to application DTO
    return this.mapToResponseDto(savedNotification);
  }

  async findById(id: string): Promise<NotificationResponseDto | null> {
    const notification = await this.domainRepository.findById(id);

    if (!notification) {
      return null;
    }

    return this.mapToResponseDto(notification);
  }

  async update(
    id: string,
    dto: UpdateNotificationDto,
  ): Promise<NotificationResponseDto> {
    const notification = await this.domainRepository.findById(id);

    if (!notification) {
      throw new Error(`Notification with id ${id} not found`);
    }

    // Update using domain methods
    if (dto.title || dto.content) {
      notification.updateContent(
        dto.title || notification.title,
        dto.content || notification.content,
      );
    }

    if (dto.isRead !== undefined) {
      if (dto.isRead && !notification.isRead) {
        notification.markAsRead();
      } else if (!dto.isRead && notification.isRead) {
        notification.markAsUnread();
      }
    }

    // Save changes
    const updatedNotification = await this.domainRepository.save(notification);

    return this.mapToResponseDto(updatedNotification);
  }

  async delete(id: string): Promise<void> {
    await this.domainRepository.delete(id);
  }

  async exists(id: string): Promise<boolean> {
    return await this.domainRepository.exists(id);
  }

  async findByUserId(
    userId: string,
    query: NotificationQueryDto,
  ): Promise<NotificationListResponseDto> {
    const result = await this.domainRepository.findByUserId(userId, {
      isRead: query.isRead,
      type: query.type,
      entityType: query.entityType,
      page: query.page || 1,
      limit: query.limit || 20,
      sortBy: query.sortBy || 'newest',
    });

    const notifications = result.notifications.map((notification) =>
      this.mapToResponseDto(notification),
    );

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

  async findAll(
    query: NotificationQueryDto & { userId?: string },
  ): Promise<NotificationListResponseDto> {
    const result = await this.domainRepository.findAll({
      userId: query.userId,
      isRead: query.isRead,
      type: query.type,
      entityType: query.entityType,
      entityId: query.entityId,
      page: query.page || 1,
      limit: query.limit || 20,
      sortBy: query.sortBy || 'newest',
    });

    const notifications = result.notifications.map((notification) =>
      this.mapToResponseDto(notification),
    );

    const totalPages = Math.ceil(result.total / (query.limit || 20));

    return {
      notifications,
      total: result.total,
      unreadCount: 0, // Not applicable for general findAll
      page: query.page || 1,
      limit: query.limit || 20,
      totalPages,
    };
  }

  async markAsReadBulk(
    notificationIds: string[],
    userId: string,
  ): Promise<void> {
    await this.domainRepository.markAsReadBulk(notificationIds, userId);
  }

  async markAsUnreadBulk(
    notificationIds: string[],
    userId: string,
  ): Promise<void> {
    await this.domainRepository.markAsUnreadBulk(notificationIds, userId);
  }

  async deleteBulk(notificationIds: string[], userId: string): Promise<void> {
    await this.domainRepository.deleteBulk(notificationIds, userId);
  }

  async getStats(userId: string): Promise<NotificationStatsDto> {
    const result = await this.domainRepository.findByUserId(userId, {
      page: 1,
      limit: 10000, // Get all for stats
    });

    // Use domain service to create digest
    const digest = this.domainService.createNotificationDigest(
      result.notifications,
    );

    return {
      totalCount: digest.totalCount,
      unreadCount: digest.unreadCount,
      typeBreakdown: digest.typeBreakdown,
      priorityBreakdown: digest.priorityBreakdown,
    };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return await this.domainRepository.getUnreadCount(userId);
  }

  async getLatestNotifications(
    userId: string,
    sinceTimestamp: Date,
    limit?: number,
  ): Promise<NotificationResponseDto[]> {
    const notifications = await this.domainRepository.getLatestNotifications(
      userId,
      sinceTimestamp,
      limit,
    );

    return notifications.map((notification) =>
      this.mapToResponseDto(notification),
    );
  }

  async cleanupOldNotifications(olderThanDays: number): Promise<number> {
    return await this.domainRepository.deleteOldNotifications(olderThanDays);
  }

  async cleanupReadNotifications(
    userId: string,
    olderThanDays: number,
  ): Promise<number> {
    return await this.domainRepository.deleteReadNotifications(
      userId,
      olderThanDays,
    );
  }

  private mapToResponseDto(notification: any): NotificationResponseDto {
    const priority = this.domainService.getNotificationPriority(
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
