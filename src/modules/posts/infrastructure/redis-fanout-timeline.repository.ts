import { Inject, Injectable, Logger } from '@nestjs/common';
import { PostEntity } from '../domain/entities/post.entity';
import {
  ITimelineRepository,
  CursorPaginatedPosts,
} from '../domain/repositories/timeline.repository';
import { IPostRepository } from '../domain/repositories/post.repository';
import { IFeedCachePort } from '../application/ports/i-feed-cache.port';
import { POST_REPOSITORY_TOKEN, FEED_CACHE_PORT_TOKEN } from '../constants';

/**
 * Timeline repository backed by Redis Fan-out on Write.
 *
 * Flow:
 *   1. LRANGE on `user:{userId}:feed` to retrieve paginated post IDs
 *   2. Prisma `findMany({ where: { id: { in: [...] } } })` for full entities
 *   3. Re-sort results to preserve the exact Redis ordering
 *      (Prisma's `IN` clause does NOT guarantee order)
 *
 * Cursor strategy:
 *   The cursor is a stringified numeric offset into the Redis List.
 *   - First page: cursor is null  → offset = 0
 *   - Subsequent:  cursor = "10"  → offset = 10
 *   The frontend treats it as an opaque token.
 *
 * Graceful degradation:
 *   When the Redis list is empty (new user / cold start) the method
 *   returns an empty page. A separate backfill job in the Go worker
 *   handles cold-start hydration.
 */
@Injectable()
export class RedisFanoutTimelineRepository implements ITimelineRepository {
  private readonly logger = new Logger(RedisFanoutTimelineRepository.name);

  constructor(
    @Inject(FEED_CACHE_PORT_TOKEN)
    private readonly feedCache: IFeedCachePort,

    @Inject(POST_REPOSITORY_TOKEN)
    private readonly postRepository: IPostRepository,
  ) {}

  // ──────────────────────────────────────────────────────────
  // ITimelineRepository — all algorithms resolve to the same
  // pre-computed feed (the Go worker decides composition).
  // ──────────────────────────────────────────────────────────

  async getTimelineFeed(
    userId: string,
    limit: number,
    cursor?: string | null,
  ): Promise<CursorPaginatedPosts> {
    const offset = this.parseOffset(cursor);

    // Over-fetch by 1 to detect whether a next page exists
    const postIds = await this.feedCache.getFeedPostIds(
      userId,
      offset,
      limit + 1,
    );

    if (postIds.length === 0) {
      return { posts: [], nextCursor: null };
    }

    const hasNextPage = postIds.length > limit;
    const pageIds = hasNextPage ? postIds.slice(0, limit) : postIds;

    // Batch-load full post entities from PostgreSQL
    const posts = await this.postRepository.findByIds(pageIds);

    // ── Preserve Redis order ────────────────────────────────
    // Build a Map<postId, PostEntity> for O(1) lookup, then
    // iterate pageIds in Redis order. Posts that were deleted
    // between the LRANGE and the DB query are silently skipped.
    const postMap = new Map<string, PostEntity>(posts.map((p) => [p.id, p]));
    const ordered = pageIds
      .map((id) => postMap.get(id))
      .filter((p): p is PostEntity => p !== undefined);

    // If some IDs were stale, log for observability
    if (ordered.length < pageIds.length) {
      this.logger.warn(
        `Feed for user ${userId}: ${pageIds.length - ordered.length} stale post IDs skipped`,
      );
    }

    const nextCursor = hasNextPage ? String(offset + pageIds.length) : null;

    return { posts: ordered, nextCursor };
  }

  /**
   * Smart / diversified algorithms are not applicable when
   * the Go worker already computes the feed composition.
   * Delegate to the single pre-computed feed.
   */
  async getSmartTimelineFeed(
    userId: string,
    limit: number,
    cursor?: string | null,
  ): Promise<CursorPaginatedPosts> {
    return this.getTimelineFeed(userId, limit, cursor);
  }

  async getDiversifiedTimelineFeed(
    userId: string,
    limit: number,
    cursor?: string | null,
  ): Promise<CursorPaginatedPosts> {
    return this.getTimelineFeed(userId, limit, cursor);
  }

  // ──────────────────────────────────────────────────────────
  // Private helpers
  // ──────────────────────────────────────────────────────────

  /**
   * Parse the opaque cursor string into a numeric offset.
   * Returns 0 for null / invalid values (first page).
   */
  private parseOffset(cursor?: string | null): number {
    if (!cursor) return 0;
    const n = parseInt(cursor, 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }
}
