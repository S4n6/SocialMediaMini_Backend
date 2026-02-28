import { Injectable, Inject, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UserFollowedEvent } from '../../domain/events/follow.events';
import { NotificationService } from '../interfaces/external-services.interface';
import { NOTIFICATION_SERVICE_TOKEN } from '../../constants';

/**
 * Follow Notification Subscriber
 * Handles side effects when a user follows another user
 * Side effects should not fail the main follow operation
 */
@Injectable()
export class FollowNotificationSubscriber {
  private readonly logger = new Logger(FollowNotificationSubscriber.name);

  constructor(
    @Inject(NOTIFICATION_SERVICE_TOKEN)
    private readonly notificationService: NotificationService,
  ) {}

  @OnEvent('follow.user.followed')
  async handleUserFollowed(event: UserFollowedEvent): Promise<void> {
    try {
      await this.notificationService.createFollowNotification({
        followerId: event.followerId,
        followingId: event.followingId,
        followerUserName: event.followerUserName,
      });

      this.logger.log(
        `Follow notification sent: ${event.followerUserName} -> ${event.followingUserName}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send follow notification: ${error}`,
        error instanceof Error ? error.stack : undefined,
      );
      // Don't throw - event subscribers should not fail the main flow
    }
  }
}
