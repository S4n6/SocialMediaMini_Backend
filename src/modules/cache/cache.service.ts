import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class RedisCacheService {
  private readonly logger = new Logger(RedisCacheService.name);

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  private getRedisClient() {
    try {
      const stores = (this.cacheManager as any).stores;
      const redisStore =
        stores?.find((store: any) => store.name === 'redis') || stores?.[1];
      const client = redisStore?.getClient?.() || redisStore;

      // Debug: log available methods (only once)
      if (client && !this.loggedMethods) {
        this.loggedMethods = true;
        const methods = Object.getOwnPropertyNames(
          Object.getPrototypeOf(client),
        )
          .filter(
            (name) =>
              typeof client[name] === 'function' &&
              name.toLowerCase().includes('z'),
          )
          .sort();
        this.logger.debug('Available Redis ZSET methods:', methods);
      }

      return client;
    } catch (err) {
      this.logger.error('Error accessing Redis client', err as any);
      return null;
    }
  }

  private loggedMethods = false;

  // Test method to check Redis connection and methods
  async testRedisConnection(): Promise<void> {
    try {
      const client = this.getRedisClient();
      this.logger.log('Redis client type:', typeof client);
      this.logger.log('Redis client constructor:', client?.constructor?.name);

      if (client) {
        // List all methods available on the client
        const allMethods = Object.getOwnPropertyNames(
          Object.getPrototypeOf(client),
        )
          .filter((name) => typeof client[name] === 'function')
          .sort();
        this.logger.log('All available methods:', allMethods);
      }
    } catch (err) {
      this.logger.error('Error testing Redis connection:', err);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.cacheManager.get<T>(key);
      return value ?? null;
    } catch (err) {
      this.logger.error(`Error reading cache key=${key}`, err as any);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    try {
      // cache-manager.set expects a numeric TTL (seconds) as the third argument
      await this.cacheManager.set(key, value, ttlSeconds ?? 50);
    } catch (err) {
      this.logger.error(`Error setting cache key=${key}`, err as any);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
    } catch (err) {
      this.logger.error(`Error deleting cache key=${key}`, err as any);
    }
  }

  async clear(): Promise<void> {
    try {
      await this.cacheManager.clear();
    } catch (err) {
      this.logger.error('Error clearing cache', err as any);
    }
  }

  // ZSET operations for Redis
  async zAdd(key: string, score: number, member: string): Promise<number> {
    try {
      const client = this.getRedisClient();
      if (!client) return 0;

      // Try different method names based on Redis client version
      if (typeof client.zadd === 'function') {
        return await client.zadd(key, score, member);
      } else if (typeof client.zAdd === 'function') {
        return await client.zAdd(key, [{ score, value: member }]);
      } else if (typeof client.ZADD === 'function') {
        return await client.ZADD(key, score, member);
      }

      this.logger.warn(`zAdd method not found on Redis client for key=${key}`);
      return 0;
    } catch (err) {
      this.logger.error(`Error adding to sorted set key=${key}`, err as any);
      return 0;
    }
  }

  async zRevRangeWithScores(
    key: string,
    start: number,
    stop: number,
  ): Promise<{ value: string; score: number }[]> {
    try {
      const client = this.getRedisClient();
      if (!client) return [];

      let result: any;

      // Try different method names
      if (typeof client.zrevrangebyscore === 'function') {
        result = await client.zrevrangebyscore(
          key,
          '+inf',
          '-inf',
          'WITHSCORES',
          'LIMIT',
          start,
          stop - start + 1,
        );
      } else if (typeof client.zRevRangeWithScores === 'function') {
        result = await client.zRevRangeWithScores(key, start, stop);
      } else if (typeof client.ZREVRANGE === 'function') {
        result = await client.ZREVRANGE(key, start, stop, 'WITHSCORES');
      } else if (typeof client.zrevrange === 'function') {
        result = await client.zrevrange(key, start, stop, 'WITHSCORES');
      } else {
        this.logger.warn(
          `zRevRangeWithScores method not found on Redis client for key=${key}`,
        );
        return [];
      }

      // Handle different result formats
      if (Array.isArray(result)) {
        if (
          result.length > 0 &&
          typeof result[0] === 'object' &&
          'value' in result[0]
        ) {
          // Already in correct format
          return result.map((item: any) => ({
            value: item.value,
            score: item.score,
          }));
        } else {
          // Format: [member1, score1, member2, score2, ...]
          const formatted: { value: string; score: number }[] = [];
          for (let i = 0; i < result.length; i += 2) {
            formatted.push({
              value: result[i],
              score: parseFloat(result[i + 1]),
            });
          }
          return formatted;
        }
      }

      return [];
    } catch (err) {
      this.logger.error(
        `Error getting sorted set range key=${key}`,
        err as any,
      );
      return [];
    }
  }

  async zCard(key: string): Promise<number> {
    try {
      const client = this.getRedisClient();
      if (!client) return 0;

      // Try different method names
      if (typeof client.zcard === 'function') {
        return await client.zcard(key);
      } else if (typeof client.zCard === 'function') {
        return await client.zCard(key);
      } else if (typeof client.ZCARD === 'function') {
        return await client.ZCARD(key);
      }

      this.logger.warn(`zCard method not found on Redis client for key=${key}`);
      return 0;
    } catch (err) {
      this.logger.error(
        `Error getting sorted set count key=${key}`,
        err as any,
      );
      return 0;
    }
  }

  async zRemRangeByRank(
    key: string,
    start: number,
    stop: number,
  ): Promise<number> {
    try {
      const client = this.getRedisClient();
      if (!client) return 0;

      // Try different method names
      if (typeof client.zremrangebyrank === 'function') {
        return await client.zremrangebyrank(key, start, stop);
      } else if (typeof client.zRemRangeByRank === 'function') {
        return await client.zRemRangeByRank(key, start, stop);
      } else if (typeof client.ZREMRANGEBYRANK === 'function') {
        return await client.ZREMRANGEBYRANK(key, start, stop);
      }

      this.logger.warn(
        `zRemRangeByRank method not found on Redis client for key=${key}`,
      );
      return 0;
    } catch (err) {
      this.logger.error(
        `Error removing sorted set range key=${key}`,
        err as any,
      );
      return 0;
    }
  }

  async zRem(key: string, member: string): Promise<number> {
    try {
      const client = this.getRedisClient();
      if (!client) return 0;

      // Try different method names
      if (typeof client.zrem === 'function') {
        return await client.zrem(key, member);
      } else if (typeof client.zRem === 'function') {
        return await client.zRem(key, member);
      } else if (typeof client.ZREM === 'function') {
        return await client.ZREM(key, member);
      }

      this.logger.warn(`zRem method not found on Redis client for key=${key}`);
      return 0;
    } catch (err) {
      this.logger.error(
        `Error removing from sorted set key=${key}`,
        err as any,
      );
      return 0;
    }
  }

  async zScore(key: string, member: string): Promise<number | null> {
    try {
      const client = this.getRedisClient();
      if (!client) return null;

      // Try different method names
      if (typeof client.zscore === 'function') {
        return await client.zscore(key, member);
      } else if (typeof client.zScore === 'function') {
        return await client.zScore(key, member);
      } else if (typeof client.ZSCORE === 'function') {
        return await client.ZSCORE(key, member);
      }

      this.logger.warn(
        `zScore method not found on Redis client for key=${key}`,
      );
      return null;
    } catch (err) {
      this.logger.error(
        `Error getting sorted set score key=${key}`,
        err as any,
      );
      return null;
    }
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    try {
      const client = this.getRedisClient();
      if (!client) return false;

      // Try different method names
      if (typeof client.expire === 'function') {
        return await client.expire(key, seconds);
      } else if (typeof client.EXPIRE === 'function') {
        return await client.EXPIRE(key, seconds);
      } else if (typeof client.pexpire === 'function') {
        return await client.pexpire(key, seconds * 1000); // Convert to milliseconds
      }

      this.logger.warn(
        `expire method not found on Redis client for key=${key}`,
      );
      return false;
    } catch (err) {
      this.logger.error(`Error setting expiry for key=${key}`, err as any);
      return false;
    }
  }
}
