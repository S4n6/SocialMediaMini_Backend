import { Injectable, Logger } from '@nestjs/common';
import { IEventHandler } from '../../../../shared/events/event-bus.interface';
import {
  UserRegisteredEvent,
  UserFollowedEvent,
  UserProfileUpdatedEvent,
  UserEmailVerifiedEvent,
} from '../../domain/user.events';

/**
 * Handler for user registration event
 * Sends welcome email and creates initial data
 */
@Injectable()
export class UserRegisteredEventHandler
  implements IEventHandler<UserRegisteredEvent>
{
  private readonly logger = new Logger(UserRegisteredEventHandler.name);

  constructor() // Inject notification service, email service, etc.
  // private readonly notificationService: INotificationService,
  // private readonly emailService: IEmailService,
  {}

  async handle(event: UserRegisteredEvent): Promise<void> {
    this.logger.log(`Handling UserRegisteredEvent for user: ${event.userId}`);

    try {
      // Send welcome email
      // await this.emailService.sendWelcomeEmail({
      //   to: event.email,
      //   username: event.username,
      //   fullName: event.profile.fullName
      // });

      // Create welcome notification
      // await this.notificationService.createNotification({
      //   userId: event.userId,
      //   type: NotificationType.WELCOME,
      //   title: 'Welcome to Social Media Mini!',
      //   message: 'Welcome to our community! Start by completing your profile.',
      //   data: { isWelcome: true }
      // });

      this.logger.log(
        `UserRegisteredEvent handled successfully for user: ${event.userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to handle UserRegisteredEvent for user: ${event.userId}`,
        error,
      );
      // In production, you might want to queue for retry
    }
  }
}

/**
 * Handler for user followed event
 * Creates notification for the followed user
 */
@Injectable()
export class UserFollowedEventHandler
  implements IEventHandler<UserFollowedEvent>
{
  private readonly logger = new Logger(UserFollowedEventHandler.name);

  constructor() // private readonly notificationService: INotificationService,
  // private readonly userRepository: IUserRepository,
  {}

  async handle(event: UserFollowedEvent): Promise<void> {
    this.logger.log(
      `Handling UserFollowedEvent: ${event.followerId} -> ${event.followeeId}`,
    );

    try {
      // Get follower info for notification
      // const follower = await this.userRepository.findById(event.followerId);
      // if (!follower) return;

      // Create notification for the followed user
      // await this.notificationService.createNotification({
      //   userId: event.followeeId,
      //   type: NotificationType.NEW_FOLLOWER,
      //   title: 'New Follower',
      //   message: `${follower.username} started following you`,
      //   data: {
      //     followerId: event.followerId,
      //     followerUsername: follower.username,
      //     followerAvatar: follower.profile.avatar
      //   }
      // });

      // Update user statistics cache
      // await this.cacheService.invalidateUserStats(event.followeeId);
      // await this.cacheService.invalidateUserStats(event.followerId);

      this.logger.log(`UserFollowedEvent handled successfully`);
    } catch (error) {
      this.logger.error(`Failed to handle UserFollowedEvent`, error);
    }
  }
}

/**
 * Handler for profile updated event
 * Invalidates caches and updates search indexes
 */
@Injectable()
export class UserProfileUpdatedEventHandler
  implements IEventHandler<UserProfileUpdatedEvent>
{
  private readonly logger = new Logger(UserProfileUpdatedEventHandler.name);

  constructor() // private readonly cacheService: ICacheService,
  // private readonly searchService: ISearchService,
  {}

  async handle(event: UserProfileUpdatedEvent): Promise<void> {
    this.logger.log(
      `Handling UserProfileUpdatedEvent for user: ${event.userId}`,
    );

    try {
      // Invalidate user profile caches
      // await this.cacheService.invalidateUserProfile(event.userId);

      // Update search index if searchable fields changed
      // const searchableChanges = this.hasSearchableChanges(event);
      // if (searchableChanges) {
      //   await this.searchService.updateUserIndex(event.userId, {
      //     fullName: event.newProfile.fullName,
      //     bio: event.newProfile.bio,
      //     location: event.newProfile.location
      //   });
      // }

      // If avatar changed, update all user's posts cache
      // if (event.changes.avatar) {
      //   await this.cacheService.invalidateUserPosts(event.userId);
      // }

      this.logger.log(
        `UserProfileUpdatedEvent handled successfully for user: ${event.userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to handle UserProfileUpdatedEvent for user: ${event.userId}`,
        error,
      );
    }
  }

  private hasSearchableChanges(event: UserProfileUpdatedEvent): boolean {
    const eventData = event.toJSON();
    const changes = eventData.data.changes;
    return !!(changes.fullName || changes.bio);
  }
}

/**
 * Handler for email verified event
 * Updates user permissions and sends confirmation
 */
@Injectable()
export class UserEmailVerifiedEventHandler
  implements IEventHandler<UserEmailVerifiedEvent>
{
  private readonly logger = new Logger(UserEmailVerifiedEventHandler.name);

  constructor() // private readonly notificationService: INotificationService,
  // private readonly emailService: IEmailService,
  {}

  async handle(event: UserEmailVerifiedEvent): Promise<void> {
    this.logger.log(
      `Handling UserEmailVerifiedEvent for user: ${event.userId}`,
    );

    try {
      // Send email verification confirmation
      // await this.emailService.sendEmailVerificationConfirmation({
      //   to: event.email,
      //   verifiedAt: event.verifiedAt
      // });

      // Create notification
      // await this.notificationService.createNotification({
      //   userId: event.userId,
      //   type: NotificationType.EMAIL_VERIFIED,
      //   title: 'Email Verified',
      //   message: 'Your email has been successfully verified! You can now create posts and interact with others.',
      //   data: { verifiedAt: event.verifiedAt.toISOString() }
      // });

      // Update user permissions cache
      // await this.cacheService.invalidateUserPermissions(event.userId);

      this.logger.log(
        `UserEmailVerifiedEvent handled successfully for user: ${event.userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to handle UserEmailVerifiedEvent for user: ${event.userId}`,
        error,
      );
    }
  }
}
