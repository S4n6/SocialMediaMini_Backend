import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../database/prisma.service';
import { INotificationRepository } from '../../../domain/repositories/i-notification.repository';
import { NotificationEntity } from '../../../domain/entities/notification.entity';
import { NotificationPrismaMapper } from '../mappers/notification-prisma.mapper';

@Injectable()
export class NotificationPrismaRepository implements INotificationRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: NotificationPrismaMapper,
  ) {}

  // ── Smart save (upsert) ─────────────────────────────────

  async save(notification: NotificationEntity): Promise<void> {
    const data = this.mapper.toPrisma(notification);

    await this.prisma.notification.upsert({
      where: { id: data.id },
      create: data,
      update: {
        isRead: data.isRead,
        title: data.title,
        content: data.content,
      },
    });
  }

  // ── Reads ───────────────────────────────────────────────

  async findById(id: string): Promise<NotificationEntity | null> {
    const row = await this.prisma.notification.findUnique({ where: { id } });
    return row ? this.mapper.toDomain(row) : null;
  }

  async findByUserId(
    userId: string,
    options: { page: number; limit: number },
  ): Promise<NotificationEntity[]> {
    const rows = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip: (options.page - 1) * options.limit,
      take: options.limit,
    });

    return rows.map((row) => this.mapper.toDomain(row));
  }

  async countUnread(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async findAfterTimestamp(
    userId: string,
    since: Date,
  ): Promise<NotificationEntity[]> {
    const rows = await this.prisma.notification.findMany({
      where: {
        userId,
        createdAt: { gt: since },
      },
      orderBy: { createdAt: 'asc' },
      take: 200, // safety cap
    });

    return rows.map((row) => this.mapper.toDomain(row));
  }

  // ── Writes ──────────────────────────────────────────────

  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return result.count;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.notification.delete({ where: { id } });
  }

  async deleteOlderThan(days: number): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const result = await this.prisma.notification.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
    return result.count;
  }
}
