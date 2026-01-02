import { Injectable, Logger, Inject } from '@nestjs/common';
import { User, IUserRepository, UserId } from '../../domain';
import { IEventBus } from '../../../../infrastructure/events';
import { EntityNotFoundException } from '../../../../shared/exceptions/domain.exception';
import { DomainEventAdapter } from '../adapters/event.adapter';
import { USER_REPOSITORY_TOKEN, EVENT_BUS_TOKEN } from '../../users.constants';

/**
 * Use case for following a user
 * Implements Clean Architecture principles
 */
@Injectable()
export class FollowUserUseCase {
  private readonly logger = new Logger(FollowUserUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
    @Inject(EVENT_BUS_TOKEN)
    private readonly eventBus: IEventBus,
  ) {}

  async execute(followerId: string, followeeId: string): Promise<void> {
    this.logger.log(
      `User ${followerId} attempting to follow user ${followeeId}`,
    );

    // Create value objects
    const followerUserId = UserId.create(followerId);
    const followeeUserId = UserId.create(followeeId);

    // Load both users
    const [follower, followee] = await Promise.all([
      this.userRepository.findById(followerUserId.getValue()),
      this.userRepository.findById(followeeUserId.getValue()),
    ]);

    if (!follower) {
      throw new EntityNotFoundException('User', followerId);
    }

    if (!followee) {
      throw new EntityNotFoundException('User', followeeId);
    }

    // Validate business rules - cannot follow yourself
    if (followerId === followeeId) {
      throw new Error('Cannot follow yourself');
    }

    // Execute domain logic
    follower.follow(followeeId, followee.username);
    followee.addFollower(followerId);

    // Update follow relationship
    await this.userRepository.updateFollowRelationship(
      followerUserId,
      followeeUserId,
      true,
    );

    // Save users
    await Promise.all([
      this.userRepository.save(follower),
      this.userRepository.save(followee),
    ]);

    // Publish domain events
    for (const event of follower.getDomainEvents()) {
      const adaptedEvent = DomainEventAdapter.adapt(event);
      await this.eventBus.publish(adaptedEvent);
    }
    follower.clearDomainEvents();

    this.logger.log(
      `User ${followerId} successfully followed user ${followeeId}`,
    );
  }
}

/**
 * Use case for unfollowing a user
 */
@Injectable()
export class UnfollowUserUseCase {
  private readonly logger = new Logger(UnfollowUserUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
    @Inject(EVENT_BUS_TOKEN)
    private readonly eventBus: IEventBus,
  ) {}

  async execute(followerId: string, followeeId: string): Promise<void> {
    this.logger.log(
      `User ${followerId} attempting to unfollow user ${followeeId}`,
    );

    // Create value objects
    const followerUserId = UserId.create(followerId);
    const followeeUserId = UserId.create(followeeId);

    // Load both users
    const [follower, followee] = await Promise.all([
      this.userRepository.findById(followerUserId.getValue()),
      this.userRepository.findById(followeeUserId.getValue()),
    ]);

    if (!follower) {
      throw new EntityNotFoundException('User', followerId);
    }

    if (!followee) {
      throw new EntityNotFoundException('User', followeeId);
    }

    // Validate business rules using domain service
    // Validate business rules - cannot unfollow yourself
    if (followerId === followeeId) {
      throw new Error('Cannot unfollow yourself');
    }

    // Execute domain logic
    follower.unfollow(followeeId, followee.username);
    followee.removeFollower(followerId);

    // Update follow relationship
    await this.userRepository.updateFollowRelationship(
      followerUserId,
      followeeUserId,
      false,
    );

    // Save users
    await Promise.all([
      this.userRepository.save(follower),
      this.userRepository.save(followee),
    ]);

    // Publish domain events
    for (const event of follower.getDomainEvents()) {
      const adaptedEvent = DomainEventAdapter.adapt(event);
      await this.eventBus.publish(adaptedEvent);
    }
    follower.clearDomainEvents();

    this.logger.log(
      `User ${followerId} successfully unfollowed user ${followeeId}`,
    );
  }
}
