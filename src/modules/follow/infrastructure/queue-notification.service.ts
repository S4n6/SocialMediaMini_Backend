import { Injectable } from '@nestjs/common';
import { NotificationService } from '../application/interfaces/external-services.interface';

@Injectable()
export class QueueNotificationService implements NotificationService {
  async createFollowNotification(data: {
    followerId: string;
    followingId: string;
    followerUserName: string;
  }): Promise<void> {
    try {
      // Implementation would use notification queue or service
      // For now, we'll just log it
      console.log('Follow notification:', {
        type: 'follow',
        from: data.followerId,
        to: data.followingId,
        message: `${data.followerUserName} started following you`,
      });
    } catch (error) {
      console.error('Failed to create follow notification:', error);
      throw error;
    }
  }
}
