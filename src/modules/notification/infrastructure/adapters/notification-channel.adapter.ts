import { Injectable } from '@nestjs/common';
import { NotificationEntity } from '../../domain/entities/notification.entity';
import { EmailNotificationService } from '../services/email-notification.service';
import { PushNotificationService } from '../services/push-notification.service';
import { RealtimeNotificationService } from '../services/realtime-notification.service';

/**
 * Adapter for external notification services
 * Provides a unified interface for sending notifications through multiple channels
 */
@Injectable()
export class NotificationChannelAdapter {
  constructor(
    private readonly emailService: EmailNotificationService,
    private readonly pushService: PushNotificationService,
    private readonly realtimeService: RealtimeNotificationService,
  ) {}

  /**
   * Send notification through all enabled channels
   */
  async sendThroughAllChannels(
    notification: NotificationEntity,
    channels: {
      email?: boolean;
      push?: boolean;
      realtime?: boolean;
    } = { email: true, push: true, realtime: true },
  ): Promise<{
    email?: boolean;
    push?: boolean;
    realtime?: boolean;
    errors: string[];
  }> {
    const results: any = {};
    const errors: string[] = [];

    // Send through email channel
    if (channels.email) {
      try {
        results.email = await this.emailService.sendNotificationEmail({
          to: notification.userId, // In real app, would resolve to email address
          subject: notification.title,
          content: notification.content,
          type: notification.type,
          metadata: {
            notificationId: notification.id,
            entityId: notification.entityId,
            entityType: notification.entityType,
          },
        });
      } catch (error) {
        errors.push(`Email channel failed: ${error.message}`);
        results.email = false;
      }
    }

    // Send through push channel
    if (channels.push) {
      try {
        results.push = await this.pushService.sendPushNotification({
          userId: notification.userId,
          title: notification.title,
          body: notification.content,
          type: notification.type,
          data: {
            notificationId: notification.id,
            entityId: notification.entityId,
            entityType: notification.entityType,
          },
        });
      } catch (error) {
        errors.push(`Push channel failed: ${error.message}`);
        results.push = false;
      }
    }

    // Send through realtime channel
    if (channels.realtime) {
      try {
        await this.realtimeService.sendToUser(notification.userId, {
          userId: notification.userId,
          notification: {
            id: notification.id,
            type: notification.type,
            title: notification.title,
            content: notification.content,
            userId: notification.userId,
            isRead: notification.isRead,
            entityId: notification.entityId,
            entityType: notification.entityType,
            createdAt: notification.createdAt,
          },
          type: 'notification_created',
          timestamp: new Date(),
        });
        results.realtime = true;
      } catch (error) {
        errors.push(`Realtime channel failed: ${error.message}`);
        results.realtime = false;
      }
    }

    return { ...results, errors };
  }

  /**
   * Send bulk notifications through specified channels
   */
  async sendBulkThroughChannels(
    notifications: NotificationEntity[],
    channels: {
      email?: boolean;
      push?: boolean;
      realtime?: boolean;
    } = { email: true, push: true, realtime: true },
  ): Promise<{
    successCount: number;
    failureCount: number;
    results: Array<{
      notificationId: string;
      success: boolean;
      channels: { email?: boolean; push?: boolean; realtime?: boolean };
      errors: string[];
    }>;
  }> {
    const results = await Promise.all(
      notifications.map(async (notification) => {
        const result = await this.sendThroughAllChannels(
          notification,
          channels,
        );
        return {
          notificationId: notification.id,
          success: result.errors.length === 0,
          channels: {
            email: result.email,
            push: result.push,
            realtime: result.realtime,
          },
          errors: result.errors,
        };
      }),
    );

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.length - successCount;

    return {
      successCount,
      failureCount,
      results,
    };
  }
}
