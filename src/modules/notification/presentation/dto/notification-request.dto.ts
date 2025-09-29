import {
  IsOptional,
  IsString,
  IsBoolean,
  IsEnum,
  IsArray,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  NotificationType,
  NotificationEntityType,
} from '../../domain/notification.entity';

export enum NotificationTypeDto {
  LIKE = 'like',
  COMMENT = 'comment',
  FOLLOW = 'follow',
  MESSAGE = 'message',
}

export enum SortByDto {
  NEWEST = 'newest',
  OLDEST = 'oldest',
}

/**
 * Request DTOs for Notification endpoints
 */
export class CreateNotificationRequestDto {
  @ApiProperty({
    description: 'ID of the user receiving the notification',
    example: 'user-123',
  })
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'Type of notification',
    enum: NotificationType,
    example: 'like',
  })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({
    description: 'Notification title',
    example: 'New like on your post',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Notification content',
    example: 'John Doe liked your post about clean architecture',
  })
  @IsString()
  content: string;

  @ApiPropertyOptional({
    description: 'Related entity ID (post, comment, etc.)',
    example: 'post-789',
  })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiPropertyOptional({
    enum: NotificationEntityType,
    description: 'Related entity type',
    example: 'post',
  })
  @IsOptional()
  @IsEnum(NotificationEntityType)
  entityType?: NotificationEntityType;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: { postTitle: 'My first post' },
  })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateNotificationRequestDto {
  @ApiPropertyOptional({ description: 'Updated notification title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Updated notification content' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ description: 'Mark as read/unread' })
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;

  @ApiPropertyOptional({ description: 'Updated metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class NotificationQueryRequestDto {
  @ApiPropertyOptional({ description: 'Filter by read status' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  isRead?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by notification type',
    enum: NotificationType,
  })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiPropertyOptional({ description: 'Page number', example: 1, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value) || 1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value) || 20)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: SortByDto,
    example: 'newest',
  })
  @IsOptional()
  @IsEnum(SortByDto)
  sortBy?: SortByDto = SortByDto.NEWEST;
}

export class BulkNotificationActionRequestDto {
  @ApiProperty({
    description: 'Array of notification IDs',
    type: [String],
    example: ['notif-1', 'notif-2', 'notif-3'],
  })
  @IsArray()
  @IsString({ each: true })
  notificationIds: string[];
}

/**
 * Response DTOs for Notification endpoints
 */
export class NotificationResponseDto {
  @ApiProperty({ description: 'Notification ID', example: 'notif-123' })
  id: string;

  @ApiProperty({
    description: 'Notification type',
    enum: NotificationType,
    example: 'like',
  })
  type: NotificationType;

  @ApiProperty({
    description: 'Notification title',
    example: 'New like on your post',
  })
  title: string;

  @ApiProperty({
    description: 'Notification content',
    example: 'John Doe liked your post',
  })
  content: string;

  @ApiProperty({
    description: 'User ID receiving the notification',
    example: 'user-123',
  })
  userId: string;

  @ApiProperty({ description: 'Read status', example: false })
  isRead: boolean;

  @ApiPropertyOptional({
    description: 'Related entity ID',
    example: 'post-789',
  })
  entityId?: string;

  @ApiPropertyOptional({
    enum: NotificationEntityType,
    description: 'Related entity type',
    example: 'post',
  })
  entityType?: NotificationEntityType;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiPropertyOptional({
    description: 'Notification priority',
    example: 'medium',
  })
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

export class NotificationStatsResponseDto {
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

export class CleanupStatsResponseDto {
  @ApiProperty({ description: 'User ID', example: 'user-123' })
  userId: string;

  @ApiProperty({
    description: 'Total notifications eligible for cleanup',
    example: 50,
  })
  totalEligibleForCleanup: number;

  @ApiProperty({
    description: 'Read notifications eligible for cleanup',
    example: 45,
  })
  readEligibleForCleanup: number;

  @ApiProperty({
    description: 'Unread notifications eligible for cleanup',
    example: 5,
  })
  unreadEligibleForCleanup: number;

  @ApiProperty({ description: 'Cleanup criteria (days)', example: 30 })
  olderThanDays: number;

  @ApiProperty({
    description: 'Oldest eligible notification date',
    example: '2023-12-01T00:00:00.000Z',
  })
  oldestEligibleDate: Date;

  @ApiProperty({
    description: 'Statistics generation timestamp',
    example: '2024-01-01T12:00:00.000Z',
  })
  generatedAt: Date;
}

export class CleanupResultResponseDto {
  @ApiProperty({ description: 'User ID or system', example: 'user-123' })
  userId: string;

  @ApiProperty({ description: 'Number of notifications deleted', example: 45 })
  deletedCount: number;

  @ApiProperty({ description: 'Cleanup criteria (days)', example: 30 })
  olderThanDays: number;

  @ApiProperty({
    description: 'Cleanup operation timestamp',
    example: '2024-01-01T12:00:00.000Z',
  })
  cleanupDate: Date;

  @ApiProperty({ description: 'Operation success status', example: true })
  success: boolean;

  @ApiPropertyOptional({ description: 'Error message if cleanup failed' })
  error?: string;
}
