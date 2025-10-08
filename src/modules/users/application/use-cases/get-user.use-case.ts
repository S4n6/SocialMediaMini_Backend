import { Injectable, Logger, Inject } from '@nestjs/common';
import { USER_REPOSITORY_TOKEN } from '../../users.constants';
import { User } from '../../domain';
import { IUserRepository } from '../interfaces/user-repository.interface';
import {
  UserResponseDto,
  UserProfileResponseDto,
  UserListItemDto,
  SearchUsersDto,
  GetFollowersDto,
} from '../dto/user.dto';
import { EntityNotFoundException } from '../../../../shared/exceptions/domain.exception';

/**
 * Use case for getting user profile by ID
 */
@Injectable()
export class GetUserProfileUseCase {
  private readonly logger = new Logger(GetUserProfileUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(
    userId: string,
    requesterId?: string,
  ): Promise<UserResponseDto | UserProfileResponseDto> {
    this.logger.log(
      `Getting user profile for: ${userId}, requester: ${requesterId}`,
    );

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new EntityNotFoundException('User', userId);
    }

    // If user is viewing their own profile, return full profile data
    if (requesterId === userId) {
      const stats = user.getStats();
      return new UserProfileResponseDto({
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
        lastProfileUpdate: user.lastProfileUpdate,
        role: user.role,
        status: user.status,
        followersCount: user.followersCount,
        followingCount: user.followingCount,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        canCreatePost: stats.canCreatePost,
        canComment: stats.canComment,
        accountAge: stats.accountAge,
        isProfileComplete: stats.isProfileComplete,
      });
    }

    // For other users, return public profile with follow status
    let isFollowing: boolean | undefined;
    if (requesterId) {
      isFollowing = user.isFollowedBy(requesterId);
    }

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
      isFollowing,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }
}

/**
 * Use case for searching users
 */
@Injectable()
export class SearchUsersUseCase {
  private readonly logger = new Logger(SearchUsersUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(
    dto: SearchUsersDto,
    requesterId?: string,
  ): Promise<{
    users: UserListItemDto[];
    total: number;
    hasMore: boolean;
    page: number;
    limit: number;
  }> {
    this.logger.log(
      `Searching users with query: ${dto.query}, page: ${dto.page}`,
    );

    const { users, total, hasMore } = await this.userRepository.searchUsers(
      dto.query,
      dto.page || 1,
      dto.limit || 20,
    );

    // Convert to DTOs with follow status
    const userDtos = users.map((user) => {
      let isFollowing: boolean | undefined;
      if (requesterId && user.id !== requesterId) {
        isFollowing = user.isFollowedBy(requesterId);
      }

      return new UserListItemDto({
        id: user.id,
        username: user.username,
        fullName: user.profile.fullName,
        avatar: user.profile.avatar,
        bio: user.profile.bio,
        followersCount: user.followersCount,
        isFollowing,
      });
    });

    return {
      users: userDtos,
      total,
      hasMore,
      page: dto.page || 1,
      limit: dto.limit || 20,
    };
  }
}

/**
 * Use case for getting user followers
 */
@Injectable()
export class GetUserFollowersUseCase {
  private readonly logger = new Logger(GetUserFollowersUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(
    userId: string,
    dto: GetFollowersDto,
    requesterId?: string,
  ): Promise<{
    followers: UserListItemDto[];
    total: number;
    hasMore: boolean;
  }> {
    this.logger.log(`Getting followers for user: ${userId}`);

    // Check if user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new EntityNotFoundException('User', userId);
    }

    const { followers, total, hasMore } =
      await this.userRepository.getFollowers(
        userId,
        dto.page || 1,
        dto.limit || 20,
      );

    // Convert to DTOs
    const followerDtos = followers.map((follower) => {
      let isFollowing: boolean | undefined;
      if (requesterId && follower.id !== requesterId) {
        isFollowing = follower.isFollowedBy(requesterId);
      }

      return new UserListItemDto({
        id: follower.id,
        username: follower.username,
        fullName: follower.profile.fullName,
        avatar: follower.profile.avatar,
        bio: follower.profile.bio,
        followersCount: follower.followersCount,
        isFollowing,
      });
    });

    return {
      followers: followerDtos,
      total,
      hasMore,
    };
  }
}

/**
 * Use case for getting users that current user is following
 */
@Injectable()
export class GetUserFollowingUseCase {
  private readonly logger = new Logger(GetUserFollowingUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(
    userId: string,
    dto: GetFollowersDto,
    requesterId?: string,
  ): Promise<{
    following: UserListItemDto[];
    total: number;
    hasMore: boolean;
  }> {
    this.logger.log(`Getting following for user: ${userId}`);

    // Check if user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new EntityNotFoundException('User', userId);
    }

    const { following, total, hasMore } =
      await this.userRepository.getFollowing(
        userId,
        dto.page || 1,
        dto.limit || 20,
      );

    // Convert to DTOs
    const followingDtos = following.map((followedUser) => {
      let isFollowing: boolean | undefined;
      if (requesterId && followedUser.id !== requesterId) {
        isFollowing = followedUser.isFollowedBy(requesterId);
      }

      return new UserListItemDto({
        id: followedUser.id,
        username: followedUser.username,
        fullName: followedUser.profile.fullName,
        avatar: followedUser.profile.avatar,
        bio: followedUser.profile.bio,
        followersCount: followedUser.followersCount,
        isFollowing,
      });
    });

    return {
      following: followingDtos,
      total,
      hasMore,
    };
  }
}
