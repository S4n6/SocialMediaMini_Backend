import { Injectable, Logger, Inject } from '@nestjs/common';
import {
  User,
  UserFactory,
  IUserRepository,
  UserEmail,
  Username,
} from '../../domain';
import { IEventBus } from '../../../../infrastructure/events';
import { CreateUserCommand, UserDto } from '../dto/application.dto';
import { DomainEventAdapter } from '../../infrastructure/adapters/event.adapter';
import { USER_REPOSITORY_TOKEN, EVENT_BUS_TOKEN } from '../../users.constants';

/**
 * Use case for creating a new user account
 * Follows Clean Architecture principles
 */
@Injectable()
export class CreateUserUseCase {
  private readonly logger = new Logger(CreateUserUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
    @Inject(EVENT_BUS_TOKEN)
    private readonly eventBus: IEventBus,
  ) {}

  async execute(command: CreateUserCommand): Promise<UserDto> {
    this.logger.log(
      `Creating user with username: ${command.username}, email: ${command.email}`,
    );

    // Create value objects for validation
    const email = UserEmail.create(command.email);
    const username = Username.create(command.username);

    // Validate business rules - check uniqueness
    const existingUserByEmail = await this.userRepository.findByEmail(
      command.email,
    );
    if (existingUserByEmail) {
      throw new Error(`User with email ${command.email} already exists`);
    }

    const existingUserByUsername = await this.userRepository.findByUsername(
      command.username,
    );
    if (existingUserByUsername) {
      throw new Error(`User with username ${command.username} already exists`);
    }

    // Create user using factory
    const user = await UserFactory.createUser({
      username: command.username,
      email: command.email,
      password: command.password,
      profile: {
        fullName: command.fullName,
        bio: command.bio,
        avatar: command.avatar,
        location: command.location,
        websiteUrl: command.websiteUrl,
        dateOfBirth: command.dateOfBirth,
        phoneNumber: command.phoneNumber,
        gender: command.gender,
      },
    });

    // Save user
    await this.userRepository.save(user);

    // Publish domain events
    for (const event of user.getDomainEvents()) {
      const adaptedEvent = DomainEventAdapter.adapt(event);
      await this.eventBus.publish(adaptedEvent);
    }
    user.clearDomainEvents();

    this.logger.log(`User created successfully with ID: ${user.id}`);

    // Return response DTO
    return this.mapToDto(user);
  }

  private mapToDto(user: User): UserDto {
    // Get stats - handle case where user isn't verified yet
    let stats;
    try {
      stats = user.getStats();
    } catch (error) {
      // If getStats() throws (e.g., unverified user), provide safe defaults
      stats = {
        followersCount: user.followersCount,
        followingCount: user.followingCount,
        isProfileComplete: user.profile.isComplete(),
        isEmailVerified: user.isEmailVerified,
        isVerified: false,
        isPopular: false,
        isFresh: true,
        accountAge: 0,
        canCreatePost: false,
        canComment: false,
        canModerate: false,
        hasReachedFollowingLimit: false,
      };
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.profile.fullName,
      bio: user.profile.bio,
      avatar: user.profile.avatar,
      location: user.profile.location,
      websiteUrl: user.profile.websiteUrl,
      phoneNumber: user.profile.phoneNumber,
      gender: user.profile.gender,
      dateOfBirth: user.profile.dateOfBirth,
      isEmailVerified: user.isEmailVerified,
      emailVerifiedAt: user.emailVerifiedAt,
      role: user.role,
      status: user.status,
      followersCount: stats.followersCount,
      followingCount: stats.followingCount,
      canCreatePost: stats.canCreatePost,
      canComment: stats.canComment,
      accountAge: stats.accountAge,
      isProfileComplete: stats.isProfileComplete,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastProfileUpdate: user.lastProfileUpdate,
    };
  }
}
