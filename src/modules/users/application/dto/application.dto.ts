/**
 * Application Layer DTOs
 * Pure data transfer objects without validation decorators
 * Used by Use Cases and Application Services
 */

/**
 * DTO for creating a new user (Application layer)
 */
export class CreateUserCommand {
  username: string;
  email: string;
  password: string;
  fullName: string;
  bio?: string;
  location?: string;
  websiteUrl?: string;
  dateOfBirth?: Date;
  phoneNumber?: string;
  gender?: string;
  avatar?: string;
}

/**
 * DTO for Google OAuth user creation
 */
export class CreateGoogleUserCommand {
  googleId: string;
  email: string;
  username: string;
  fullName: string;
  avatar?: string;
}

/**
 * DTO for updating user profile
 */
export class UpdateProfileCommand {
  fullName?: string;
  bio?: string;
  avatar?: string;
  location?: string;
  websiteUrl?: string;
  dateOfBirth?: Date;
  phoneNumber?: string;
  gender?: string;
}

/**
 * DTO for user search query
 */
export class SearchUsersQuery {
  query: string;
  page: number;
  limit: number;
  requesterId?: string;
}

/**
 * DTO for getting user followers/following
 */
export class GetFollowersQuery {
  userId: string;
  page: number;
  limit: number;
  requesterId?: string;
}

/**
 * DTO for follow user operation
 */
export class FollowUserCommand {
  followerId: string;
  followeeId: string;
}

/**
 * DTO for unfollow user operation
 */
export class UnfollowUserCommand {
  followerId: string;
  followeeId: string;
}

/**
 * DTO for verify email operation
 */
export class VerifyEmailCommand {
  userId: string;
}

/**
 * Application layer response DTOs (without validation decorators)
 */

/**
 * User response for Application layer
 */
export class UserDto {
  id: string;
  username: string;
  email: string;
  fullName: string;
  bio?: string;
  avatar?: string;
  location?: string;
  websiteUrl?: string;
  phoneNumber?: string;
  gender?: string;
  dateOfBirth?: Date;
  isEmailVerified: boolean;
  emailVerifiedAt?: Date;
  role: string;
  status: string;
  followersCount: number;
  followingCount: number;
  isFollowing?: boolean;
  canCreatePost: boolean;
  canComment: boolean;
  accountAge: number;
  isProfileComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastProfileUpdate?: Date;
}

/**
 * Simplified user DTO for lists (Application layer)
 */
export class UserListDto {
  id: string;
  username: string;
  fullName: string;
  avatar?: string;
  bio?: string;
  followersCount: number;
  isFollowing?: boolean;
}

/**
 * Search results DTO
 */
export class UserSearchResultDto {
  users: UserListDto[];
  total: number;
  hasMore: boolean;
  page: number;
  limit: number;
}

/**
 * Followers/Following results DTO
 */
export class UserFollowListDto {
  users: UserListDto[];
  total: number;
  hasMore: boolean;
}
