import { Injectable, Logger } from '@nestjs/common';
import { NotificationService } from '../application/interfaces/external-services.interface';

@Injectable()
export class DirectNotificationService implements NotificationService {
  private readonly logger = new Logger(DirectNotificationService.name);

  async createReactionNotification(data: {
    reactorId: string;
    targetUserId: string;
    entityId: string;
    entityType: 'post' | 'comment';
    content: string;
  }): Promise<void> {
    try {
      // For now, just log the notification
      // This will be replaced by your Golang worker service later
      this.logger.log('Notification would be sent:', {
        reactorId: data.reactorId,
        targetUserId: data.targetUserId,
        type: 'reaction',
        content: data.content,
        entityId: data.entityId,
        entityType: data.entityType,
      });

      // TODO: In the future, you can:
      // 1. Store notification directly in database
      // 2. Send HTTP request to your Golang worker service
      // 3. Use a simple message queue like Redis pub/sub
      // 4. Use event emitters for real-time notifications
    } catch (error) {
      this.logger.error('Failed to create reaction notification:', error);
      throw error;
    }
  }
}
