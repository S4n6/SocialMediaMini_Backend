import { Injectable, Inject } from '@nestjs/common';
import { CreateUserUseCase } from './use-cases/create-user.use-case';
import {
  FollowUserUseCase,
  UnfollowUserUseCase,
} from './use-cases/follow-user.use-case';
import { UpdateProfileUseCase } from './use-cases/update-profile.use-case';
import { VerifyEmailUseCase } from './use-cases/verify-email.use-case';
import {
  GetUserProfileUseCase,
  SearchUsersUseCase,
  GetUserFollowersUseCase,
  GetUserFollowingUseCase,
} from './use-cases/get-user.use-case';
import { IUserRepository } from './interfaces/user-repository.interface';
import { USER_REPOSITORY_TOKEN } from '../users.constants';
import { User } from '../domain/user.entity';
import {
  CreateUserDto,
  UpdateProfileDto,
  SearchUsersDto,
  GetFollowersDto,
  UserResponseDto,
  UserProfileResponseDto,
  UserListItemDto,
} from './dto/user.dto';

/**
 * Application Service for User domain
 * Coordinates use cases and provides a clean interface for controllers
 */
@Injectable()
export class UserApplicationService {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly followUserUseCase: FollowUserUseCase,
    private readonly unfollowUserUseCase: UnfollowUserUseCase,
    private readonly updateProfileUseCase: UpdateProfileUseCase,
    private readonly verifyEmailUseCase: VerifyEmailUseCase,
    private readonly getUserProfileUseCase: GetUserProfileUseCase,
    private readonly searchUsersUseCase: SearchUsersUseCase,
    private readonly getUserFollowersUseCase: GetUserFollowersUseCase,
    private readonly getUserFollowingUseCase: GetUserFollowingUseCase,
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
  ) {}

  // User Management
  async createUser(dto: CreateUserDto): Promise<UserResponseDto> {
    return this.createUserUseCase.execute(dto);
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    return this.updateProfileUseCase.execute(userId, dto);
  }

  async verifyEmail(userId: string): Promise<void> {
    return this.verifyEmailUseCase.execute(userId);
  }

  // User Queries
  async getUserProfile(
    userId: string,
    requesterId?: string,
  ): Promise<UserResponseDto | UserProfileResponseDto> {
    return this.getUserProfileUseCase.execute(userId, requesterId);
  }

  async searchUsers(
    dto: SearchUsersDto,
    requesterId?: string,
  ): Promise<{
    users: UserListItemDto[];
    total: number;
    hasMore: boolean;
    page: number;
    limit: number;
  }> {
    return this.searchUsersUseCase.execute(dto, requesterId);
  }

  // Follow Management
  async followUser(followerId: string, followeeId: string): Promise<void> {
    return this.followUserUseCase.execute(followerId, followeeId);
  }

  async unfollowUser(followerId: string, followeeId: string): Promise<void> {
    return this.unfollowUserUseCase.execute(followerId, followeeId);
  }

  async getUserFollowers(
    userId: string,
    dto: GetFollowersDto,
    requesterId?: string,
  ): Promise<{
    followers: UserListItemDto[];
    total: number;
    hasMore: boolean;
  }> {
    return this.getUserFollowersUseCase.execute(userId, dto, requesterId);
  }

  async getUserFollowing(
    userId: string,
    dto: GetFollowersDto,
    requesterId?: string,
  ): Promise<{
    following: UserListItemDto[];
    total: number;
    hasMore: boolean;
  }> {
    return this.getUserFollowingUseCase.execute(userId, dto, requesterId);
  }

  // Auth-specific methods (for Auth module usage)
  /**
   * Find user by email or username (used by Auth module for login)
   */
  async findUserByEmailOrUsername(identifier: string): Promise<User | null> {
    // Try to find by email first
    let user = await this.userRepository.findByEmail(identifier);
    if (!user) {
      // If not found by email, try by username
      user = await this.userRepository.findByUsername(identifier);
    }
    return user;
  }

  /**
   * Find user by ID (used by Auth module)
   */
  async findUserById(userId: string): Promise<User | null> {
    return await this.userRepository.findById(userId);
  }

  /**
   * Find user by email (used by Auth module)
   */
  async findUserByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findByEmail(email);
  }

  /**
   * Check if email exists (used by Auth module)
   */
  async existsByEmail(email: string): Promise<boolean> {
    const user = await this.userRepository.findByEmail(email);
    return user !== null;
  }

  /**
   * Check if username exists (used by Auth module)
   */
  async existsByUsername(username: string): Promise<boolean> {
    const user = await this.userRepository.findByUsername(username);
    return user !== null;
  }

  /**
   * Update user password (used by Auth module for password reset)
   */
  async updateUserPassword(
    userId: string,
    hashedPassword: string,
  ): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    // Update password using domain method
    user.updatePassword(hashedPassword);

    // Save the updated user
    await this.userRepository.save(user);
  }

  /**
   * Update last verification email sent timestamp (used by Auth module)
   */
  async updateLastVerificationSentAt(
    userId: string,
    timestamp: Date,
  ): Promise<void> {
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

  /**
   * Create user from Google OAuth data (used by Auth module)
   */
  async createUserFromGoogle(googleData: {
    googleId: string;
    email: string;
    fullName: string;
    avatar?: string;
  }): Promise<User> {
    // Use UserFactory to create user from Google data
    const { UserFactory } = await import('../domain/factories/user.factory');

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

  /**
   * Save user (used by Auth module)
   */
  async saveUser(user: User): Promise<void> {
    await this.userRepository.save(user);
  }
}
