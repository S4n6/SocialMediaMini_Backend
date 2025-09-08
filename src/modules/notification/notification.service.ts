import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  async create(createNotificationDto: CreateNotificationDto) {
    const { userId, type, title, content } = createNotificationDto;

    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    const created = await this.prisma.notification.create({
      data: {
        userId,
        type,
        title,
        content,
      },
    });

    return created;
  }

  async findAll(userId?: string) {
    const where = userId ? { userId } : {};
    const notifications = await this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return notifications;
  }

  async findOne(id: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }

  async update(id: string, updateNotificationDto: UpdateNotificationDto) {
    const existing = await this.prisma.notification.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Notification not found');

    const updated = await this.prisma.notification.update({
      where: { id },
      data: updateNotificationDto as any,
    });

    return updated;
  }

  async remove(id: string) {
    const existing = await this.prisma.notification.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Notification not found');

    await this.prisma.notification.delete({ where: { id } });

    return { success: true };
  }
}
