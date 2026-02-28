import { Injectable } from '@nestjs/common';
import { Notification as PrismaNotification, NotificationEntity as PrismaNotificationEntity } from '../../../../../generated/prisma/client';
import { NotificationEntity, NotificationProps } from '../../../domain/entities/notification.entity';
import {
  NotificationType,
  NotificationEntityType,
} from '../../../domain/enums/notification.enums';
import { NotificationPayload } from '../../../domain/value-objects/notification-payload.vo';

/**
 * Maps between the Prisma `Notification` model and the domain `NotificationEntity`.
 */
@Injectable()
export class NotificationPrismaMapper {
  // ── Prisma → Domain ───────────────────────────────────────

  toDomain(row: PrismaNotification): NotificationEntity {
    const props: NotificationProps = {
      id: row.id,
      type: row.type as NotificationType,
      title: row.title,
      content: row.content,
      userId: row.userId,
      isRead: row.isRead,
      entityId: row.entityId ?? undefined,
      entityType: row.entityType
        ? this.prismaEnumToDomain(row.entityType)
        : undefined,
      metadata: this.parseMetadata(row),
      createdAt: row.createdAt,
    };

    return new NotificationEntity(props);
  }

  // ── Domain → Prisma ───────────────────────────────────────

  toPrisma(entity: NotificationEntity): {
    id: string;
    type: string;
    title: string;
    content: string;
    userId: string;
    isRead: boolean;
    entityId: string | null;
    entityType: PrismaNotificationEntity | null;
    createdAt: Date;
  } {
    return {
      id: entity.id,
      type: entity.type,
      title: entity.title,
      content: entity.content,
      userId: entity.userId,
      isRead: entity.isRead,
      entityId: entity.entityId ?? null,
      entityType: entity.entityType
        ? this.domainEnumToPrisma(entity.entityType)
        : null,
      createdAt: entity.createdAt,
    };
  }

  // ── Enum mapping helpers ──────────────────────────────────

  private prismaEnumToDomain(
    value: PrismaNotificationEntity,
  ): NotificationEntityType {
    const map: Record<PrismaNotificationEntity, NotificationEntityType> = {
      POST: NotificationEntityType.POST,
      COMMENT: NotificationEntityType.COMMENT,
      USER: NotificationEntityType.USER,
      STORY: NotificationEntityType.STORY,
      FOLLOW: NotificationEntityType.FOLLOW,
      MESSAGE: NotificationEntityType.MESSAGE,
    };
    return map[value];
  }

  private domainEnumToPrisma(
    value: NotificationEntityType,
  ): PrismaNotificationEntity {
    const map: Record<NotificationEntityType, PrismaNotificationEntity> = {
      [NotificationEntityType.POST]: 'POST',
      [NotificationEntityType.COMMENT]: 'COMMENT',
      [NotificationEntityType.USER]: 'USER',
      [NotificationEntityType.STORY]: 'STORY',
      [NotificationEntityType.FOLLOW]: 'FOLLOW',
      [NotificationEntityType.MESSAGE]: 'MESSAGE',
    };
    return map[value];
  }

  // ── Metadata — stored as JSON inside `content` or a future column ──

  /**
   * For now, metadata is NOT persisted to Prisma (the Notification table
   * has no `metadata` column). It is only used for real-time SSE payloads.
   *
   * When you add a `metadata JSONB` column to the schema, parse it here.
   */
  private parseMetadata(_row: PrismaNotification): NotificationPayload | undefined {
    // TODO: return row.metadata ? JSON.parse(row.metadata) : undefined;
    return undefined;
  }
}
