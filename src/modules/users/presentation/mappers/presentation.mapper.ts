import {
  CreateUserRequestDto,
  UpdateProfileRequestDto,
  SearchUsersRequestDto,
  UserResponseDto,
  UserProfileResponseDto,
  UserListResponseDto,
  ApiSuccessResponseDto,
} from '../dto';
import {
  CreateUserCommand,
  UpdateProfileCommand,
  SearchUsersQuery,
  VerifyEmailCommand,
  UserDto,
  UserSearchResultDto,
} from '../../application/dto/application.dto';

/**
 * Presentation Layer Mappers
 * Handles conversion between Presentation DTOs and Application DTOs
 */
export class PresentationMapper {
  // === REQUEST MAPPERS (Presentation → Application) ===

  /**
   * Convert CreateUserRequestDto to CreateUserCommand
   */
  static toCreateUserCommand(
    requestDto: CreateUserRequestDto,
  ): CreateUserCommand {
    return {
      username: requestDto.username,
      email: requestDto.email,
      password: requestDto.password,
      fullName: requestDto.fullName,
      bio: requestDto.bio,
      location: requestDto.location,
      websiteUrl: requestDto.websiteUrl,
      dateOfBirth: requestDto.dateOfBirth
        ? new Date(requestDto.dateOfBirth)
        : undefined,
      phoneNumber: requestDto.phoneNumber,
      gender: requestDto.gender,
      avatar: requestDto.avatar,
    };
  }

  /**
   * Convert UpdateProfileRequestDto to UpdateProfileCommand
   */
  static toUpdateProfileCommand(
    requestDto: UpdateProfileRequestDto,
  ): UpdateProfileCommand {
    return {
      fullName: requestDto.fullName,
      bio: requestDto.bio,
      avatar: requestDto.avatar,
      location: requestDto.location,
      websiteUrl: requestDto.websiteUrl,
      dateOfBirth: requestDto.dateOfBirth
        ? new Date(requestDto.dateOfBirth)
        : undefined,
      phoneNumber: requestDto.phoneNumber,
      gender: requestDto.gender,
    };
  }

  /**
   * Convert SearchUsersRequestDto to SearchUsersQuery
   */
  static toSearchUsersQuery(
    requestDto: SearchUsersRequestDto,
    requesterId?: string,
  ): SearchUsersQuery {
    return {
      query: requestDto.query,
      page: requestDto.page || 1,
      limit: requestDto.limit || 20,
      requesterId,
    };
  }

  // === RESPONSE MAPPERS (Application → Presentation) ===

  /**
   * Convert UserDto to UserResponseDto (public view)
   */
  static toUserResponseDto(userDto: UserDto): UserResponseDto {
    return new UserResponseDto({
      id: userDto.id,
      username: userDto.username,
      email: userDto.email,
      fullName: userDto.fullName,
      bio: userDto.bio,
      avatar: userDto.avatar,
      location: userDto.location,
      websiteUrl: userDto.websiteUrl,
      isEmailVerified: userDto.isEmailVerified,
      followersCount: userDto.followersCount,
      followingCount: userDto.followingCount,
      isFollowing: userDto.isFollowing,
      createdAt: userDto.createdAt,
      updatedAt: userDto.updatedAt,
    });
  }

  /**
   * Convert UserDto to UserProfileResponseDto (owner view)
   */
  static toUserProfileResponseDto(userDto: UserDto): UserProfileResponseDto {
    return new UserProfileResponseDto({
      id: userDto.id,
      username: userDto.username,
      email: userDto.email,
      fullName: userDto.fullName,
      bio: userDto.bio,
      avatar: userDto.avatar,
      location: userDto.location,
      websiteUrl: userDto.websiteUrl,
      phoneNumber: userDto.phoneNumber,
      gender: userDto.gender,
      dateOfBirth: userDto.dateOfBirth,
      isEmailVerified: userDto.isEmailVerified,
      emailVerifiedAt: userDto.emailVerifiedAt,
      lastProfileUpdate: userDto.lastProfileUpdate,
      role: userDto.role,
      status: userDto.status,
      followersCount: userDto.followersCount,
      followingCount: userDto.followingCount,
      canCreatePost: userDto.canCreatePost,
      canComment: userDto.canComment,
      accountAge: userDto.accountAge,
      isProfileComplete: userDto.isProfileComplete,
      createdAt: userDto.createdAt,
      updatedAt: userDto.updatedAt,
    });
  }

  /**
   * Convert UserSearchResultDto to UserListResponseDto
   */
  static toUserListResponseDto(
    searchResult: UserSearchResultDto,
  ): UserListResponseDto {
    return {
      users: searchResult.users.map((user) => ({
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        avatar: user.avatar,
        bio: user.bio,
        followersCount: user.followersCount,
        isFollowing: user.isFollowing,
      })),
      total: searchResult.total,
      hasMore: searchResult.hasMore,
      page: searchResult.page,
      limit: searchResult.limit,
    };
  }

  /**
   * Create VerifyEmailCommand
   */
  static toVerifyEmailCommand(userId: string): VerifyEmailCommand {
    return {
      userId,
    };
  }

  /**
   * Wrap response in ApiSuccessResponseDto
   */
  static toApiSuccessResponse<T>(
    data: T,
    message: string,
  ): ApiSuccessResponseDto<T> {
    return new ApiSuccessResponseDto(data, message);
  }
}
