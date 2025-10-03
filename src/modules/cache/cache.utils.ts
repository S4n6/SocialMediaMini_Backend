import { Injectable, Logger } from '@nestjs/common';
import { RedisCacheService } from './cache.service';
import { CacheConfigName, DEFAULT_CACHE_CONFIGS } from './cache.interfaces';

@Injectable()
export class CacheUtils {
  private readonly logger = new Logger(CacheUtils.name);

  constructor(private readonly cacheService: RedisCacheService) {}

  // User-related caching utilities
  async cacheUserProfile(userId: string, userData: any): Promise<void> {
    const key = `user:profile:${userId}`;
    await this.cacheService.set(key, userData, 'USER_PROFILE');
  }

  async getCachedUserProfile(userId: string): Promise<any | null> {
    const key = `user:profile:${userId}`;
    return this.cacheService.get(key, 'USER_PROFILE');
  }

  async invalidateUserProfile(userId: string): Promise<void> {
    await this.cacheService.del(`user:profile:${userId}`, 'USER_PROFILE');
  }

  // Post-related caching utilities
  async cachePost(postId: string, postData: any): Promise<void> {
    const key = `post:${postId}`;
    await this.cacheService.set(key, postData, 'POST');
  }

  async getCachedPost(postId: string): Promise<any | null> {
    const key = `post:${postId}`;
    return this.cacheService.get(key, 'POST');
  }

  async cacheUserPosts(
    userId: string,
    posts: any[],
    page: number = 1,
    limit: number = 20,
  ): Promise<void> {
    const key = `post:list:user:${userId}:${page}:${limit}`;
    await this.cacheService.set(key, posts, 'POST_LIST');
  }

  async getCachedUserPosts(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<any[] | null> {
    const key = `post:list:user:${userId}:${page}:${limit}`;
    return this.cacheService.get(key, 'POST_LIST');
  }

  // Feed-related caching utilities
  async cacheUserFeed(
    userId: string,
    feedData: any[],
    page: number = 1,
    limit: number = 20,
  ): Promise<void> {
    const key = `user:feed:${userId}:${page}:${limit}`;
    await this.cacheService.set(key, feedData, 'USER_FEED');
  }

  async getCachedUserFeed(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<any[] | null> {
    const key = `user:feed:${userId}:${page}:${limit}`;
    return this.cacheService.get(key, 'USER_FEED');
  }

  async invalidateUserFeed(userId: string): Promise<void> {
    await this.cacheService.invalidateByPattern(`user:feed:${userId}:*`);
  }

  // Search-related caching utilities
  async cacheSearchResults(
    query: string,
    results: any,
    type: string = 'all',
    page: number = 1,
  ): Promise<void> {
    const normalizedQuery = this.normalizeSearchQuery(query);
    const key = `search:${normalizedQuery}:${type}:${page}`;
    await this.cacheService.set(key, results, 'SEARCH_RESULTS');
  }

  async getCachedSearchResults(
    query: string,
    type: string = 'all',
    page: number = 1,
  ): Promise<any | null> {
    const normalizedQuery = this.normalizeSearchQuery(query);
    const key = `search:${normalizedQuery}:${type}:${page}`;
    return this.cacheService.get(key, 'SEARCH_RESULTS');
  }

  async cachePopularSearches(searches: any[]): Promise<void> {
    const key = 'search:popular';
    await this.cacheService.set(key, searches, 'SEARCH_RESULTS');
  }

  async getCachedPopularSearches(): Promise<any[] | null> {
    const key = 'search:popular';
    return this.cacheService.get(key, 'SEARCH_RESULTS');
  }

  // Authentication-related caching utilities
  async cacheUserSession(
    userId: string,
    sessionData: any,
    expiresIn: number = 3600,
  ): Promise<void> {
    const key = `auth:session:${userId}`;
    await this.cacheService.set(key, sessionData, {
      ttl: expiresIn,
      serialize: true,
    });
  }

  async getCachedUserSession(userId: string): Promise<any | null> {
    const key = `auth:session:${userId}`;
    return this.cacheService.get(key, 'AUTH_STATE');
  }

  async invalidateUserSession(userId: string): Promise<void> {
    await this.cacheService.del(`auth:session:${userId}`, 'AUTH_STATE');
  }

  async cacheUserPermissions(
    userId: string,
    permissions: string[],
  ): Promise<void> {
    const key = `auth:permissions:${userId}`;
    await this.cacheService.set(key, permissions, 'AUTH_STATE');
  }

  async getCachedUserPermissions(userId: string): Promise<string[] | null> {
    const key = `auth:permissions:${userId}`;
    return this.cacheService.get(key, 'AUTH_STATE');
  }

  // Notification-related caching utilities
  async cacheUserNotifications(
    userId: string,
    notifications: any[],
    page: number = 1,
  ): Promise<void> {
    const key = `notifications:${userId}:${page}`;
    await this.cacheService.set(key, notifications, 'NOTIFICATION_LIST');
  }

  async getCachedUserNotifications(
    userId: string,
    page: number = 1,
  ): Promise<any[] | null> {
    const key = `notifications:${userId}:${page}`;
    return this.cacheService.get(key, 'NOTIFICATION_LIST');
  }

  async cacheUnreadNotificationCount(
    userId: string,
    count: number,
  ): Promise<void> {
    const key = `notifications:unread:${userId}`;
    await this.cacheService.set(key, count, { ttl: 300 }); // 5 minutes
  }

  async getCachedUnreadNotificationCount(
    userId: string,
  ): Promise<number | null> {
    const key = `notifications:unread:${userId}`;
    return this.cacheService.get(key, { ttl: 300 });
  }

  // Follow-related caching utilities
  async cacheUserFollowers(
    userId: string,
    followers: any[],
    page: number = 1,
  ): Promise<void> {
    const key = `user:followers:${userId}:${page}`;
    await this.cacheService.set(key, followers, 'USER_LIST');
  }

  async getCachedUserFollowers(
    userId: string,
    page: number = 1,
  ): Promise<any[] | null> {
    const key = `user:followers:${userId}:${page}`;
    return this.cacheService.get(key, 'USER_LIST');
  }

  async cacheUserFollowing(
    userId: string,
    following: any[],
    page: number = 1,
  ): Promise<void> {
    const key = `user:following:${userId}:${page}`;
    await this.cacheService.set(key, following, 'USER_LIST');
  }

  async getCachedUserFollowing(
    userId: string,
    page: number = 1,
  ): Promise<any[] | null> {
    const key = `user:following:${userId}:${page}`;
    return this.cacheService.get(key, 'USER_LIST');
  }

  // Reaction/Like caching utilities
  async cachePostLikeCount(postId: string, count: number): Promise<void> {
    const key = `post:likes:${postId}`;
    await this.cacheService.set(key, count, { ttl: 300 }); // 5 minutes
  }

  async getCachedPostLikeCount(postId: string): Promise<number | null> {
    const key = `post:likes:${postId}`;
    return this.cacheService.get(key, { ttl: 300 });
  }

  async cachePostCommentCount(postId: string, count: number): Promise<void> {
    const key = `post:comments:${postId}`;
    await this.cacheService.set(key, count, { ttl: 300 }); // 5 minutes
  }

  async getCachedPostCommentCount(postId: string): Promise<number | null> {
    const key = `post:comments:${postId}`;
    return this.cacheService.get(key, { ttl: 300 });
  }

  // Comment caching utilities
  async cachePostComments(
    postId: string,
    comments: any[],
    page: number = 1,
  ): Promise<void> {
    const key = `post:comments:${postId}:${page}`;
    await this.cacheService.set(key, comments, 'POST_LIST');
  }

  async getCachedPostComments(
    postId: string,
    page: number = 1,
  ): Promise<any[] | null> {
    const key = `post:comments:${postId}:${page}`;
    return this.cacheService.get(key, 'POST_LIST');
  }

  // Trending/Popular content caching
  async cacheTrendingPosts(
    posts: any[],
    timeframe: string = 'day',
  ): Promise<void> {
    const key = `trending:posts:${timeframe}`;
    await this.cacheService.set(key, posts, 'POST_LIST');
  }

  async getCachedTrendingPosts(
    timeframe: string = 'day',
  ): Promise<any[] | null> {
    const key = `trending:posts:${timeframe}`;
    return this.cacheService.get(key, 'POST_LIST');
  }

  async cachePopularUsers(users: any[]): Promise<void> {
    const key = 'users:popular';
    await this.cacheService.set(key, users, 'USER_LIST');
  }

  async getCachedPopularUsers(): Promise<any[] | null> {
    const key = 'users:popular';
    return this.cacheService.get(key, 'USER_LIST');
  }

  // Batch operations
  async cacheBatchUserProfiles(
    userProfiles: Array<[string, any]>,
  ): Promise<void> {
    const promises = userProfiles.map(([userId, profile]) =>
      this.cacheUserProfile(userId, profile),
    );
    await Promise.all(promises);
  }

  async getCachedBatchUserProfiles(
    userIds: string[],
  ): Promise<Array<any | null>> {
    const promises = userIds.map((userId) => this.getCachedUserProfile(userId));
    return Promise.all(promises);
  }

  // Cache invalidation utilities
  async invalidateAllUserRelatedCache(userId: string): Promise<void> {
    await Promise.all([
      this.cacheService.invalidateByPattern(`user:profile:${userId}`),
      this.cacheService.invalidateByPattern(`user:feed:${userId}:*`),
      this.cacheService.invalidateByPattern(`user:followers:${userId}:*`),
      this.cacheService.invalidateByPattern(`user:following:${userId}:*`),
      this.cacheService.invalidateByPattern(`auth:*:${userId}`),
      this.cacheService.invalidateByPattern(`notifications:${userId}:*`),
    ]);
  }

  async invalidateAllPostRelatedCache(postId: string): Promise<void> {
    await Promise.all([
      this.cacheService.invalidateByPattern(`post:${postId}`),
      this.cacheService.invalidateByPattern(`post:likes:${postId}`),
      this.cacheService.invalidateByPattern(`post:comments:${postId}:*`),
      this.cacheService.invalidateByPattern(`user:feed:*`), // Invalidate all feeds
    ]);
  }

  // Cache warming utilities
  async warmUserCache(userId: string, userData: any): Promise<void> {
    await Promise.all([
      this.cacheUserProfile(userId, userData),
      // Pre-warm related caches if needed
    ]);
  }

  async warmPopularContent(): Promise<void> {
    try {
      // This would typically fetch and cache popular content
      // Implementation depends on your business logic
      this.logger.log('Warming popular content cache...');

      // Example: Cache popular searches, trending posts, etc.
      // await this.cachePopularSearches(await this.getPopularSearches());
      // await this.cacheTrendingPosts(await this.getTrendingPosts());
    } catch (error) {
      this.logger.error('Error warming popular content cache', error);
    }
  }

  // Helper methods
  private normalizeSearchQuery(query: string): string {
    return query.toLowerCase().trim().replace(/\s+/g, '_');
  }

  // Cache statistics for monitoring
  async getCacheStatistics(): Promise<any> {
    const stats = this.cacheService.getStats();
    const isHealthy = await this.cacheService.ping();

    return {
      ...stats,
      healthy: isHealthy,
      timestamp: new Date(),
    };
  }

  // Clear cache by type/pattern
  async clearCacheByType(
    type: 'user' | 'post' | 'feed' | 'search' | 'auth' | 'notification' | 'all',
  ): Promise<void> {
    switch (type) {
      case 'user':
        await this.cacheService.invalidateByTag('user');
        break;
      case 'post':
        await this.cacheService.invalidateByTag('post');
        break;
      case 'feed':
        await this.cacheService.invalidateByTag('feed');
        break;
      case 'search':
        await this.cacheService.invalidateByTag('search');
        break;
      case 'auth':
        await this.cacheService.invalidateByTag('auth');
        break;
      case 'notification':
        await this.cacheService.invalidateByTag('notification');
        break;
      case 'all':
        await this.cacheService.clear();
        break;
      default:
        throw new Error(`Unknown cache type: ${type}`);
    }
  }
}
