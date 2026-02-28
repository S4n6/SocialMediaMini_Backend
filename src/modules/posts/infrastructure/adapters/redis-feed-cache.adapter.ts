import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';
import { IFeedCachePort } from '../../application/ports/i-feed-cache.port';
import { FEED_REDIS_CLIENT_TOKEN } from '../../constants';

/**
 * Redis adapter for the fan-out feed cache.
 *
 * Reads from a per-user Redis List populated by the Golang
 * fan-out worker. Key pattern: `user:{userId}:feed`.
 *
 * LRANGE is O(S+N) where S=start offset, N=elements returned,
 * which is efficiently pageable for typical feed sizes.
 */
@Injectable()
export class RedisFeedCacheAdapter implements IFeedCachePort, OnModuleDestroy {
  private readonly logger = new Logger(RedisFeedCacheAdapter.name);

  constructor(
    @Inject(FEED_REDIS_CLIENT_TOKEN)
    private readonly redis: Redis,
  ) {}

  /** Redis key for a user's feed list */
  private feedKey(userId: string): string {
    return `user:${userId}:feed`;
  }

  async getFeedPostIds(
    userId: string,
    offset: number,
    limit: number,
  ): Promise<string[]> {
    try {
      // LRANGE is inclusive on both ends → stop = offset + limit - 1
      return await this.redis.lrange(
        this.feedKey(userId),
        offset,
        offset + limit - 1,
      );
    } catch (error) {
      this.logger.error(
        `Failed to read feed for user ${userId}: ${error.message}`,
      );
      return [];
    }
  }

  async getFeedLength(userId: string): Promise<number> {
    try {
      return await this.redis.llen(this.feedKey(userId));
    } catch (error) {
      this.logger.error(
        `Failed to get feed length for user ${userId}: ${error.message}`,
      );
      return 0;
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.redis.quit();
      this.logger.log('Feed Redis client disconnected gracefully');
    } catch {
      // Swallow — process is shutting down
    }
  }
}
