import { Injectable } from '@nestjs/common';
import { NotificationService } from '../application/interfaces/external-services.interface';
import { notificationQueue } from '../../../queues/notification.queue';

@Injectable()
export class QueueNotificationService implements NotificationService {
  async createReactionNotification(data: {
    reactorId: string;
    targetUserId: string;
    entityId: string;
    entityType: 'post' | 'comment';
    content: string;
  }): Promise<void> {
    try {
      await notificationQueue.add('create-notify', {
        reactorId: data.reactorId,
        targetUserId: data.targetUserId,
        type: 'reaction',
        content: data.content,
        entityId: data.entityId,
        entityType: data.entityType,
      });
    } catch (error) {
      console.error('Failed to queue reaction notification:', error);
      throw error;
    }
  }
}
