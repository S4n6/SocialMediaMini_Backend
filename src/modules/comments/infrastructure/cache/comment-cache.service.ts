/**
 * Comment Cache Service
 *
 * Provides intelligent caching for expensive operations like:
 * - User information lookups
 * - Post validation checks
 * - Comment counts and statistics
 * - Frequent database queries
 */

import { Injectable, Logger } from '@nestjs/common';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

export interface CacheStats {
  hits: number;
  misses: number;
  entries: number;
  hitRate: number;
}

@Injectable()
export class CommentCacheService {
  private readonly logger = new Logger(CommentCacheService.name);
  private readonly cache = new Map<string, CacheEntry<any>>();
  private stats = { hits: 0, misses: 0 };

  // Default TTL configurations for different data types
  private readonly defaultTTL = {
    USER_INFO: 5 * 60 * 1000, // 5 minutes
    POST_VALIDATION: 10 * 60 * 1000, // 10 minutes
    COMMENT_COUNT: 2 * 60 * 1000, // 2 minutes
    REACTION_COUNT: 1 * 60 * 1000, // 1 minute
    ADMIN_CHECK: 15 * 60 * 1000, // 15 minutes
  };

  /**
   * Get cached value with automatic expiration
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      this.logger.debug(`Cache miss for key: ${key}`);
      return null;
    }

    // Check if expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      this.logger.debug(`Cache expired for key: ${key}`);
      return null;
    }

    this.stats.hits++;
    this.logger.debug(`Cache hit for key: ${key}`);
    return entry.data as T;
  }

  /**
   * Set cached value with custom or default TTL
   */
  set<T>(key: string, data: T, customTTL?: number): void {
    const ttl = customTTL || this.getDefaultTTL(key);

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };

    this.cache.set(key, entry);
    this.logger.debug(`Cached key: ${key} with TTL: ${ttl}ms`);
  }

  /**
   * Remove specific cache entry
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.logger.debug(`Deleted cache key: ${key}`);
    }
    return deleted;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    const entriesCount = this.cache.size;
    this.cache.clear();
    this.stats = { hits: 0, misses: 0 };
    this.logger.log(`Cleared ${entriesCount} cache entries`);
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate =
      totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;

    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      entries: this.cache.size,
      hitRate: Math.round(hitRate * 100) / 100, // Round to 2 decimal places
    };
  }

  /**
   * Clean up expired entries (should be called periodically)
   */
  cleanup(): number {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      this.logger.log(`Cleaned up ${removedCount} expired cache entries`);
    }

    return removedCount;
  }

  /**
   * Get or set pattern for expensive operations
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    customTTL?: number,
  ): Promise<T> {
    // Try to get from cache first
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // If not in cache, execute factory function
    try {
      const data = await factory();
      this.set(key, data, customTTL);
      return data;
    } catch (error) {
      this.logger.error(`Error executing factory for key ${key}:`, error);
      throw error;
    }
  }

  // ========== CACHE KEY BUILDERS ==========

  /**
   * Build standardized cache keys
   */
  static buildKey(
    category: string,
    identifier: string,
    suffix?: string,
  ): string {
    const parts = [category, identifier];
    if (suffix) parts.push(suffix);
    return parts.join(':');
  }

  static userKey(userId: string, operation: string = 'info'): string {
    return this.buildKey('user', userId, operation);
  }

  static postKey(postId: string, operation: string = 'info'): string {
    return this.buildKey('post', postId, operation);
  }

  static commentKey(commentId: string, operation: string = 'info'): string {
    return this.buildKey('comment', commentId, operation);
  }

  static countKey(entity: string, id: string): string {
    return this.buildKey('count', entity, id);
  }

  // ========== PRIVATE METHODS ==========

  /**
   * Determine default TTL based on key pattern
   */
  private getDefaultTTL(key: string): number {
    if (key.includes('user')) {
      if (key.includes('admin')) return this.defaultTTL.ADMIN_CHECK;
      return this.defaultTTL.USER_INFO;
    }

    if (key.includes('post')) {
      return this.defaultTTL.POST_VALIDATION;
    }

    if (key.includes('count')) {
      if (key.includes('reaction')) return this.defaultTTL.REACTION_COUNT;
      return this.defaultTTL.COMMENT_COUNT;
    }

    // Default fallback
    return this.defaultTTL.USER_INFO;
  }
}
