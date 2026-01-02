import { Injectable, Inject } from '@nestjs/common';
import { IUserRepository } from '../../domain/repositories';
import { USER_REPOSITORY_TOKEN } from '../../users.constants';
import { User } from '../../domain';
import { UserFactory } from '../../domain/factories/user.factory';

/**
 * Update User Password Use Case
 * Used by Auth module for password reset functionality
 */
@Injectable()
export class UpdateUserPasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(userId: string, hashedPassword: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    // Update password using domain method
    user.updatePassword(hashedPassword);

    // Save the updated user
    await this.userRepository.save(user);
  }
}

/**
 * Create User From Google Use Case
 * Used by Auth module for Google OAuth registration
 */
@Injectable()
export class CreateUserFromGoogleUseCase {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(googleData: {
    googleId: string;
    email: string;
    fullName: string;
    avatar?: string;
  }): Promise<User> {
    // Use UserFactory to create user from Google data
    const user = UserFactory.createUserFromGoogle({
      googleId: googleData.googleId,
      email: googleData.email,
      profile: {
        fullName: googleData.fullName,
        avatar: googleData.avatar,
      },
    });

    // Save the user
    await this.userRepository.save(user);

    return user;
  }
}

/**
 * Update Verification Timestamp Use Case
 * Used by Auth module to track when verification emails are sent
 */
@Injectable()
export class UpdateVerificationTimestampUseCase {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(userId: string, timestamp: Date): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    // For now, we'll update the lastProfileUpdate field as a workaround
    // In the future, we should add a specific lastVerificationSentAt field to User entity
    user.updateLastProfileUpdateTimestamp(timestamp);

    // Save the updated user
    await this.userRepository.save(user);
  }
}

/**
 * Save User Use Case
 * Generic use case for saving user entities (used by Auth module)
 */
@Injectable()
export class SaveUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(user: User): Promise<void> {
    await this.userRepository.save(user);
  }
}
