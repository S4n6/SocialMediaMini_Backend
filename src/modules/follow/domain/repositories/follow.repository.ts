import { FollowEntity } from '../follow.entity';

export interface UserSummary {
  id: string;
  username: string;
  fullName: string;
  avatar: string | null;
  bio?: string | null;
}

export interface FollowWithUsers {
  follow: FollowEntity;
  follower: UserSummary;
  following: UserSummary;
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

export interface FindFollowsOptions {
  followerId?: string;
  followingId?: string;
  limit?: number;
  offset?: number;
}

export abstract class FollowRepository {
  abstract save(follow: FollowEntity): Promise<FollowEntity>;
  abstract findById(id: string): Promise<FollowEntity | null>;
  abstract findByFollowerAndFollowing(
    followerId: string,
    followingId: string,
  ): Promise<FollowEntity | null>;
  abstract findAll(options?: FindFollowsOptions): Promise<FollowEntity[]>;
  abstract findAllWithUsers(
    options?: FindFollowsOptions,
  ): Promise<FollowWithUsers[]>;
  abstract delete(id: string): Promise<void>;
  abstract getFollowers(userId: string): Promise<FollowersResult>;
  abstract getFollowing(userId: string): Promise<FollowingResult>;
  abstract getFollowStatus(
    userId: string,
    targetUserId: string,
  ): Promise<FollowStatusResult>;
  abstract countFollowers(userId: string): Promise<number>;
  abstract countFollowing(userId: string): Promise<number>;
}
