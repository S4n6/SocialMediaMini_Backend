import { Inject, Injectable } from '@nestjs/common';
import {
  NOTIFICATION_REPOSITORY_TOKEN,
  NOTIFICATION_STREAM_TOKEN,
} from '../../notification.constants';
import { INotificationRepository } from '../../domain/repositories/i-notification.repository';
import { NotificationEntity } from '../../domain/entities/notification.entity';
import { INotificationStream } from '../ports/i-notification-stream.port';
import {
  CreateNotificationDto,
  NotificationResponseDto,
} from '../dto/notification.dto';
import { NotificationMapper } from '../services/notification.mapper';

/**
 * Persist-first, push-second.
 *
 * 1. Create the domain entity (validates, raises NotificationCreatedEvent).
 * 2. Persist to DB — ensures offline users will see it.
 * 3. Push to SSE stream — online users get it in real-time.
 */
@Injectable()
export class CreateNotificationUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY_TOKEN)
    private readonly repo: INotificationRepository,
    @Inject(NOTIFICATION_STREAM_TOKEN)
    private readonly stream: INotificationStream,
  ) {}

  async execute(dto: CreateNotificationDto): Promise<NotificationResponseDto> {
    // 1. Domain validation via constructor
    const notification = new NotificationEntity({
      type: dto.type,
      title: dto.title,
      content: dto.content,
      userId: dto.userId,
      entityId: dto.entityId,
      entityType: dto.entityType,
      metadata: dto.metadata,
    });

    // 2. Persist first (offline-safe)
    await this.repo.save(notification);

    // 3. Push to SSE (real-time, no-op if user offline)
    this.stream.push(notification.userId, {
      id: notification.id,
      type: notification.type,
      data: NotificationMapper.toResponse(notification),
    });

    return NotificationMapper.toResponse(notification);
  }
}
