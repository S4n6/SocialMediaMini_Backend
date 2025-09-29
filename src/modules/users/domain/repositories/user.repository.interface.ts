import { User } from '../user.entity';
import { UserId, UserEmail, Username } from '../value-objects';

/**
 * User Repository Interface
 * Defines the contract for user data access operations
 * This interface belongs to the domain layer and should be implemented in the infrastructure layer
 */
export interface IUserRepository {
  /**
   * Save a user (create or update)
   */
  save(user: User): Promise<void>;

  /**
   * Find user by ID
   */
  findById(id: UserId): Promise<User | null>;

  /**
   * Find user by email
   */
  findByEmail(email: UserEmail): Promise<User | null>;

  /**
   * Find user by username
   */
  findByUsername(username: Username): Promise<User | null>;

  /**
   * Find user by Google ID
   */
  findByGoogleId(googleId: string): Promise<User | null>;

  /**
   * Check if email exists
   */
  existsByEmail(email: UserEmail): Promise<boolean>;

  /**
   * Check if username exists
   */
  existsByUsername(username: Username): Promise<boolean>;

  /**
   * Delete user by ID
   */
  deleteById(id: UserId): Promise<void>;

  /**
   * Find users by IDs
   */
  findByIds(ids: UserId[]): Promise<User[]>;

  /**
   * Search users by username or display name
   */
  searchUsers(
    query: string,
    limit?: number,
    offset?: number,
  ): Promise<{
    users: User[];
    total: number;
  }>;

  /**
   * Get user followers
   */
  getFollowers(
    userId: UserId,
    limit?: number,
    offset?: number,
  ): Promise<{
    users: User[];
    total: number;
  }>;

  /**
   * Get users that this user is following
   */
  getFollowing(
    userId: UserId,
    limit?: number,
    offset?: number,
  ): Promise<{
    users: User[];
    total: number;
  }>;

  /**
   * Get mutual followers between two users
   */
  getMutualFollowers(userId1: UserId, userId2: UserId): Promise<User[]>;

  /**
   * Get user statistics (followers count, following count, posts count, etc.)
   */
  getUserStats(userId: UserId): Promise<{
    followersCount: number;
    followingCount: number;
    postsCount: number;
  }>;

  /**
   * Batch update user follow relationships
   */
  updateFollowRelationship(
    followerId: UserId,
    followeeId: UserId,
    isFollowing: boolean,
  ): Promise<void>;
}
