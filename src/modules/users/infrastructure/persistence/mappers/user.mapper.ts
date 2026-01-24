import { User } from '../../../domain/entities/user.entity';
import { UserDto, UserListDto } from '../../../application/dto/application.dto';

/**
 * Application Layer Mappers
 * Maps domain entities to application DTOs
 */
export class UserMapper {
  /**
   * Map User entity to UserDto
   */
  static toUserDto(user: User): UserDto {
    const stats = user.getStats();

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
      role: user.role.toString(),
      status: user.status.toString(),
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

  /**
   * Map User entity to UserListDto (simplified)
   */
  static toUserListDto(user: User, isFollowing?: boolean): UserListDto {
    return {
      id: user.id,
      username: user.username,
      fullName: user.profile.fullName,
      avatar: user.profile.avatar,
      bio: user.profile.bio,
      followersCount: user.followersCount,
      isFollowing,
    };
  }

  /**
   * Map array of Users to UserListDto array
   */
  static toUserListDtos(users: User[], followingIds?: string[]): UserListDto[] {
    return users.map((user) => {
      const isFollowing = followingIds?.includes(user.id);
      return this.toUserListDto(user, isFollowing);
    });
  }
}
