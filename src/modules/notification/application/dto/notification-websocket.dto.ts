import {
  IsString,
  IsUUID,
  IsOptional,
  IsBoolean,
  IsObject,
  IsArray,
  ArrayNotEmpty,
} from 'class-validator';

export class MarkNotificationReadDto {
  @IsUUID()
  notificationId: string;
}

export class MarkAllNotificationsReadDto {
  @IsOptional()
  @IsString()
  type?: string; // Optional: mark only specific type as read
}

export class SubscribeNotificationDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  types: string[]; // Notification types to subscribe to

  @IsOptional()
  @IsObject()
  filters?: {
    userId?: string;
    tags?: string[];
    priority?: string;
  };
}

export class UnsubscribeNotificationDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  types: string[]; // Notification types to unsubscribe from
}

export class GetNotificationHistoryDto {
  @IsOptional()
  @IsString()
  cursor?: string; // For pagination

  @IsOptional()
  @IsString()
  limit?: string; // Number of notifications to fetch

  @IsOptional()
  @IsString()
  type?: string; // Filter by notification type

  @IsOptional()
  @IsBoolean()
  unreadOnly?: boolean; // Only fetch unread notifications
}

// Response DTOs
export class NotificationDto {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  tags?: string[];
}

export class NotificationCountDto {
  total: number;
  unread: number;
  byType: Record<string, number>;
}
