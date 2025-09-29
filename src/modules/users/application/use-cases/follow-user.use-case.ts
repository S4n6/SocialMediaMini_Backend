import { Injectable, Logger, Inject } from '@nestjs/common';
import { User, UserDomainService, IUserRepository, UserId } from '../../domain';
import { IEventBus } from '../../../../shared/events/event-bus.interface';
import { EntityNotFoundException } from '../../../../shared/exceptions/domain.exception';
import { USER_REPOSITORY_TOKEN } from '../../users.module';

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
    private readonly userDomainService: UserDomainService,
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
      this.userRepository.findById(followerUserId),
      this.userRepository.findById(followeeUserId),
    ]);

    if (!follower) {
      throw new EntityNotFoundException('User', followerId);
    }

    if (!followee) {
      throw new EntityNotFoundException('User', followeeId);
    }

    // Validate business rules using domain service
    await this.userDomainService.validateFollowRules(follower, followee);

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
    for (const event of follower.domainEvents) {
      await this.eventBus.publish(event);
    }
    follower.clearEvents();

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
    private readonly userRepository: IUserRepository,
    private readonly userDomainService: UserDomainService,
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
      this.userRepository.findById(followerUserId),
      this.userRepository.findById(followeeUserId),
    ]);

    if (!follower) {
      throw new EntityNotFoundException('User', followerId);
    }

    if (!followee) {
      throw new EntityNotFoundException('User', followeeId);
    }

    // Validate business rules using domain service
    this.userDomainService.validateUnfollowRules(follower, followee);

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
    for (const event of follower.domainEvents) {
      await this.eventBus.publish(event);
    }
    follower.clearEvents();

    this.logger.log(
      `User ${followerId} successfully unfollowed user ${followeeId}`,
    );
  }
}
