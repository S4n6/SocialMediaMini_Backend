import { IQueryRepository } from '../../../../shared/application/repository.interface';
import { User } from '../../domain/user.entity';

/**
 * Repository interface for User aggregate
 * Extends base repository with user-specific queries
 */
export interface IUserRepository extends IQueryRepository<User, string> {
  /**
   * Find user by email
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Find user by username
   */
  findByUsername(username: string): Promise<User | null>;

  /**
   * Find user by Google ID
   */
  findByGoogleId(googleId: string): Promise<User | null>;

  /**
   * Search users by query (username, full name)
   */
  searchUsers(
    query: string,
    page: number,
    limit: number,
  ): Promise<{
    users: User[];
    total: number;
    hasMore: boolean;
  }>;

  /**
   * Get user followers with pagination
   */
  getFollowers(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{
    followers: User[];
    total: number;
    hasMore: boolean;
  }>;

  /**
   * Get user following with pagination
   */
  getFollowing(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{
    following: User[];
    total: number;
    hasMore: boolean;
  }>;

  /**
   * Create follow relationship
   */
  createFollowRelation(followerId: string, followeeId: string): Promise<void>;

  /**
   * Remove follow relationship
   */
  removeFollowRelation(followerId: string, followeeId: string): Promise<void>;

  /**
   * Check if user follows another user
   */
  isFollowing(followerId: string, followeeId: string): Promise<boolean>;

  /**
   * Get users by IDs (for batch operations)
   */
  findByIds(userIds: string[]): Promise<User[]>;

  /**
   * Get user statistics (followers, following counts)
   */
  getUserStats(userId: string): Promise<{
    followersCount: number;
    followingCount: number;
    postsCount: number;
  }>;

  /**
   * Update user last active timestamp
   */
  updateLastActive(userId: string): Promise<void>;

  /**
   * Find users who might be interesting to follow (recommendations)
   */
  findRecommendedUsers(userId: string, limit: number): Promise<User[]>;

  /**
   * Check if email exists
   */
  emailExists(email: string): Promise<boolean>;

  /**
   * Check if username exists
   */
  usernameExists(username: string): Promise<boolean>;
}

/**
 * Cache repository interface for User data
 */
export interface IUserCacheRepository {
  /**
   * Get user from cache
   */
  getUser(userId: string): Promise<User | null>;

  /**
   * Cache user data
   */
  setUser(user: User, ttl?: number): Promise<void>;

  /**
   * Remove user from cache
   */
  removeUser(userId: string): Promise<void>;

  /**
   * Get user's following list from cache
   */
  getUserFollowing(userId: string): Promise<string[] | null>;

  /**
   * Cache user's following list
   */
  setUserFollowing(
    userId: string,
    followingIds: string[],
    ttl?: number,
  ): Promise<void>;

  /**
   * Get user's followers list from cache
   */
  getUserFollowers(userId: string): Promise<string[] | null>;

  /**
   * Cache user's followers list
   */
  setUserFollowers(
    userId: string,
    followerIds: string[],
    ttl?: number,
  ): Promise<void>;

  /**
   * Invalidate user-related caches
   */
  invalidateUserCaches(userId: string): Promise<void>;

  /**
   * Invalidate follow-related caches
   */
  invalidateFollowCaches(userId1: string, userId2: string): Promise<void>;
}
