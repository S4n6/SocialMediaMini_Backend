import { Injectable, Logger, Inject } from '@nestjs/common';
import { USER_REPOSITORY_TOKEN, EVENT_BUS_TOKEN } from '../../users.constants';
import { User, UserProfile } from '../../domain';
import { IUserRepository } from '../../domain/repositories';
import { IEventBus } from '../../../../infrastructure/events';
import { DomainEventAdapter } from '../adapters/event.adapter';
import { UpdateProfileDto, UserResponseDto } from '../dto/user.dto';
import { EntityNotFoundException } from '../../../../shared/exceptions/domain.exception';

/**
 * Use case for updating user profile
 */
@Injectable()
export class UpdateProfileUseCase {
  private readonly logger = new Logger(UpdateProfileUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
    @Inject(EVENT_BUS_TOKEN)
    private readonly eventBus: IEventBus,
  ) {}

  async execute(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    this.logger.log(`Updating profile for user: ${userId}`);

    // Load user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new EntityNotFoundException('User', userId);
    }

    // Create updated profile
    const currentProfile = user.profile;
    const updatedProfile = new UserProfile({
      fullName: dto.fullName ?? currentProfile.fullName,
      bio: dto.bio ?? currentProfile.bio,
      avatar: dto.avatar ?? currentProfile.avatar,
      location: dto.location ?? currentProfile.location,
      websiteUrl: dto.websiteUrl ?? currentProfile.websiteUrl,
      dateOfBirth: dto.dateOfBirth
        ? new Date(dto.dateOfBirth)
        : currentProfile.dateOfBirth,
      phoneNumber: dto.phoneNumber ?? currentProfile.phoneNumber,
      gender: dto.gender ?? currentProfile.gender,
    });

    // Execute domain logic
    user.updateProfile(updatedProfile);

    // Save changes
    // Save the updated user
    await this.userRepository.save(user);

    // Publish domain events
    const adaptedEvents = DomainEventAdapter.adaptAll(user.getDomainEvents());
    await this.eventBus.publishAll(adaptedEvents);
    user.clearDomainEvents();

    this.logger.log(`Profile updated successfully for user: ${userId}`);

    // Return response DTO
    return new UserResponseDto({
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.profile.fullName,
      bio: user.profile.bio,
      avatar: user.profile.avatar,
      location: user.profile.location,
      websiteUrl: user.profile.websiteUrl,
      isEmailVerified: user.isEmailVerified,
      followersCount: user.followersCount,
      followingCount: user.followingCount,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }
}
