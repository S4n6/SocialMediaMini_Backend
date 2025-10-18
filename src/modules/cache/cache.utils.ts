import { Injectable, Logger } from '@nestjs/common';
import { RedisCacheService } from './cache.service';
import {
  CacheConfigName,
  generateCacheKey,
  getCacheTTL,
} from './cache.interfaces';

/**
 * Utility service đơn giản cho các use case cache thường gặp
 * Phù hợp cho fresher level
 */
@Injectable()
export class CacheUtils {
  private readonly logger = new Logger(CacheUtils.name);

  constructor(private readonly cacheService: RedisCacheService) {}

  // ===== USER PROFILE CACHE =====

  /**
   * Cache user profile data
   */
  async cacheUserProfile(userId: string, userData: any): Promise<void> {
    const key = generateCacheKey('USER_PROFILE', userId);
    const ttl = getCacheTTL('USER_PROFILE');
    await this.cacheService.set(key, userData, ttl);
    this.logger.debug(`Cached user profile for user ${userId}`);
  }

  /**
   * Get cached user profile
   */
  async getCachedUserProfile(userId: string): Promise<any | null> {
    const key = generateCacheKey('USER_PROFILE', userId);
    return await this.cacheService.get(key);
  }

  /**
   * Remove user profile from cache
   */
  async invalidateUserProfile(userId: string): Promise<void> {
    const key = generateCacheKey('USER_PROFILE', userId);
    await this.cacheService.del(key);
    this.logger.debug(`Invalidated user profile for user ${userId}`);
  }

  // ===== POST CACHE =====

  /**
   * Cache single post data
   */
  async cachePost(postId: string, postData: any): Promise<void> {
    const key = generateCacheKey('POST', postId);
    const ttl = getCacheTTL('POST');
    await this.cacheService.set(key, postData, ttl);
    this.logger.debug(`Cached post ${postId}`);
  }

  /**
   * Get cached post
   */
  async getCachedPost(postId: string): Promise<any | null> {
    const key = generateCacheKey('POST', postId);
    return await this.cacheService.get(key);
  }

  /**
   * Remove post from cache
   */
  async invalidatePost(postId: string): Promise<void> {
    const key = generateCacheKey('POST', postId);
    await this.cacheService.del(key);
    this.logger.debug(`Invalidated post ${postId}`);
  }

  // ===== USER FEED CACHE =====

  /**
   * Cache user feed với pagination
   */
  async cacheUserFeed(
    userId: string,
    feedData: any[],
    page: number = 1,
  ): Promise<void> {
    const key = generateCacheKey('USER_FEED', `${userId}:page:${page}`);
    const ttl = getCacheTTL('USER_FEED');
    await this.cacheService.set(key, feedData, ttl);
    this.logger.debug(`Cached feed for user ${userId}, page ${page}`);
  }

  /**
   * Get cached user feed
   */
  async getCachedUserFeed(
    userId: string,
    page: number = 1,
  ): Promise<any[] | null> {
    const key = generateCacheKey('USER_FEED', `${userId}:page:${page}`);
    return await this.cacheService.get(key);
  }

  /**
   * Invalidate user feed (tất cả pages)
   */
  async invalidateUserFeed(userId: string): Promise<void> {
    // Xóa nhiều pages của feed (tạm thời xóa 5 pages đầu)
    const keys: string[] = [];
    for (let page = 1; page <= 5; page++) {
      keys.push(generateCacheKey('USER_FEED', `${userId}:page:${page}`));
    }

    await Promise.all(keys.map((key) => this.cacheService.del(key)));
    this.logger.debug(`Invalidated feed for user ${userId}`);
  }

  // ===== SEARCH CACHE =====

  /**
   * Cache search results
   */
  async cacheSearchResults(
    query: string,
    results: any[],
    type: string = 'general',
  ): Promise<void> {
    const searchKey = `${type}:${query.toLowerCase()}`;
    const key = generateCacheKey('SEARCH', searchKey);
    const ttl = getCacheTTL('SEARCH');
    await this.cacheService.set(key, results, ttl);
    this.logger.debug(`Cached search results for query: ${query}`);
  }

  /**
   * Get cached search results
   */
  async getCachedSearchResults(
    query: string,
    type: string = 'general',
  ): Promise<any[] | null> {
    const searchKey = `${type}:${query.toLowerCase()}`;
    const key = generateCacheKey('SEARCH', searchKey);
    return await this.cacheService.get(key);
  }

  // ===== NOTIFICATIONS CACHE =====

  /**
   * Cache user notifications
   */
  async cacheUserNotifications(
    userId: string,
    notifications: any[],
  ): Promise<void> {
    const key = generateCacheKey('NOTIFICATIONS', userId);
    const ttl = getCacheTTL('NOTIFICATIONS');
    await this.cacheService.set(key, notifications, ttl);
    this.logger.debug(`Cached notifications for user ${userId}`);
  }

  /**
   * Get cached user notifications
   */
  async getCachedUserNotifications(userId: string): Promise<any[] | null> {
    const key = generateCacheKey('NOTIFICATIONS', userId);
    return await this.cacheService.get(key);
  }

  /**
   * Invalidate user notifications
   */
  async invalidateUserNotifications(userId: string): Promise<void> {
    const key = generateCacheKey('NOTIFICATIONS', userId);
    await this.cacheService.del(key);
    this.logger.debug(`Invalidated notifications for user ${userId}`);
  }

  // ===== UTILITY METHODS =====

  /**
   * Invalidate multiple related caches khi user tạo post mới
   */
  async invalidateAfterNewPost(userId: string, postId: string): Promise<void> {
    // Xóa feed của user
    await this.invalidateUserFeed(userId);

    // Có thể thêm logic xóa feed của followers sau này
    this.logger.debug(
      `Invalidated caches after new post ${postId} by user ${userId}`,
    );
  }

  /**
   * Invalidate multiple related caches khi user update profile
   */
  async invalidateAfterProfileUpdate(userId: string): Promise<void> {
    // Xóa profile cache
    await this.invalidateUserProfile(userId);

    // Có thể thêm logic xóa các cache khác liên quan đến user
    this.logger.debug(
      `Invalidated caches after profile update for user ${userId}`,
    );
  }

  /**
   * Clear all cache (emergency use only!)
   */
  async clearAllCache(): Promise<void> {
    await this.cacheService.clear();
    this.logger.warn(
      'ALL CACHE CLEARED - This should only be used in emergencies!',
    );
  }
}
