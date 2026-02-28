/**
 * Application port for the pre-computed feed cache (Redis List).
 *
 * A Golang worker implements Fan-out on Write by pushing postIds
 * into a per-user Redis List (key: `user:{userId}:feed`).
 * This port abstracts the List operations so the application layer
 * stays decoupled from Redis internals.
 */
export interface IFeedCachePort {
  /**
   * Retrieve a slice of post IDs from the user's feed list.
   * Internally backed by Redis LRANGE.
   *
   * @param userId - Owner of the feed
   * @param offset - Zero-based start index
   * @param limit  - Maximum number of IDs to return
   * @returns Ordered array of post IDs (newest first, per Go worker push order)
   */
  getFeedPostIds(
    userId: string,
    offset: number,
    limit: number,
  ): Promise<string[]>;

  /**
   * Return the total length of the user's feed list (Redis LLEN).
   * Useful for diagnostics / pagination metadata.
   */
  getFeedLength(userId: string): Promise<number>;
}
