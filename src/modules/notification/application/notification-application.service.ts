import { Injectable } from '@nestjs/common';
import { CreateNotificationUseCase } from './use-cases/create-notification.use-case';
import { GetNotificationsUseCase } from './use-cases/get-notifications.use-case';
import { MarkAsReadUseCase } from './use-cases/mark-as-read.use-case';
import { GetUnreadCountUseCase } from './use-cases/get-unread-count.use-case';
import {
  CreateNotificationDto,
  GetNotificationsDto,
  MarkAsReadDto,
  MarkAllAsReadDto,
  NotificationResponseDto,
  NotificationListResponseDto,
  UnreadCountResponseDto,
} from './dto/notification.dto';

/**
 * Thin orchestrator — delegates to use cases.
 *
 * Other modules that need to create notifications programmatically
 * can inject this service (via NotificationModule exports).
 */
@Injectable()
export class NotificationApplicationService {
  constructor(
    private readonly createNotificationUC: CreateNotificationUseCase,
    private readonly getNotificationsUC: GetNotificationsUseCase,
    private readonly markAsReadUC: MarkAsReadUseCase,
    private readonly getUnreadCountUC: GetUnreadCountUseCase,
  ) {}

  create(dto: CreateNotificationDto): Promise<NotificationResponseDto> {
    return this.createNotificationUC.execute(dto);
  }

  list(dto: GetNotificationsDto): Promise<NotificationListResponseDto> {
    return this.getNotificationsUC.execute(dto);
  }

  markAsRead(dto: MarkAsReadDto): Promise<void> {
    return this.markAsReadUC.execute(dto);
  }

  markAllAsRead(dto: MarkAllAsReadDto): Promise<number> {
    return this.markAsReadUC.executeAll(dto);
  }

  unreadCount(userId: string): Promise<UnreadCountResponseDto> {
    return this.getUnreadCountUC.execute(userId);
  }
}
