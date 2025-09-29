import { Injectable } from '@nestjs/common';
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
}
