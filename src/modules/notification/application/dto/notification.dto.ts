import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType, NotificationEntityType } from '../../domain';

export class CreateNotificationDto {
  @ApiProperty({
    enum: NotificationType,
    description: 'Type of notification',
  })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ description: 'Notification title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Notification content' })
  @IsString()
  content: string;

  @ApiProperty({ description: 'User ID who will receive the notification' })
  @IsUUID()
  userId: string;

  @ApiPropertyOptional({
    description: 'ID of related entity (post, user, etc.)',
  })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiPropertyOptional({
    enum: NotificationEntityType,
    description: 'Type of related entity',
  })
  @IsOptional()
  @IsEnum(NotificationEntityType)
  entityType?: NotificationEntityType;
}

export class UpdateNotificationDto {
  @ApiPropertyOptional({ description: 'Notification title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Notification content' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ description: 'Read status' })
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;
}

export class NotificationResponseDto {
  @ApiProperty({ description: 'Notification ID' })
  id: string;

  @ApiProperty({
    enum: NotificationType,
    description: 'Type of notification',
  })
  type: NotificationType;

  @ApiProperty({ description: 'Notification title' })
  title: string;

  @ApiProperty({ description: 'Notification content' })
  content: string;

  @ApiProperty({ description: 'User ID who received the notification' })
  userId: string;

  @ApiProperty({ description: 'Read status' })
  isRead: boolean;

  @ApiPropertyOptional({ description: 'ID of related entity' })
  entityId?: string;

  @ApiPropertyOptional({
    enum: NotificationEntityType,
    description: 'Type of related entity',
  })
  entityType?: NotificationEntityType;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'Notification priority' })
  priority?: 'high' | 'medium' | 'low';
}

export class NotificationListResponseDto {
  @ApiProperty({
    type: [NotificationResponseDto],
    description: 'List of notifications',
  })
  notifications: NotificationResponseDto[];

  @ApiProperty({ description: 'Total count of notifications' })
  total: number;

  @ApiProperty({ description: 'Count of unread notifications' })
  unreadCount: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;
}

export class NotificationStatsDto {
  @ApiProperty({ description: 'Total count of notifications' })
  totalCount: number;

  @ApiProperty({ description: 'Count of unread notifications' })
  unreadCount: number;

  @ApiProperty({
    description: 'Breakdown by notification type',
  })
  typeBreakdown: Record<NotificationType, number>;

  @ApiProperty({
    description: 'Breakdown by priority',
  })
  priorityBreakdown: Record<'high' | 'medium' | 'low', number>;
}

export class BulkNotificationActionDto {
  @ApiProperty({
    type: [String],
    description: 'Array of notification IDs',
  })
  @IsUUID(4, { each: true })
  notificationIds: string[];
}

export class MarkAsReadDto extends BulkNotificationActionDto {}

export class MarkAsUnreadDto extends BulkNotificationActionDto {}

export class DeleteNotificationsDto extends BulkNotificationActionDto {}

export class NotificationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by read status',
  })
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;

  @ApiPropertyOptional({
    enum: NotificationType,
    description: 'Filter by notification type',
  })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiPropertyOptional({
    enum: NotificationEntityType,
    description: 'Filter by entity type',
  })
  @IsOptional()
  @IsEnum(NotificationEntityType)
  entityType?: NotificationEntityType;

  @ApiPropertyOptional({
    description: 'Filter by entity ID',
  })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiPropertyOptional({
    description: 'Page number',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({
    enum: ['newest', 'oldest'],
    description: 'Sort order',
    default: 'newest',
  })
  @IsOptional()
  sortBy?: 'newest' | 'oldest' = 'newest';
}
