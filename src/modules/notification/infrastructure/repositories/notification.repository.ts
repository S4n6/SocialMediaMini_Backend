import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import {
  NotificationEntity,
  NotificationType,
  NotificationEntityType,
  INotificationDomainRepository,
} from '../../domain';

/**
 * Prisma implementation of the notification domain repository
 */
@Injectable()
export class NotificationRepository implements INotificationDomainRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(notification: NotificationEntity): Promise<NotificationEntity> {
    const data = {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      content: notification.content,
      userId: notification.userId,
      isRead: notification.isRead,
      entityId: notification.entityId,
      entityType: notification.entityType,
      createdAt: notification.createdAt,
    };

    const savedNotification = await this.prisma.notification.upsert({
      where: { id: notification.id },
      create: data,
      update: {
        type: data.type,
        title: data.title,
        content: data.content,
        isRead: data.isRead,
        entityId: data.entityId,
        entityType: data.entityType,
      },
    });

    return this.mapToDomainEntity(savedNotification);
  }

  async findById(id: string): Promise<NotificationEntity | null> {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return null;
    }

    return this.mapToDomainEntity(notification);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.notification.delete({
      where: { id },
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.notification.count({
      where: { id },
    });
    return count > 0;
  }

  async findByUserId(
    userId: string,
    filters: {
      isRead?: boolean;
      type?: NotificationType;
      entityType?: NotificationEntityType;
      page: number;
      limit: number;
      sortBy?: 'newest' | 'oldest';
    },
  ): Promise<{
    notifications: NotificationEntity[];
    total: number;
    unreadCount: number;
  }> {
    const where: any = { userId };

    if (filters.isRead !== undefined) {
      where.isRead = filters.isRead;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.entityType) {
      where.entityType = filters.entityType;
    }

    const orderBy = {
      createdAt:
        filters.sortBy === 'oldest' ? ('asc' as const) : ('desc' as const),
    };

    const skip = (filters.page - 1) * filters.limit;

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy,
        skip,
        take: filters.limit,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return {
      notifications: notifications.map((n) => this.mapToDomainEntity(n)),
      total,
      unreadCount,
    };
  }

  async findAll(filters: {
    userId?: string;
    isRead?: boolean;
    type?: NotificationType;
    entityType?: NotificationEntityType;
    entityId?: string;
    page: number;
    limit: number;
    sortBy?: 'newest' | 'oldest';
  }): Promise<{
    notifications: NotificationEntity[];
    total: number;
  }> {
    const where: any = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.isRead !== undefined) {
      where.isRead = filters.isRead;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.entityType) {
      where.entityType = filters.entityType;
    }

    if (filters.entityId) {
      where.entityId = filters.entityId;
    }

    const orderBy = {
      createdAt:
        filters.sortBy === 'oldest' ? ('asc' as const) : ('desc' as const),
    };

    const skip = (filters.page - 1) * filters.limit;

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy,
        skip,
        take: filters.limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      notifications: notifications.map((n) => this.mapToDomainEntity(n)),
      total,
    };
  }

  async findByIds(ids: string[]): Promise<NotificationEntity[]> {
    const notifications = await this.prisma.notification.findMany({
      where: {
        id: { in: ids },
      },
    });

    return notifications.map((n) => this.mapToDomainEntity(n));
  }

  async markAsReadBulk(
    notificationIds: string[],
    userId: string,
  ): Promise<void> {
    await this.prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId, // Ensure user owns the notifications
      },
      data: {
        isRead: true,
      },
    });
  }

  async markAsUnreadBulk(
    notificationIds: string[],
    userId: string,
  ): Promise<void> {
    await this.prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId, // Ensure user owns the notifications
      },
      data: {
        isRead: false,
      },
    });
  }

  async deleteBulk(notificationIds: string[], userId: string): Promise<void> {
    await this.prisma.notification.deleteMany({
      where: {
        id: { in: notificationIds },
        userId, // Ensure user owns the notifications
      },
    });
  }

  async findByEntity(
    entityId: string,
    entityType: NotificationEntityType,
    userId?: string,
  ): Promise<NotificationEntity[]> {
    const where: any = {
      entityId,
      entityType,
    };

    if (userId) {
      where.userId = userId;
    }

    const notifications = await this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return notifications.map((n) => this.mapToDomainEntity(n));
  }

  async deleteByEntity(
    entityId: string,
    entityType: NotificationEntityType,
    userId?: string,
  ): Promise<void> {
    const where: any = {
      entityId,
      entityType,
    };

    if (userId) {
      where.userId = userId;
    }

    await this.prisma.notification.deleteMany({ where });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return await this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  async getUnreadCountByType(
    userId: string,
    type: NotificationType,
  ): Promise<number> {
    return await this.prisma.notification.count({
      where: {
        userId,
        type,
        isRead: false,
      },
    });
  }

  async deleteOldNotifications(olderThanDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.prisma.notification.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }

  async deleteReadNotifications(
    userId: string,
    olderThanDays: number,
  ): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.prisma.notification.deleteMany({
      where: {
        userId,
        isRead: true,
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  }

  async findUserNotificationPreferences(userId: string): Promise<{
    enabledTypes: NotificationType[];
    mutedEntityIds: string[];
  } | null> {
    // This would typically be stored in a separate preferences table
    // For now, return default preferences
    // Return default preferences synchronously to satisfy require-await rule
    return Promise.resolve({
      enabledTypes: Object.values(NotificationType),
      mutedEntityIds: [],
    });
  }

  async getLatestNotifications(
    userId: string,
    sinceTimestamp: Date,
    limit: number = 50,
  ): Promise<NotificationEntity[]> {
    const notifications = await this.prisma.notification.findMany({
      where: {
        userId,
        createdAt: {
          gt: sinceTimestamp,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return notifications.map((n) => this.mapToDomainEntity(n));
  }

  private mapToDomainEntity(prismaNotification: any): NotificationEntity {
    const asRecord = (v: unknown): Record<string, unknown> | null =>
      typeof v === 'object' && v !== null
        ? (v as Record<string, unknown>)
        : null;

    const pn = asRecord(prismaNotification);

    if (!pn) {
      throw new Error('Invalid prisma notification');
    }

    const safeString = (v: unknown): string | undefined => {
      if (v == null) return undefined;
      if (typeof v === 'string') return v;
      if (typeof v === 'number' || typeof v === 'boolean') return String(v);
      return undefined;
    };

    const safeDate = (v: unknown): Date => {
      if (v instanceof Date) return v;
      if (typeof v === 'number') return new Date(v);
      if (typeof v === 'string') {
        const d = new Date(v);
        return isNaN(d.getTime()) ? new Date() : d;
      }
      return new Date();
    };

    const id = safeString(pn.id) ?? '';
    const rawType = safeString(pn.type) ?? NotificationType.SYSTEM;
    const type = Object.values(NotificationType).includes(
      rawType as NotificationType,
    )
      ? (rawType as NotificationType)
      : NotificationType.SYSTEM;
    const title = safeString(pn.title) ?? '';
    const content = safeString(pn.content) ?? '';
    const userId = safeString(pn.userId) ?? '';
    const isRead = Boolean(pn.isRead);
    const entityId = safeString(pn.entityId);
    const entityType =
      typeof pn.entityType === 'string' &&
      Object.values(NotificationEntityType).includes(
        pn.entityType as NotificationEntityType,
      )
        ? (pn.entityType as NotificationEntityType)
        : undefined;
    const createdAt = safeDate(pn.createdAt);

    return NotificationEntity.fromPersistence({
      id,
      type,
      title,
      content,
      userId,
      isRead,
      entityId,
      entityType,
      createdAt,
    });
  }
}
