import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { NotificationApplicationService } from '../../application/notification-application.service';
import {
  CreateNotificationRequestDto,
  UpdateNotificationRequestDto,
  NotificationResponseDto,
  NotificationListResponseDto,
  NotificationQueryRequestDto,
  NotificationStatsResponseDto,
  BulkNotificationActionRequestDto,
  CleanupStatsResponseDto,
  CleanupResultResponseDto,
} from '../dto/notification-request.dto';

/**
 * Presentation layer controller for notification operations
 * Maps HTTP requests to application services
 */
@ApiTags('notifications')
@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly notificationApplicationService: NotificationApplicationService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new notification' })
  @ApiBody({ type: CreateNotificationRequestDto })
  @ApiResponse({
    status: 201,
    description: 'Notification created successfully',
    type: NotificationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(
    @Body(ValidationPipe) createNotificationDto: CreateNotificationRequestDto,
  ): Promise<NotificationResponseDto> {
    return await this.notificationApplicationService.createNotification(
      createNotificationDto,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Get user notifications with pagination and filtering',
  })
  @ApiQuery({
    name: 'userId',
    required: true,
    type: String,
    description: 'User ID',
  })
  @ApiQuery({ name: 'isRead', required: false, type: Boolean })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['like', 'comment', 'follow', 'message'],
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['newest', 'oldest'] })
  @ApiResponse({
    status: 200,
    description: 'Notifications retrieved successfully',
    type: NotificationListResponseDto,
  })
  async findAll(
    @Query('userId') userId: string,
    @Query(ValidationPipe) query: NotificationQueryRequestDto,
  ): Promise<NotificationListResponseDto> {
    return await this.notificationApplicationService.getNotifications(
      userId,
      query,
    );
  }

  @Get('stats/:userId')
  @ApiOperation({ summary: 'Get notification statistics for user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Notification statistics retrieved successfully',
    type: NotificationStatsResponseDto,
  })
  async getStats(
    @Param('userId') userId: string,
  ): Promise<NotificationStatsResponseDto> {
    return await this.notificationApplicationService.getNotificationStats(
      userId,
    );
  }

  @Get('unread-count/:userId')
  @ApiOperation({ summary: 'Get unread notifications count' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Unread count retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        count: { type: 'number', example: 5 },
        userId: { type: 'string', example: 'user-123' },
      },
    },
  })
  async getUnreadCount(
    @Param('userId') userId: string,
  ): Promise<{ count: number; userId: string }> {
    const count =
      await this.notificationApplicationService.getUnreadCount(userId);
    return { count, userId };
  }

  @Get('realtime/:userId')
  @ApiOperation({ summary: 'Get real-time notifications since timestamp' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiQuery({
    name: 'since',
    required: true,
    type: String,
    description: 'ISO timestamp to get notifications since',
    example: '2024-01-01T00:00:00.000Z',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 50 })
  @ApiResponse({
    status: 200,
    description: 'Real-time notifications retrieved successfully',
    type: [NotificationResponseDto],
  })
  async getRealtimeNotifications(
    @Param('userId') userId: string,
    @Query('since') sinceTimestamp: string,
    @Query('limit') limit?: number,
  ): Promise<NotificationResponseDto[]> {
    const since = new Date(sinceTimestamp);
    return await this.notificationApplicationService.getLatestNotifications(
      userId,
      since,
      limit || 50,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific notification by ID' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiQuery({
    name: 'userId',
    required: true,
    type: String,
    description: 'User ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification retrieved successfully',
    type: NotificationResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async findOne(
    @Param('id') id: string,
    @Query('userId') userId: string,
  ): Promise<NotificationResponseDto> {
    return await this.notificationApplicationService.getNotification(
      id,
      userId,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a notification' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiQuery({
    name: 'userId',
    required: true,
    type: String,
    description: 'User ID',
  })
  @ApiBody({ type: UpdateNotificationRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Notification updated successfully',
    type: NotificationResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async update(
    @Param('id') id: string,
    @Query('userId') userId: string,
    @Body(ValidationPipe) updateNotificationDto: UpdateNotificationRequestDto,
  ): Promise<NotificationResponseDto> {
    return await this.notificationApplicationService.updateNotification(
      id,
      userId,
      updateNotificationDto,
    );
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiQuery({
    name: 'userId',
    required: true,
    type: String,
    description: 'User ID',
  })
  @ApiResponse({ status: 204, description: 'Notification marked as read' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async markAsRead(
    @Param('id') id: string,
    @Query('userId') userId: string,
  ): Promise<void> {
    await this.notificationApplicationService.markAsRead(id, userId);
  }

  @Post(':id/unread')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark notification as unread' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiQuery({
    name: 'userId',
    required: true,
    type: String,
    description: 'User ID',
  })
  @ApiResponse({ status: 204, description: 'Notification marked as unread' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async markAsUnread(
    @Param('id') id: string,
    @Query('userId') userId: string,
  ): Promise<void> {
    await this.notificationApplicationService.markAsUnread(id, userId);
  }

  @Post('mark-read-bulk')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark multiple notifications as read' })
  @ApiBody({ type: BulkNotificationActionRequestDto })
  @ApiResponse({ status: 204, description: 'Notifications marked as read' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async markAsReadBulk(
    @Query('userId') userId: string,
    @Body(ValidationPipe) dto: BulkNotificationActionRequestDto,
  ): Promise<void> {
    await this.notificationApplicationService.markAsReadBulk(
      dto.notificationIds,
      userId,
    );
  }

  @Post('mark-unread-bulk')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark multiple notifications as unread' })
  @ApiBody({ type: BulkNotificationActionRequestDto })
  @ApiResponse({ status: 204, description: 'Notifications marked as unread' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async markAsUnreadBulk(
    @Query('userId') userId: string,
    @Body(ValidationPipe) dto: BulkNotificationActionRequestDto,
  ): Promise<void> {
    await this.notificationApplicationService.markAsUnreadBulk(
      dto.notificationIds,
      userId,
    );
  }

  @Post('mark-all-read/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 204, description: 'All notifications marked as read' })
  async markAllAsRead(@Param('userId') userId: string): Promise<void> {
    await this.notificationApplicationService.markAllAsRead(userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a notification' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiQuery({
    name: 'userId',
    required: true,
    type: String,
    description: 'User ID',
  })
  @ApiResponse({
    status: 204,
    description: 'Notification deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async remove(
    @Param('id') id: string,
    @Query('userId') userId: string,
  ): Promise<void> {
    await this.notificationApplicationService.deleteNotification(id, userId);
  }

  @Post('delete-bulk')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete multiple notifications' })
  @ApiBody({ type: BulkNotificationActionRequestDto })
  @ApiResponse({
    status: 204,
    description: 'Notifications deleted successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async deleteBulk(
    @Query('userId') userId: string,
    @Body(ValidationPipe) dto: BulkNotificationActionRequestDto,
  ): Promise<void> {
    await this.notificationApplicationService.deleteNotificationsBulk(
      dto.notificationIds,
      userId,
    );
  }

  @Get('cleanup/stats/:userId')
  @ApiOperation({ summary: 'Get cleanup statistics' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiQuery({
    name: 'olderThanDays',
    required: false,
    type: Number,
    example: 30,
    description: 'Calculate stats for notifications older than specified days',
  })
  @ApiResponse({
    status: 200,
    description: 'Cleanup statistics retrieved successfully',
    type: CleanupStatsResponseDto,
  })
  async getCleanupStats(
    @Param('userId') userId: string,
    @Query('olderThanDays') olderThanDays?: number,
  ): Promise<CleanupStatsResponseDto> {
    const stats = await this.notificationApplicationService.getCleanupStats(
      userId,
      olderThanDays || 30,
    );

    return {
      userId,
      totalEligibleForCleanup: stats.estimatedCleanupCount,
      readEligibleForCleanup: stats.readNotifications,
      unreadEligibleForCleanup:
        stats.totalNotifications - stats.readNotifications,
      olderThanDays: olderThanDays || 30,
      oldestEligibleDate: new Date(
        Date.now() - (olderThanDays || 30) * 24 * 60 * 60 * 1000,
      ),
      generatedAt: new Date(),
    };
  }

  @Post('cleanup/read/:userId')
  @ApiOperation({ summary: 'Cleanup old read notifications' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiQuery({
    name: 'olderThanDays',
    required: false,
    type: Number,
    example: 30,
    description: 'Delete read notifications older than specified days',
  })
  @ApiResponse({
    status: 200,
    description: 'Cleanup completed',
    type: CleanupResultResponseDto,
  })
  async cleanupRead(
    @Param('userId') userId: string,
    @Query('olderThanDays') olderThanDays?: number,
  ): Promise<CleanupResultResponseDto> {
    const result =
      await this.notificationApplicationService.cleanupUserReadNotifications(
        userId,
        olderThanDays || 30,
      );
    return {
      userId,
      deletedCount: result.deletedCount,
      olderThanDays: olderThanDays || 30,
      cleanupDate: new Date(),
      success: true,
    };
  }

  @Post('cleanup/system')
  @ApiOperation({
    summary: 'System-wide cleanup of old notifications (Admin only)',
  })
  @ApiQuery({
    name: 'olderThanDays',
    required: false,
    type: Number,
    example: 90,
    description: 'Delete notifications older than specified days',
  })
  @ApiResponse({
    status: 200,
    description: 'System cleanup completed',
    type: CleanupResultResponseDto,
  })
  async cleanupSystem(
    @Query('olderThanDays') olderThanDays?: number,
  ): Promise<CleanupResultResponseDto> {
    const result =
      await this.notificationApplicationService.cleanupSystemOldNotifications(
        olderThanDays || 90,
      );
    return {
      userId: 'system',
      deletedCount: result.deletedCount,
      olderThanDays: olderThanDays || 90,
      cleanupDate: new Date(),
      success: true,
    };
  }
}
