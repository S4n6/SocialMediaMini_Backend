import { Injectable, Inject } from '@nestjs/common';

import {
  NOTIFICATION_REPOSITORY_TOKEN,
  DOMAIN_EVENT_PUBLISHER_TOKEN,
} from '../../constants';
import { NotificationFactory } from '../../domain/factories/notification.factory';
import { INotificationDomainRepository } from '../../domain/repositories/notification-domain-repository.interface';
import { IDomainEventPublisher } from '../interfaces/domain-event-publisher.interface';
import { NotificationMapper } from '../services/notification.mapper';
import {
  CreateNotificationDto,
  NotificationResponseDto,
} from '../dto/notification.dto';

/**
 * Use case for creating a new notification
 * Single responsibility: Create and persist a notification, then publish domain events
 */
@Injectable()
export class CreateNotificationUseCase {
  constructor(
    private readonly notificationFactory: NotificationFactory,
    @Inject(NOTIFICATION_REPOSITORY_TOKEN)
    private readonly notificationRepository: INotificationDomainRepository,
    @Inject(DOMAIN_EVENT_PUBLISHER_TOKEN)
    private readonly domainEventPublisher: IDomainEventPublisher,
  ) {}

  async execute(dto: CreateNotificationDto): Promise<NotificationResponseDto> {
    // 1. Create notification entity using factory
    const notification = this.notificationFactory.createNotification({
      type: dto.type,
      userId: dto.userId,
      entityId: dto.entityId,
      entityType: dto.entityType,
      customTitle: dto.title,
      customContent: dto.content,
    });

    // 2. Save to repository
    const savedNotification =
      await this.notificationRepository.save(notification);

    // 3. Publish domain events
    await this.domainEventPublisher.publishFromAggregate(savedNotification);

    // 4. Convert to response DTO using centralized mapper
    return NotificationMapper.toResponseDto(savedNotification);
  }
}
