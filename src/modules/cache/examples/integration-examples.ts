/**
 * Integration examples showing how to use the enhanced caching system
 * in your existing services. These examples demonstrate both decorator-based
 * and manual caching approaches.
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cacheable, CacheEvict, CacheUpdate } from '../cache.decorators';
import { RedisCacheService } from '../cache.service';
import { CacheUtils } from '../cache.utils';

// ==================== USER SERVICE INTEGRATION ====================

@Injectable()
export class EnhancedUserService {
  private readonly logger = new Logger(EnhancedUserService.name);

  constructor(
    private readonly cacheService: RedisCacheService,
    private readonly cacheUtils: CacheUtils,
  ) {}

  // Example 1: Decorator-based caching
  @Cacheable('{{id}}', 'USER_PROFILE')
  async getUserById(id: string) {
    this.logger.debug(`Fetching user from database: ${id}`);
    // Your existing user fetching logic here
    return {
      id,
      username: `user_${id}`,
      email: `user${id}@example.com`,
      avatar: 'https://example.com/avatar.jpg',
      createdAt: new Date(),
    };
  }

  // Example 2: Cache update with invalidation
  @CacheUpdate(
    '{{id}}',
    ['user:feed:{{id}}:*', 'user:followers:{{id}}:*'],
    'USER_PROFILE',
  )
  async updateUser(id: string, updateData: any) {
    this.logger.debug(`Updating user: ${id}`);
    // Your existing update logic here
    const updatedUser = { id, ...updateData, updatedAt: new Date() };

    // The decorator will automatically cache this result and invalidate related caches
    return updatedUser;
  }

  // Example 3: Cache eviction
  @CacheEvict([
    'user:profile:{{id}}',
    'user:feed:{{id}}:*',
    'user:followers:{{id}}:*',
    'user:following:{{id}}:*',
    'auth:*:{{id}}',
  ])
  async deleteUser(id: string) {
    this.logger.debug(`Deleting user: ${id}`);
    // Your existing deletion logic here
    return { success: true, deletedAt: new Date() };
  }

  // Example 4: Manual caching for complex scenarios
  async getUserFollowers(userId: string, page: number = 1, limit: number = 20) {
    // Try cache first using utility
    const cachedFollowers = await this.cacheUtils.getCachedUserFollowers(
      userId,
      page,
    );
    if (cachedFollowers) {
      this.logger.debug(`Cache hit for user followers: ${userId}`);
      return cachedFollowers;
    }

    // Cache miss - fetch from database
    this.logger.debug(`Cache miss for user followers: ${userId}`);
    const followers = await this.fetchFollowersFromDB(userId, page, limit);

    // Cache the result
    await this.cacheUtils.cacheUserFollowers(userId, followers, page);

    return followers;
  }

  private async fetchFollowersFromDB(
    userId: string,
    page: number,
    limit: number,
  ) {
    // Simulate database fetch
    return Array.from({ length: Math.min(limit, 10) }, (_, i) => ({
      id: `follower_${userId}_${page}_${i}`,
      username: `follower_${i}`,
      avatar: 'https://example.com/avatar.jpg',
    }));
  }
}

// ==================== POST SERVICE INTEGRATION ====================

@Injectable()
export class EnhancedPostService {
  private readonly logger = new Logger(EnhancedPostService.name);

  constructor(
    private readonly cacheService: RedisCacheService,
    private readonly cacheUtils: CacheUtils,
  ) {}

  // Cache individual posts
  @Cacheable('{{postId}}', 'POST')
  async getPostById(postId: string) {
    this.logger.debug(`Fetching post from database: ${postId}`);
    // Your existing post fetching logic
    return {
      id: postId,
      content: 'Sample post content',
      authorId: 'user123',
      likesCount: 42,
      commentsCount: 15,
      createdAt: new Date(),
    };
  }

  // Create post with cache invalidation
  @CacheEvict([
    'user:feed:*', // Invalidate all user feeds
    'post:list:{{authorId}}:*', // Invalidate author's post lists
    'trending:posts:*', // Invalidate trending posts
  ])
  async createPost(authorId: string, postData: any) {
    this.logger.debug(`Creating post for user: ${authorId}`);

    const newPost = {
      id: `post_${Date.now()}`,
      ...postData,
      authorId,
      createdAt: new Date(),
    };

    // Your existing post creation logic here

    // Immediately cache the new post
    await this.cacheUtils.cachePost(newPost.id, newPost);

    return newPost;
  }

  // Cache user posts with pagination
  async getUserPosts(userId: string, page: number = 1, limit: number = 20) {
    // Check cache first
    const cachedPosts = await this.cacheUtils.getCachedUserPosts(
      userId,
      page,
      limit,
    );
    if (cachedPosts) {
      return cachedPosts;
    }

    // Fetch from database
    const posts = await this.fetchUserPostsFromDB(userId, page, limit);

    // Cache the result
    await this.cacheUtils.cacheUserPosts(userId, posts, page, limit);

    return posts;
  }

  // Cache trending posts
  async getTrendingPosts(timeframe: 'day' | 'week' | 'month' = 'day') {
    // Check cache first
    const cachedTrending =
      await this.cacheUtils.getCachedTrendingPosts(timeframe);
    if (cachedTrending) {
      return cachedTrending;
    }

    // Calculate trending posts (expensive operation)
    const trendingPosts = await this.calculateTrendingPosts(timeframe);

    // Cache with appropriate TTL based on timeframe
    await this.cacheUtils.cacheTrendingPosts(trendingPosts, timeframe);

    return trendingPosts;
  }

  private async fetchUserPostsFromDB(
    userId: string,
    page: number,
    limit: number,
  ) {
    // Simulate database fetch
    return Array.from({ length: Math.min(limit, 10) }, (_, i) => ({
      id: `post_${userId}_${page}_${i}`,
      content: `Post ${i + 1} content`,
      authorId: userId,
      createdAt: new Date(Date.now() - i * 86400000), // Days ago
    }));
  }

  private async calculateTrendingPosts(timeframe: string) {
    // Simulate expensive trending calculation
    return [
      { id: 'trending1', content: 'Viral post 1', score: 1000 },
      { id: 'trending2', content: 'Viral post 2', score: 850 },
    ];
  }
}

// ==================== FEED SERVICE INTEGRATION ====================

@Injectable()
export class EnhancedFeedService {
  private readonly logger = new Logger(EnhancedFeedService.name);

  constructor(
    private readonly cacheService: RedisCacheService,
    private readonly cacheUtils: CacheUtils,
  ) {}

  // Cache user feeds with compression (feeds can be large)
  async getUserFeed(userId: string, page: number = 1, limit: number = 20) {
    // Check cache first
    const cachedFeed = await this.cacheUtils.getCachedUserFeed(
      userId,
      page,
      limit,
    );
    if (cachedFeed) {
      return cachedFeed;
    }

    // Generate feed (complex operation)
    const feed = await this.generateUserFeed(userId, page, limit);

    // Cache with compression
    await this.cacheUtils.cacheUserFeed(userId, feed, page, limit);

    return feed;
  }

  // Invalidate feed when user follows someone
  @CacheEvict(['user:feed:{{userId}}:*'])
  async followUser(userId: string, targetUserId: string) {
    this.logger.debug(`User ${userId} following user ${targetUserId}`);
    // Your existing follow logic
    return { userId, targetUserId, followedAt: new Date() };
  }

  private async generateUserFeed(userId: string, page: number, limit: number) {
    // Simulate complex feed generation
    return Array.from({ length: limit }, (_, i) => ({
      id: `feed_item_${userId}_${page}_${i}`,
      type: 'post',
      content: `Feed item ${i + 1}`,
      timestamp: new Date(Date.now() - i * 3600000), // Hours ago
    }));
  }
}

// ==================== SEARCH SERVICE INTEGRATION ====================

@Injectable()
export class EnhancedSearchService {
  private readonly logger = new Logger(EnhancedSearchService.name);

  constructor(
    private readonly cacheService: RedisCacheService,
    private readonly cacheUtils: CacheUtils,
  ) {}

  // Cache search results
  async search(
    query: string,
    type: 'users' | 'posts' | 'all' = 'all',
    page: number = 1,
  ) {
    // Check cache first
    const cachedResults = await this.cacheUtils.getCachedSearchResults(
      query,
      type,
      page,
    );
    if (cachedResults) {
      return cachedResults;
    }

    // Perform search
    const results = await this.performSearch(query, type, page);

    // Cache results
    await this.cacheUtils.cacheSearchResults(query, results, type, page);

    return results;
  }

  // Cache popular searches
  async getPopularSearches() {
    const cached = await this.cacheUtils.getCachedPopularSearches();
    if (cached) {
      return cached;
    }

    const popular = await this.calculatePopularSearches();
    await this.cacheUtils.cachePopularSearches(popular);

    return popular;
  }

  private async performSearch(query: string, type: string, page: number) {
    // Simulate search logic
    return {
      query,
      type,
      results: [
        { id: '1', title: `Result for ${query}`, type: 'post' },
        { id: '2', title: `Another result for ${query}`, type: 'user' },
      ],
      total: 25,
      page,
    };
  }

  private async calculatePopularSearches() {
    return [
      { query: 'javascript', count: 1500 },
      { query: 'react', count: 1200 },
      { query: 'nodejs', count: 980 },
    ];
  }
}

// ==================== AUTH SERVICE INTEGRATION ====================

@Injectable()
export class EnhancedAuthService {
  private readonly logger = new Logger(EnhancedAuthService.name);

  constructor(
    private readonly cacheService: RedisCacheService,
    private readonly cacheUtils: CacheUtils,
  ) {}

  // Cache user session
  async createSession(userId: string, sessionData: any) {
    const expiresIn = 3600; // 1 hour

    // Cache session
    await this.cacheUtils.cacheUserSession(userId, sessionData, expiresIn);

    // Cache user permissions for quick access
    const permissions = await this.getUserPermissions(userId);
    await this.cacheUtils.cacheUserPermissions(userId, permissions);

    return sessionData;
  }

  // Get cached session
  async getSession(userId: string) {
    return this.cacheUtils.getCachedUserSession(userId);
  }

  // Invalidate session and related auth data
  @CacheEvict([
    'auth:session:{{userId}}',
    'auth:permissions:{{userId}}',
    'user:profile:{{userId}}', // Also clear profile to force re-auth
  ])
  async logout(userId: string) {
    this.logger.debug(`Logging out user: ${userId}`);
    return { userId, loggedOutAt: new Date() };
  }

  private async getUserPermissions(userId: string): Promise<string[]> {
    // Your permission logic here
    return ['read', 'write', 'delete'];
  }
}

// ==================== USAGE IN CONTROLLERS ====================

/**
 * Example Controller Integration:
 *
 * @Controller('users')
 * export class UsersController {
 *   constructor(private readonly enhancedUserService: EnhancedUserService) {}
 *
 *   @Get(':id')
 *   async getUser(@Param('id') id: string) {
 *     return this.enhancedUserService.getUserById(id);
 *   }
 *
 *   @Put(':id')
 *   async updateUser(@Param('id') id: string, @Body() updateData: any) {
 *     return this.enhancedUserService.updateUser(id, updateData);
 *   }
 *
 *   @Get(':id/followers')
 *   async getUserFollowers(
 *     @Param('id') id: string,
 *     @Query('page') page: number = 1,
 *     @Query('limit') limit: number = 20,
 *   ) {
 *     return this.enhancedUserService.getUserFollowers(id, page, limit);
 *   }
 * }
 */
