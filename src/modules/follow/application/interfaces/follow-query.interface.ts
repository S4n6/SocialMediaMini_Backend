// Application layer types and interfaces

export interface UserSummary {
  id: string;
  username: string;
  fullName: string;
  avatar: string | null;
  bio?: string | null;
}

export interface FollowersResult {
  userId: string;
  totalFollowers: number;
  followers: UserSummary[];
}

export interface FollowingResult {
  userId: string;
  totalFollowing: number;
  following: UserSummary[];
}

export interface FollowStatusResult {
  userId: string;
  targetUserId: string;
  isFollowing: boolean;
  followId: string | null;
}

export interface FollowWithUsers {
  followId: string;
  followerId: string;
  followingId: string;
  createdAt: Date;
  follower: UserSummary;
  following: UserSummary;
}
