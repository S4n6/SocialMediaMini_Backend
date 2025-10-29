import { Injectable } from '@nestjs/common';
import { NotificationService } from '../../application/interfaces/external-services.interface';

/**
 * Infrastructure Adapter for Notification Service Integration
 * Implements notification service interface for sending follow notifications
 */
@Injectable()
export class NotificationAdapter implements NotificationService {
  async createFollowNotification(data: {
    followerId: string;
    followingId: string;
    followerUserName: string;
  }): Promise<void> {
    try {
      // TODO: Implement with actual notification queue/service
      // This is a placeholder implementation
      console.log('Follow notification queued:', {
        type: 'follow',
        fromUserId: data.followerId,
        toUserId: data.followingId,
        message: `${data.followerUserName} started following you`,
        timestamp: new Date().toISOString(),
      });

      // In real implementation:
      // await this.notificationQueue.add('follow-notification', data);
    } catch (error) {
      console.error('Failed to queue follow notification:', error);
      // Don't throw error as notification failures shouldn't break follow operation
      // Just log the error for monitoring
    }
  }
}
