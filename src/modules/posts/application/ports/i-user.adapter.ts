/**
 * Port interface for user-related operations needed by Posts domain
 * Defines what the Posts application layer needs from the User domain
 */
export interface IUserAdapter {
  /**
   * Get basic user information by ID
   */
  getUserById(userId: string): Promise<{
    id: string;
    fullName: string;
    username: string;
    avatar?: string;
  } | null>;

  /**
   * Get multiple users by IDs (for batch operations)
   */
  getUsersByIds(userIds: string[]): Promise<
    Array<{
      id: string;
      fullName: string;
      username: string;
      avatar?: string;
    }>
  >;

  /**
   * Check if user exists
   */
  userExists(userId: string): Promise<boolean>;

  /**
   * Check if user A follows user B
   */
  isFollowing(followerId: string, followingId: string): Promise<boolean>;

  /**
   * Get user's follower IDs (for timeline generation)
   */
  getFollowerIds(userId: string): Promise<string[]>;

  /**
   * Get user's following IDs (for timeline generation)
   */
  getFollowingIds(userId: string): Promise<string[]>;
}
