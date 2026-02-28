import { Inject, Injectable } from '@nestjs/common';
import { NOTIFICATION_REPOSITORY_TOKEN } from '../../notification.constants';
import { INotificationRepository } from '../../domain/repositories/i-notification.repository';
import {
  GetNotificationsDto,
  NotificationListResponseDto,
} from '../dto/notification.dto';
import { NotificationMapper } from '../services/notification.mapper';

@Injectable()
export class GetNotificationsUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY_TOKEN)
    private readonly repo: INotificationRepository,
  ) {}

  async execute(dto: GetNotificationsDto): Promise<NotificationListResponseDto> {
    const page = dto.page ?? 1;
    const limit = Math.min(dto.limit ?? 20, 100);

    const [items, total] = await Promise.all([
      this.repo.findByUserId(dto.userId, { page, limit }),
      this.repo.countUnread(dto.userId), // cheap count for badge
    ]);

    return {
      items: items.map(NotificationMapper.toResponse),
      total,
      page,
      limit,
    };
  }
}
