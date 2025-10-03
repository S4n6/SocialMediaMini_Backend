export interface UserSummaryDto {
  id: string;
  username: string;
  fullName: string;
  avatar: string | null;
  bio?: string | null;
}

export interface FollowResponseDto {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: Date;
  updatedAt: Date;
  follower?: UserSummaryDto;
  following?: UserSummaryDto;
}

export interface FollowUserResponseDto {
  message: string;
  follow: FollowResponseDto;
}

export interface FollowersResponseDto {
  userId: string;
  totalFollowers: number;
  followers: UserSummaryDto[];
}

export interface FollowingResponseDto {
  userId: string;
  totalFollowing: number;
  following: UserSummaryDto[];
}

export interface FollowStatusResponseDto {
  userId: string;
  targetUserId: string;
  isFollowing: boolean;
  followId: string | null;
}
