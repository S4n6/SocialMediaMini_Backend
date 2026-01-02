import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class RedisCacheService {
  private readonly logger = new Logger(RedisCacheService.name);

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl * 1000);
      this.logger.debug(`Cache set: ${key} (TTL: ${ttl}s)`);
    } catch (error) {
      this.logger.error(`Failed to set cache for key: ${key}`, error);
      throw error;
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    try {
      const result = await this.cacheManager.get<T>(key);

      if (result !== undefined && result !== null) {
        this.logger.debug(`Cache hit: ${key}`);
        return result;
      }

      this.logger.debug(`Cache miss: ${key}`);
      return null;
    } catch (error) {
      this.logger.error(`Failed to get cache for key: ${key}`, error);
      return null;
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      this.logger.debug(`Cache deleted: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete cache for key: ${key}`, error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      await this.cacheManager.clear();
      this.logger.debug('All cache cleared');
    } catch (error) {
      this.logger.error('Failed to clear all cache', error);
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.cacheManager.get(key);
      return result !== undefined && result !== null;
    } catch (error) {
      this.logger.error(
        `Failed to check cache existence for key: ${key}`,
        error,
      );
      return false;
    }
  }

  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number = 3600,
  ): Promise<T> {
    try {
      const cached = await this.get<T>(key);
      if (cached !== null) {
        return cached;
      }

      this.logger.debug(`Cache miss, fetching data for key: ${key}`);
      const freshData = await fetchFn();
      await this.set(key, freshData, ttl);

      return freshData;
    } catch (error) {
      this.logger.error(`Failed to getOrSet for key: ${key}`, error);
      throw error;
    }
  }
}
