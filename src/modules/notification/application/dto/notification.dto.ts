import {
  NotificationType,
  NotificationEntityType,
} from '../../domain/enums/notification.enums';
import { NotificationPayload } from '../../domain/value-objects/notification-payload.vo';

// ────────────────────────────────────────────────────────────
// Command DTOs (Application ← Presentation)
// ────────────────────────────────────────────────────────────

export interface CreateNotificationDto {
  type: NotificationType;
  title: string;
  content: string;
  userId: string;
  entityId?: string;
  entityType?: NotificationEntityType;
  metadata?: NotificationPayload;
}

export interface GetNotificationsDto {
  userId: string;
  page?: number;
  limit?: number;
}

export interface MarkAsReadDto {
  notificationId: string;
  userId: string;
}

export interface MarkAllAsReadDto {
  userId: string;
}

// ────────────────────────────────────────────────────────────
// Response DTOs (Application → Presentation)
// ────────────────────────────────────────────────────────────

export interface NotificationResponseDto {
  id: string;
  type: NotificationType;
  title: string;
  content: string;
  isRead: boolean;
  entityId?: string;
  entityType?: NotificationEntityType;
  metadata?: NotificationPayload;
  createdAt: string; // ISO-8601
}

export interface NotificationListResponseDto {
  items: NotificationResponseDto[];
  total: number;
  page: number;
  limit: number;
}

export interface UnreadCountResponseDto {
  count: number;
}
