import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import Redis from 'ioredis';
import { NotificationApplicationService } from '../../application/notification-application.service';
import { PrismaService } from '../../../../database/prisma.service';
import { NotificationType } from '../../domain/notification.entity';

interface NotificationJobData {
  reactorId: string;
  targetUserId: string;
  type: string;
  content?: string;
  entityId?: string;
  entityType?: string;
  actorUserId?: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
  title?: string;
  message?: string;
  metadata?: Record<string, any>;
}

/**
 * Presentation layer processor for handling notification queue jobs
 * Processes background notification tasks and publishes real-time events
 */
@Processor('notification-queue')
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);
  private readonly redisClient = new Redis(
    process.env.REDIS_URL || 'redis://localhost:6379',
  );

  constructor(
    private readonly notificationApplicationService: NotificationApplicationService,
    private readonly prismaService: PrismaService,
  ) {
    super();
  }

  async process(job: Job<NotificationJobData, any, string>): Promise<any> {
    this.logger.log(
      `[Job ${job.id}] Started processing job with name: ${job.name}`,
    );

    try {
      const jobData = job.data;

      const jobId = job.id || 'unknown';

      switch (job.name) {
        case 'create-notification':
          await this.processCreateNotification(jobId, jobData);
          break;
        case 'reaction-notification':
          await this.processReactionNotification(jobId, jobData);
          break;
        case 'follow-notification':
          await this.processFollowNotification(jobId, jobData);
          break;
        case 'comment-notification':
          await this.processCommentNotification(jobId, jobData);
          break;
        case 'message-notification':
          await this.processMessageNotification(jobId, jobData);
          break;
        case 'bulk-notification':
          await this.processBulkNotification(jobId, jobData);
          break;
        default:
          this.logger.warn(`[Job ${jobId}] Unknown job name: ${job.name}`);
          break;
      }

      this.logger.log(`[Job ${job.id}] Successfully processed`);
    } catch (error) {
      this.logger.error(
        `[Job ${job.id}] Failed with error: ${error.message}`,
        error.stack,
      );
      // Ném lỗi để BullMQ có thể thử lại job nếu cần
      throw error;
    }
  }

  /**
   * Process generic notification creation
   */
  private async processCreateNotification(
    jobId: string | number,
    data: NotificationJobData,
  ): Promise<void> {
    const {
      targetUserId,
      type,
      title,
      message,
      actorUserId,
      relatedEntityId,
      relatedEntityType,
      metadata,
    } = data;

    if (!targetUserId || !type || !title || !message) {
      this.logger.warn(
        `[Job ${jobId}] Missing required fields for notification creation`,
      );
      return;
    }

    // Tạo thông báo trong database
    const notification =
      await this.notificationApplicationService.createNotification({
        userId: targetUserId,
        type: type as any,
        title,
        content: message,
      });

    // Publish sự kiện qua Redis cho real-time updates
    await this.publishNotificationEvent(targetUserId, notification);

    this.logger.log(
      `[Job ${jobId}] Generic notification created for user ${targetUserId}`,
    );
  }

  /**
   * Process reaction notification (like, heart, etc.)
   */
  private async processReactionNotification(
    jobId: string | number,
    data: NotificationJobData,
  ): Promise<void> {
    const { reactorId, targetUserId, type, entityId, entityType } = data;

    // Tìm nạp thông tin cần thiết từ cơ sở dữ liệu để đảm bảo tính nhất quán
    const reactor = await this.prismaService.user.findUnique({
      where: { id: reactorId },
      select: { id: true, fullName: true, username: true },
    });

    if (!reactor) {
      this.logger.warn(
        `[Job ${jobId}] Reactor with ID ${reactorId} not found. Skipping notification.`,
      );
      return;
    }

    // Xây dựng tiêu đề và nội dung thông báo
    const title = `New ${type} on your ${entityType}`;
    const message = `${reactor.fullName} reacted to your ${entityType}`;

    // Tạo thông báo trong database
    const notification =
      await this.notificationApplicationService.createNotification({
        userId: targetUserId,
        type: NotificationType.LIKE,
        title,
        content: message,
        entityId,
        entityType: entityType as any,
      });

    // Publish sự kiện qua Redis
    await this.publishNotificationEvent(targetUserId, notification);

    this.logger.log(
      `[Job ${jobId}] Reaction notification created for user ${targetUserId}`,
    );
  }

  /**
   * Process follow notification
   */
  private async processFollowNotification(
    jobId: string | number,
    data: NotificationJobData,
  ): Promise<void> {
    const { actorUserId, targetUserId } = data;

    const follower = await this.prismaService.user.findUnique({
      where: { id: actorUserId },
      select: { id: true, fullName: true, username: true },
    });

    if (!follower) {
      this.logger.warn(
        `[Job ${jobId}] Follower with ID ${actorUserId} not found`,
      );
      return;
    }

    const notification =
      await this.notificationApplicationService.createNotification({
        userId: targetUserId,
        type: NotificationType.FOLLOW,
        title: 'New follower',
        content: `${follower.fullName} started following you`,
      });

    await this.publishNotificationEvent(targetUserId, notification);

    this.logger.log(
      `[Job ${jobId}] Follow notification created for user ${targetUserId}`,
    );
  }

  /**
   * Process comment notification
   */
  private async processCommentNotification(
    jobId: string | number,
    data: NotificationJobData,
  ): Promise<void> {
    const { actorUserId, targetUserId, entityId, entityType, content } = data;

    const commenter = await this.prismaService.user.findUnique({
      where: { id: actorUserId },
      select: { id: true, fullName: true, username: true },
    });

    if (!commenter) {
      this.logger.warn(
        `[Job ${jobId}] Commenter with ID ${actorUserId} not found`,
      );
      return;
    }

    const notification =
      await this.notificationApplicationService.createNotification({
        userId: targetUserId,
        type: NotificationType.COMMENT,
        title: 'New comment',
        content: `${commenter.fullName} commented on your ${entityType}`,
        entityId,
        entityType: entityType as any,
      });

    await this.publishNotificationEvent(targetUserId, notification);

    this.logger.log(
      `[Job ${jobId}] Comment notification created for user ${targetUserId}`,
    );
  }

  /**
   * Process message notification
   */
  private async processMessageNotification(
    jobId: string | number,
    data: NotificationJobData,
  ): Promise<void> {
    const { actorUserId, targetUserId, content } = data;

    const sender = await this.prismaService.user.findUnique({
      where: { id: actorUserId },
      select: { id: true, fullName: true, username: true },
    });

    if (!sender) {
      this.logger.warn(
        `[Job ${jobId}] Sender with ID ${actorUserId} not found`,
      );
      return;
    }

    const notification =
      await this.notificationApplicationService.createNotification({
        userId: targetUserId,
        type: NotificationType.MESSAGE,
        title: 'New message',
        content: `${sender.fullName} sent you a message`,
      });

    await this.publishNotificationEvent(targetUserId, notification);

    this.logger.log(
      `[Job ${jobId}] Message notification created for user ${targetUserId}`,
    );
  }

  /**
   * Process bulk notifications
   */
  private async processBulkNotification(
    jobId: string | number,
    data: NotificationJobData & { targetUserIds?: string[] },
  ): Promise<void> {
    const {
      targetUserIds,
      type,
      title,
      message,
      actorUserId,
      relatedEntityId,
      relatedEntityType,
      metadata,
    } = data;

    if (
      !targetUserIds ||
      !Array.isArray(targetUserIds) ||
      targetUserIds.length === 0
    ) {
      this.logger.warn(
        `[Job ${jobId}] No target users provided for bulk notification`,
      );
      return;
    }

    // Process in batches to avoid overwhelming the database
    const batchSize = 50;
    for (let i = 0; i < targetUserIds.length; i += batchSize) {
      const batch = targetUserIds.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (userId) => {
          try {
            const notification =
              await this.notificationApplicationService.createNotification({
                userId,
                type: type as any,
                title: title || 'New notification',
                content: message || 'You have a new notification',
              });

            await this.publishNotificationEvent(userId, notification);
          } catch (error) {
            this.logger.error(
              `[Job ${jobId}] Failed to create notification for user ${userId}`,
              error,
            );
          }
        }),
      );
    }

    this.logger.log(
      `[Job ${jobId}] Bulk notifications created for ${targetUserIds.length} users`,
    );
  }

  /**
   * Publish notification event to Redis for real-time updates
   */
  private async publishNotificationEvent(
    targetUserId: string,
    notification: any,
  ): Promise<void> {
    try {
      await this.redisClient.publish(
        'notifications',
        JSON.stringify({ targetUserId, notification }),
      );
      this.logger.debug(
        `Published notification event for user ${targetUserId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish notification event for user ${targetUserId}`,
        error,
      );
    }
  }
}
