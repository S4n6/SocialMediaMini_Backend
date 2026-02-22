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
  UpdatePasswordResetTimestampUseCase,
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

// Domain types (for auth module integration)
import { User } from '../domain';

/**
 * Application Service for User domain
 * Coordinates use cases and provides a clean interface for controllers
 *
 * Note: This service includes auth integration methods that are used by the Auth module.
 * Methods returning domain entities are typed explicitly (not `any`).
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
    private readonly updatePasswordResetTimestampUseCase: UpdatePasswordResetTimestampUseCase,
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
    // Convert application command to use-case DTO format
    const useCaseDto = {
      fullName: command.fullName,
      bio: command.bio,
      avatar: command.avatar,
      location: command.location,
      websiteUrl: command.websiteUrl,
      dateOfBirth: command.dateOfBirth
        ? command.dateOfBirth.toISOString()
        : undefined,
      phoneNumber: command.phoneNumber,
      gender: command.gender,
    };

    // Execute use case - get updated user response
    const result = await this.updateProfileUseCase.execute(userId, useCaseDto);

    // Re-fetch the full user entity to get accurate domain-computed fields
    const user = await this.findUserByIdUseCase.execute(userId);
    if (user) {
      const stats = user.getStats();
      return {
        ...result,
        role: user.role,
        status: user.status,
        canCreatePost: stats.canCreatePost,
        canComment: stats.canComment,
        accountAge: stats.accountAge,
        isProfileComplete: stats.isProfileComplete,
      };
    }

    // Fallback if user somehow can't be re-fetched after update
    return {
      ...result,
      role: 'USER',
      status: 'ACTIVE',
      canCreatePost: false,
      canComment: false,
      accountAge: 0,
      isProfileComplete: false,
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
    // GetUserProfileUseCase returns UserResponseDto | UserProfileResponseDto
    // which are structurally compatible with UserDto
    return result as unknown as UserDto;
  }

  async searchUsers(query: SearchUsersQuery): Promise<UserSearchResultDto> {
    const result = await this.searchUsersUseCase.execute(
      { query: query.query, page: query.page, limit: query.limit },
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

  async updateVerificationTimestamp(
    userId: string,
    timestamp: Date,
  ): Promise<void> {
    return this.updateVerificationTimestampUseCase.execute(userId, timestamp);
  }

  async updatePasswordResetTimestamp(
    userId: string,
    timestamp: Date,
  ): Promise<void> {
    return this.updatePasswordResetTimestampUseCase.execute(userId, timestamp);
  }

  // ===== AUTH MODULE INTEGRATION METHODS =====
  // These methods return domain User entities for Auth module compatibility

  async findUserEntityByEmailOrUsername(
    identifier: string,
  ): Promise<User | null> {
    return await this.findUserByCredentialsUseCase.execute(identifier);
  }

  async findUserEntityById(userId: string): Promise<User | null> {
    return await this.findUserByIdUseCase.execute(userId);
  }

  async findUserEntityByEmail(email: string): Promise<User | null> {
    return await this.findUserByEmailUseCase.execute(email);
  }

  async saveUser(user: User): Promise<void> {
    return this.saveUserUseCase.execute(user);
  }

}
