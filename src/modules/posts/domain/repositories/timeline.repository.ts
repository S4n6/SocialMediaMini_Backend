import { PostEntity } from '../entities/post.entity';

/**
 * Cursor-paginated result for timeline feeds.
 * `nextCursor` is null when there are no more pages.
 */
export interface CursorPaginatedPosts {
  posts: PostEntity[];
  nextCursor: string | null;
}

/**
 * Legacy offset-based result (kept for backward-compat on non-feed queries).
 */
export interface OffsetPaginatedPosts {
  posts: PostEntity[];
  total: number;
}

export interface ITimelineRepository {
  /**
   * Chronological timeline using cursor-based pagination.
   * @param cursor - PostId to start after (null for first page)
   * @param limit  - Number of posts to return
   */
  getTimelineFeed(
    userId: string,
    limit: number,
    cursor?: string | null,
  ): Promise<CursorPaginatedPosts>;

  getSmartTimelineFeed?(
    userId: string,
    limit: number,
    cursor?: string | null,
  ): Promise<CursorPaginatedPosts>;

  getDiversifiedTimelineFeed?(
    userId: string,
    limit: number,
    cursor?: string | null,
  ): Promise<CursorPaginatedPosts>;
}
