/**
 * User summary for presentation layer
 */
export interface UserSummaryDto {
  id: string;
  username: string;
  fullName: string;
  avatar: string | null;
  bio?: string | null;
}

/**
 * Basic follow information
 */
export interface FollowDto {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: Date;
}

/**
 * Response DTO for follow operation
 */
export interface FollowUserResponseDto {
  message: string;
  follow: FollowDto;
}

/**
 * Response DTO for unfollow operation
 */
export interface UnfollowUserResponseDto {
  message: string;
}

/**
 * Response DTO for followers list
 */
export interface FollowersResponseDto {
  userId: string;
  totalFollowers: number;
  followers: UserSummaryDto[];
}

/**
 * Response DTO for following list
 */
export interface FollowingResponseDto {
  userId: string;
  totalFollowing: number;
  following: UserSummaryDto[];
}

/**
 * Response DTO for follow status
 */
export interface FollowStatusResponseDto {
  userId: string;
  targetUserId: string;
  isFollowing: boolean;
  followId: string | null;
}

/**
 * Response DTO for follows with user details
 */
export interface FollowWithUsersResponseDto {
  followId: string;
  followerId: string;
  followingId: string;
  createdAt: Date;
  follower: UserSummaryDto;
  following: UserSummaryDto;
}
