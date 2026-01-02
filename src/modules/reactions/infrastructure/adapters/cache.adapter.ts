import { Injectable, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

export interface ICacheAdapter {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: any, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  deletePattern(pattern: string): Promise<void>;
  increment(key: string, amount?: number): Promise<number>;
  decrement(key: string, amount?: number): Promise<number>;
  exists(key: string): Promise<boolean>;
  ttl(key: string): Promise<number>;
}

@Injectable()
export class CacheAdapter implements ICacheAdapter {
  private readonly logger = new Logger(CacheAdapter.name);
  private readonly DEFAULT_TTL = 3600; // 1 hour
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 100; // ms

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | null> {
    return this.executeWithRetry(async () => {
      const value = await this.cacheManager.get<T>(key);
      this.logger.debug(`Cache GET: ${key} -> ${value ? 'HIT' : 'MISS'}`);
      return value || null;
    }, `get ${key}`);
  }

  async set(key: string, value: any, ttl = this.DEFAULT_TTL): Promise<void> {
    return this.executeWithRetry(async () => {
      await this.cacheManager.set(key, value, ttl * 1000);
      this.logger.debug(`Cache SET: ${key} (TTL: ${ttl}s)`);
    }, `set ${key}`);
  }

  async delete(key: string): Promise<void> {
    return this.executeWithRetry(async () => {
      await this.cacheManager.del(key);
      this.logger.debug(`Cache DELETE: ${key}`);
    }, `delete ${key}`);
  }

  async deletePattern(pattern: string): Promise<void> {
    return this.executeWithRetry(async () => {
      // Implementation depends on cache store (Redis, Memory, etc.)
      const store = (this.cacheManager as any).store;
      if (store && store.keys) {
        const keys = await store.keys(pattern);
        if (keys.length > 0) {
          await Promise.all(
            keys.map((key: string) => this.cacheManager.del(key)),
          );
          this.logger.debug(
            `Cache DELETE_PATTERN: ${pattern} (${keys.length} keys)`,
          );
        }
      } else {
        this.logger.warn(
          `Cache store does not support pattern deletion: ${pattern}`,
        );
      }
    }, `deletePattern ${pattern}`);
  }

  async increment(key: string, amount = 1): Promise<number> {
    return this.executeWithRetry(async () => {
      const store = (this.cacheManager as any).store;
      if (store && store.incr) {
        const result = await store.incr(key, amount);
        this.logger.debug(`Cache INCREMENT: ${key} by ${amount} -> ${result}`);
        return result;
      } else {
        // Fallback for stores that don't support increment
        const current = (await this.get<number>(key)) || 0;
        const newValue = current + amount;
        await this.set(key, newValue);
        this.logger.debug(
          `Cache INCREMENT (fallback): ${key} by ${amount} -> ${newValue}`,
        );
        return newValue;
      }
    }, `increment ${key}`);
  }

  async decrement(key: string, amount = 1): Promise<number> {
    return this.executeWithRetry(async () => {
      const store = (this.cacheManager as any).store;
      if (store && store.decr) {
        const result = await store.decr(key, amount);
        this.logger.debug(`Cache DECREMENT: ${key} by ${amount} -> ${result}`);
        return result;
      } else {
        // Fallback for stores that don't support decrement
        const current = (await this.get<number>(key)) || 0;
        const newValue = Math.max(0, current - amount);
        await this.set(key, newValue);
        this.logger.debug(
          `Cache DECREMENT (fallback): ${key} by ${amount} -> ${newValue}`,
        );
        return newValue;
      }
    }, `decrement ${key}`);
  }

  async exists(key: string): Promise<boolean> {
    return this.executeWithRetry(async () => {
      const value = await this.cacheManager.get(key);
      const exists = value !== undefined && value !== null;
      this.logger.debug(`Cache EXISTS: ${key} -> ${exists}`);
      return exists;
    }, `exists ${key}`);
  }

  async ttl(key: string): Promise<number> {
    return this.executeWithRetry(async () => {
      const store = (this.cacheManager as any).store;
      if (store && store.ttl) {
        const ttl = await store.ttl(key);
        this.logger.debug(`Cache TTL: ${key} -> ${ttl}s`);
        return ttl;
      } else {
        this.logger.warn(`Cache store does not support TTL check: ${key}`);
        return -1; // Unknown TTL
      }
    }, `ttl ${key}`);
  }

  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt === this.MAX_RETRIES) {
          this.logger.error(
            `Cache operation failed after ${this.MAX_RETRIES} attempts: ${operationName}`,
            lastError.stack,
          );
          throw lastError;
        }

        this.logger.warn(
          `Cache operation failed (attempt ${attempt}/${this.MAX_RETRIES}): ${operationName}. Retrying...`,
          lastError.message,
        );

        await this.delay(this.RETRY_DELAY * attempt);
      }
    }

    throw (
      lastError ||
      new Error(`Unknown error in cache operation: ${operationName}`)
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Utility methods for generating cache keys
  static generateReactionKey(
    targetType: string,
    targetId: string,
    userId?: string,
  ): string {
    return userId
      ? `reaction:${targetType}:${targetId}:${userId}`
      : `reaction:${targetType}:${targetId}`;
  }

  static generateStatsKey(targetType: string, targetId: string): string {
    return `reaction_stats:${targetType}:${targetId}`;
  }

  static generateUserReactionsKey(userId: string): string {
    return `user_reactions:${userId}`;
  }

  static generateTrendingKey(targetType: string): string {
    return `trending:${targetType}`;
  }
}
