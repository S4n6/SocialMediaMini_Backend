import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class RedisCacheService {
  private readonly logger = new Logger(RedisCacheService.name);

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

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
}
