import { NotificationEntity } from '../../domain/entities/notification.entity';
import { NotificationType, NotificationEntityType } from '../../domain';
import {
  NotificationResponseDto,
  NotificationListResponseDto,
  NotificationStatsDto,
} from '../dto/notification.dto';

/**
 * Centralized mapper service for converting between domain entities and DTOs
 * Follows Clean Architecture by keeping mapping logic in application layer
 */
export class NotificationMapper {
  /**
   * Maps domain entity to response DTO
   */
  static toResponseDto(entity: NotificationEntity): NotificationResponseDto {
    return {
      id: entity.id,
      type: entity.type,
      title: entity.title,
      content: entity.content,
      userId: entity.userId,
      isRead: entity.isRead,
      entityId: entity.entityId,
      entityType: entity.entityType,
      createdAt: entity.createdAt,
    };
  }

  /**
   * Maps array of domain entities to response DTOs
   */
  static toResponseDtoArray(
    entities: NotificationEntity[],
  ): NotificationResponseDto[] {
    return entities.map((entity) => this.toResponseDto(entity));
  }

  /**
   * Maps notification list with pagination to response DTO
   */
  static toListResponseDto(
    notifications: NotificationEntity[],
    total: number,
    unreadCount: number,
    page: number,
    limit: number,
  ): NotificationListResponseDto {
    return {
      notifications: this.toResponseDtoArray(notifications),
      total,
      unreadCount,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Maps stats to response DTO
   */
  static toStatsResponseDto(
    totalCount: number,
    unreadCount: number,
    typeBreakdown: Record<NotificationType, number> = {} as Record<
      NotificationType,
      number
    >,
    priorityBreakdown: Record<'high' | 'medium' | 'low', number> = {} as Record<
      'high' | 'medium' | 'low',
      number
    >,
  ): NotificationStatsDto {
    return {
      totalCount,
      unreadCount,
      typeBreakdown,
      priorityBreakdown,
    };
  }

  /**
   * Safely converts unknown object to NotificationEntity-like structure
   * Used for cases where we receive data from repository that might not be properly typed
   */
  static fromPersistence(data: unknown): {
    id: string;
    type: NotificationType;
    title: string;
    content: string;
    userId: string;
    isRead: boolean;
    entityId?: string;
    entityType?: NotificationEntityType;
    createdAt: Date;
  } {
    const asRecord = (v: unknown): Record<string, unknown> =>
      typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : {};

    const n = asRecord(data);

    const safeString = (v: unknown, defaultValue = ''): string => {
      if (typeof v === 'string') return v;
      if (typeof v === 'number' || typeof v === 'boolean') return String(v);
      return defaultValue;
    };

    const safeDate = (v: unknown): Date => {
      if (v instanceof Date) return v;
      if (typeof v === 'number') return new Date(v);
      if (typeof v === 'string') {
        const date = new Date(v);
        return isNaN(date.getTime()) ? new Date() : date;
      }
      return new Date();
    };

    const safeEnum = <T extends Record<string, string>>(
      v: unknown,
      enumObj: T,
      defaultValue: T[keyof T],
    ): T[keyof T] => {
      const str = safeString(v);
      return Object.values(enumObj).includes(str as T[keyof T])
        ? (str as T[keyof T])
        : defaultValue;
    };

    return {
      id: safeString(n.id),
      type: safeEnum(n.type, NotificationType, NotificationType.SYSTEM),
      title: safeString(n.title),
      content: safeString(n.content),
      userId: safeString(n.userId),
      isRead: Boolean(n.isRead),
      entityId: n.entityId ? safeString(n.entityId) : undefined,
      entityType: n.entityType
        ? safeEnum(
            n.entityType,
            NotificationEntityType,
            NotificationEntityType.POST,
          )
        : undefined,
      createdAt: safeDate(n.createdAt),
    };
  }
}
