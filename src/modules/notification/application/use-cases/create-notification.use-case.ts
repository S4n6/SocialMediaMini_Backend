import { Injectable, Inject } from '@nestjs/common';
import { NotificationFactory } from '../../domain/factories/notification.factory';
import { INotificationDomainRepository } from '../../domain/repositories/notification-domain-repository.interface';
import { NotificationDomainService } from '../../domain/services/notification-domain.service';
import {
  CreateNotificationDto,
  NotificationResponseDto,
} from '../dto/notification.dto';

export const NOTIFICATION_REPOSITORY_TOKEN = 'NOTIFICATION_REPOSITORY';

/**
 * Use case for creating a new notification
 */
@Injectable()
export class CreateNotificationUseCase {
  constructor(
    private readonly notificationFactory: NotificationFactory,
    private readonly notificationDomainService: NotificationDomainService,
    @Inject(NOTIFICATION_REPOSITORY_TOKEN)
    private readonly notificationRepository: INotificationDomainRepository,
  ) {}

  async execute(dto: CreateNotificationDto): Promise<NotificationResponseDto> {
    // Create notification entity using factory
    const notification = this.notificationFactory.createNotification({
      type: dto.type,
      userId: dto.userId,
      entityId: dto.entityId,
      entityType: dto.entityType,
      customTitle: dto.title,
      customContent: dto.content,
    });

    // Save to repository
    const savedNotification =
      await this.notificationRepository.save(notification);

    // Convert to response DTO
    return this.mapToResponseDto(savedNotification);
  }

  private mapToResponseDto(notification: any): NotificationResponseDto {
    const priority = this.notificationDomainService.getNotificationPriority(
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
