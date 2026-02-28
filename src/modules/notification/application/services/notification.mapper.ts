import { NotificationEntity } from '../../domain/entities/notification.entity';
import { NotificationResponseDto } from '../dto/notification.dto';

/**
 * Pure static mapper — domain entity → application response DTO.
 */
export class NotificationMapper {
  static toResponse(entity: NotificationEntity): NotificationResponseDto {
    return {
      id: entity.id,
      type: entity.type,
      title: entity.title,
      content: entity.content,
      isRead: entity.isRead,
      entityId: entity.entityId,
      entityType: entity.entityType,
      metadata: entity.metadata,
      createdAt: entity.createdAt.toISOString(),
    };
  }
}
