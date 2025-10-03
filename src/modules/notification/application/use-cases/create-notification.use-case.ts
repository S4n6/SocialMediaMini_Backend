import { Injectable, Inject } from '@nestjs/common';
import { NotificationFactory } from '../../domain/factories/notification.factory';
import { INotificationDomainRepository } from '../../domain/repositories/notification-domain-repository.interface';
import { NotificationDomainService } from '../../domain/services/notification-domain.service';
import {
  NotificationType,
  NotificationEntityType,
} from '../../domain/notification.entity';
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

  private mapToResponseDto(notification: unknown): NotificationResponseDto {
    const asRecord = (v: unknown): Record<string, unknown> =>
      typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : {};

    const n = asRecord(notification);

    const rawType = typeof n.type === 'string' ? n.type : undefined;
    const typeEnum: NotificationType =
      rawType &&
      Object.values(NotificationType).includes(rawType as NotificationType)
        ? (rawType as NotificationType)
        : NotificationType.SYSTEM;

    const priority =
      this.notificationDomainService.getNotificationPriority(typeEnum);

    const getString = (k: string): string => {
      const v = n[k];
      return typeof v === 'string' ? v : '';
    };

    const getBoolean = (k: string): boolean => {
      const v = n[k];
      return typeof v === 'boolean' ? v : false;
    };

    const getDate = (k: string): Date => {
      const v = n[k];
      if (v instanceof Date) return v;
      if (typeof v === 'string') return new Date(v);
      return new Date();
    };

    const entityType =
      typeof n.entityType === 'string' &&
      Object.values(NotificationEntityType).includes(
        n.entityType as NotificationEntityType,
      )
        ? (n.entityType as NotificationEntityType)
        : undefined;

    return {
      id: getString('id'),
      type: typeEnum,
      title: getString('title'),
      content: getString('content'),
      userId: getString('userId'),
      isRead: getBoolean('isRead'),
      entityId: getString('entityId'),
      entityType,
      createdAt: getDate('createdAt'),
      priority,
    };
  }
}
