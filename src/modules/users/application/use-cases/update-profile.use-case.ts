import { Injectable, Logger } from '@nestjs/common';
import { User, UserProfile } from '../../domain';
import { IUserRepository } from '../interfaces/user-repository.interface';
import { IEventBus } from '../../../../shared/events/event-bus.interface';
import { UpdateProfileDto, UserResponseDto } from '../dto/user.dto';
import { EntityNotFoundException } from '../../../../shared/exceptions/domain.exception';

/**
 * Use case for updating user profile
 */
@Injectable()
export class UpdateProfileUseCase {
  private readonly logger = new Logger(UpdateProfileUseCase.name);

  constructor(
    private readonly userRepository: IUserRepository,
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
    const updatedUser = await this.userRepository.save(user);

    // Publish domain events
    await this.eventBus.publishAll(updatedUser.domainEvents);
    updatedUser.clearEvents();

    this.logger.log(`Profile updated successfully for user: ${userId}`);

    // Return response DTO
    return new UserResponseDto({
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      fullName: updatedUser.profile.fullName,
      bio: updatedUser.profile.bio,
      avatar: updatedUser.profile.avatar,
      location: updatedUser.profile.location,
      websiteUrl: updatedUser.profile.websiteUrl,
      isEmailVerified: updatedUser.isEmailVerified,
      followersCount: updatedUser.followersCount,
      followingCount: updatedUser.followingCount,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    });
  }
}
