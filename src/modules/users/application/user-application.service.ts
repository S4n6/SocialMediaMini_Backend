import { Injectable } from '@nestjs/common';
import { CreateUserUseCase } from './use-cases/create-user.use-case';
import { UpdateProfileUseCase } from './use-cases/update-profile.use-case';
import { VerifyEmailUseCase } from './use-cases/verify-email.use-case';
import {
  GetUserProfileUseCase,
  SearchUsersUseCase,
} from './use-cases/get-user.use-case';

// Auth integration use cases
import {
  FindUserByCredentialsUseCase,
  FindUserByIdUseCase,
  FindUserByEmailUseCase,
  CheckUserExistenceUseCase,
} from './use-cases/auth-integration.use-case';
import {
  UpdateUserPasswordUseCase,
  CreateUserFromGoogleUseCase,
  UpdateVerificationTimestampUseCase,
  SaveUserUseCase,
} from './use-cases/user-management.use-case';

// Application DTOs
import {
  CreateUserCommand,
  UpdateProfileCommand,
  SearchUsersQuery,
  VerifyEmailCommand,
  UserDto,
  UserSearchResultDto,
} from './dto/application.dto';

/**
 * Application Service for User domain
 * Coordinates use cases and provides a clean interface for controllers
 *
 * Note: This service includes auth integration methods that are used by the Auth module
 * Business logic specific to users (like follow relationships) is preserved here
 */
@Injectable()
export class UserApplicationService {
  constructor(
    // User management use cases
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly updateProfileUseCase: UpdateProfileUseCase,
    private readonly verifyEmailUseCase: VerifyEmailUseCase,

    // User retrieval use cases
    private readonly getUserProfileUseCase: GetUserProfileUseCase,
    private readonly searchUsersUseCase: SearchUsersUseCase,

    // Auth integration use cases
    private readonly findUserByCredentialsUseCase: FindUserByCredentialsUseCase,
    private readonly findUserByIdUseCase: FindUserByIdUseCase,
    private readonly findUserByEmailUseCase: FindUserByEmailUseCase,
    private readonly checkUserExistenceUseCase: CheckUserExistenceUseCase,
    private readonly updateUserPasswordUseCase: UpdateUserPasswordUseCase,
    private readonly createUserFromGoogleUseCase: CreateUserFromGoogleUseCase,
    private readonly updateVerificationTimestampUseCase: UpdateVerificationTimestampUseCase,
    private readonly saveUserUseCase: SaveUserUseCase,
  ) {}

  // ===== USER MANAGEMENT =====

  async createUser(command: CreateUserCommand): Promise<UserDto> {
    return this.createUserUseCase.execute(command);
  }

  async updateProfile(
    userId: string,
    command: UpdateProfileCommand,
  ): Promise<UserDto> {
    // Execute use case
    const result = await this.updateProfileUseCase.execute(
      userId,
      command as any,
    );

    // Convert UserResponseDto to UserDto (add missing fields with defaults)
    return {
      ...result,
      role: 'user', // Default role
      status: 'active', // Default status
      canCreatePost: true, // Default permission
      canComment: true, // Default permission
      accountAge: Math.floor(
        (Date.now() - new Date(result.createdAt).getTime()) /
          (1000 * 60 * 60 * 24),
      ), // Calculate age in days
      isProfileComplete: !!(result.fullName && result.bio), // Basic completeness check
    };
  }

  async verifyEmail(command: VerifyEmailCommand): Promise<void>;
  async verifyEmail(userId: string): Promise<void>;
  async verifyEmail(
    commandOrUserId: VerifyEmailCommand | string,
  ): Promise<void> {
    const userId =
      typeof commandOrUserId === 'string'
        ? commandOrUserId
        : commandOrUserId.userId;
    return this.verifyEmailUseCase.execute(userId);
  }

  // ===== USER RETRIEVAL =====

  async getUserProfile(userId: string, requesterId?: string): Promise<UserDto> {
    const result = await this.getUserProfileUseCase.execute(
      userId,
      requesterId,
    );
    // Convert to UserDto format
    return result as any;
  }

  async searchUsers(query: SearchUsersQuery): Promise<UserSearchResultDto> {
    const result = await this.searchUsersUseCase.execute(
      {
        query: query.query,
        page: query.page,
        limit: query.limit,
      } as any,
      query.requesterId,
    );

    return {
      users: result.users.map((user) => ({
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        avatar: user.avatar,
        bio: user.bio,
        followersCount: user.followersCount,
        isFollowing: user.isFollowing,
      })),
      total: result.total,
      hasMore: result.hasMore,
      page: result.page,
      limit: result.limit,
    };
  }

  // ===== AUTH INTEGRATION METHODS =====

  async findUserByCredentials(identifier: string): Promise<UserDto | null> {
    const result = await this.findUserByCredentialsUseCase.execute(identifier);
    return result ? (result as any) : null;
  }

  async findUserById(userId: string): Promise<UserDto | null> {
    const result = await this.findUserByIdUseCase.execute(userId);
    return result ? (result as any) : null;
  }

  async findUserByEmail(email: string): Promise<UserDto | null> {
    const result = await this.findUserByEmailUseCase.execute(email);
    return result ? (result as any) : null;
  }

  async checkUserExistence(
    email: string,
    username: string,
  ): Promise<{ emailExists: boolean; usernameExists: boolean }> {
    const emailExists =
      await this.checkUserExistenceUseCase.existsByEmail(email);
    const usernameExists =
      await this.checkUserExistenceUseCase.existsByUsername(username);
    return { emailExists, usernameExists };
  }

  async updateUserPassword(
    userId: string,
    hashedPassword: string,
  ): Promise<void> {
    return this.updateUserPasswordUseCase.execute(userId, hashedPassword);
  }

  async createUserFromGoogle(googleData: {
    googleId: string;
    email: string;
    fullName: string;
    avatar?: string;
  }): Promise<UserDto> {
    const result = await this.createUserFromGoogleUseCase.execute(googleData);
    return result as any;
  }

  async updateVerificationTimestamp(
    userId: string,
    timestamp: Date,
  ): Promise<void> {
    return this.updateVerificationTimestampUseCase.execute(userId, timestamp);
  }

  async saveUser(user: any): Promise<void> {
    // Note: This method expects a User entity, not plain data
    // Should be used carefully by Auth module
    return this.saveUserUseCase.execute(user);
  }

  // ===== AUTH MODULE INTEGRATION METHODS =====
  // These methods return domain entities for Auth module compatibility

  async findUserEntityByEmailOrUsername(
    identifier: string,
  ): Promise<any | null> {
    return await this.findUserByCredentialsUseCase.execute(identifier);
  }

  async findUserEntityById(userId: string): Promise<any | null> {
    return await this.findUserByIdUseCase.execute(userId);
  }

  async findUserEntityByEmail(email: string): Promise<any | null> {
    return await this.findUserByEmailUseCase.execute(email);
  }

  async createUserEntityFromGoogle(googleData: {
    googleId: string;
    email: string;
    fullName: string;
    avatar?: string;
  }): Promise<any> {
    return await this.createUserFromGoogleUseCase.execute(googleData);
  }

  // ===== LEGACY AUTH COMPATIBILITY METHODS =====
  // These methods are kept for backward compatibility with Auth module

  async findUserByEmailOrUsername(identifier: string): Promise<UserDto | null> {
    return this.findUserByCredentials(identifier);
  }

  async existsByEmail(email: string): Promise<boolean> {
    const result = await this.checkUserExistence(email, '');
    return result.emailExists;
  }

  async existsByUsername(username: string): Promise<boolean> {
    const result = await this.checkUserExistence('', username);
    return result.usernameExists;
  }

  async updateLastVerificationSentAt(
    userId: string,
    timestamp: Date,
  ): Promise<void> {
    return this.updateVerificationTimestamp(userId, timestamp);
  }
}
