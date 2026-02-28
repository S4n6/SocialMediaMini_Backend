import { Inject, Injectable } from '@nestjs/common';
import { NOTIFICATION_REPOSITORY_TOKEN } from '../../notification.constants';
import { INotificationRepository } from '../../domain/repositories/i-notification.repository';
import {
  NotificationNotFoundException,
  UnauthorizedNotificationAccessException,
} from '../../domain/exceptions/notification.exceptions';
import { MarkAsReadDto, MarkAllAsReadDto } from '../dto/notification.dto';

@Injectable()
export class MarkAsReadUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY_TOKEN)
    private readonly repo: INotificationRepository,
  ) {}

  /** Mark a single notification as read */
  async execute(dto: MarkAsReadDto): Promise<void> {
    const notification = await this.repo.findById(dto.notificationId);
    if (!notification) {
      throw new NotificationNotFoundException(dto.notificationId);
    }
    if (!notification.isOwnedBy(dto.userId)) {
      throw new UnauthorizedNotificationAccessException(
        dto.notificationId,
        dto.userId,
      );
    }

    notification.markAsReadSafe();
    await this.repo.save(notification);
  }

  /** Mark all notifications as read for a user (bulk SQL) */
  async executeAll(dto: MarkAllAsReadDto): Promise<number> {
    return this.repo.markAllAsRead(dto.userId);
  }
}
