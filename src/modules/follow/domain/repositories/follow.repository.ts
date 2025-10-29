import { FollowEntity } from '../entities/follow.entity';

export interface FindFollowsOptions {
  followerId?: string;
  followingId?: string;
  limit?: number;
  offset?: number;
}

/**
 * Pure Domain Repository Interface
 * Contains only essential CRUD operations
 * Complex queries should be handled in Application Layer
 */
export abstract class FollowRepository {
  // Core CRUD Operations
  abstract save(follow: FollowEntity): Promise<FollowEntity>;
  abstract findById(id: string): Promise<FollowEntity | null>;
  abstract findByFollowerAndFollowing(
    followerId: string,
    followingId: string,
  ): Promise<FollowEntity | null>;

  // Basic Queries
  abstract findAll(options?: FindFollowsOptions): Promise<FollowEntity[]>;
  abstract delete(id: string): Promise<void>;

  // Simple Aggregations
  abstract countFollowers(userId: string): Promise<number>;
  abstract countFollowing(userId: string): Promise<number>;

  // Batch Operations
  abstract existsByFollowerAndFollowing(
    followerId: string,
    followingId: string,
  ): Promise<boolean>;
}
