import { Injectable, Logger } from '@nestjs/common';
import { RedisCacheService } from './cache.service';
import { CacheUtils } from './cache.utils';

/**
 * Ví dụ đơn giản cách sử dụng Cache Module
 * Phù hợp cho fresher để học cách implement caching
 */
@Injectable()
export class CacheExampleService {
  private readonly logger = new Logger(CacheExampleService.name);

  constructor(
    private readonly cacheService: RedisCacheService,
    private readonly cacheUtils: CacheUtils,
  ) {}

  /**
   * Ví dụ 1: Cache user profile
   */
  async getUserProfileExample(userId: string) {
    this.logger.log(`Getting profile for user ${userId}`);

    // Sử dụng utility method (recommended)
    const cachedProfile = await this.cacheUtils.getCachedUserProfile(userId);

    if (cachedProfile) {
      this.logger.log(`Found cached profile for user ${userId}`);
      return cachedProfile;
    }

    // Simulate DB query
    const profileFromDB = {
      id: userId,
      name: 'John Doe',
      email: 'john@example.com',
      avatar: 'avatar.jpg',
      createdAt: new Date(),
    };

    // Cache the result
    await this.cacheUtils.cacheUserProfile(userId, profileFromDB);
    this.logger.log(`Cached profile for user ${userId}`);

    return profileFromDB;
  }

  /**
   * Ví dụ 2: Cache với getOrSet (recommended pattern)
   */
  async getPostExample(postId: string) {
    return await this.cacheService.getOrSet(
      `post:${postId}`,
      async () => {
        // Simulate DB query
        this.logger.log(`Fetching post ${postId} from DB`);
        return {
          id: postId,
          title: 'Sample Post',
          content: 'This is a sample post content',
          authorId: 'user123',
          createdAt: new Date(),
        };
      },
      600, // Cache for 10 minutes
    );
  }

  /**
   * Ví dụ 3: Cache timeline feed với pagination
   */
  async getTimelineFeedExample(userId: string, page: number = 1) {
    // Check cache first
    const cachedFeed = await this.cacheUtils.getCachedTimelineFeed(
      userId,
      page,
    );

    if (cachedFeed) {
      this.logger.log(`Found cached feed for user ${userId}, page ${page}`);
      return cachedFeed;
    }

    // Simulate DB query for feed
    const feedFromDB = Array.from({ length: 10 }, (_, index) => ({
      id: `post_${page}_${index}`,
      title: `Post ${page * 10 + index}`,
      content: `Content for post ${page * 10 + index}`,
      authorId: `user_${index}`,
      createdAt: new Date(),
    }));

    // Cache the feed
    await this.cacheUtils.cacheTimelineFeed(userId, feedFromDB, page);
    this.logger.log(`Cached timeline feed for user ${userId}, page ${page}`);

    return feedFromDB;
  }

  /**
   * Ví dụ 4: Invalidate cache khi có update
   */
  async updateUserProfileExample(userId: string, updateData: any) {
    // Simulate DB update
    this.logger.log(`Updating profile for user ${userId}`);
    const updatedProfile = {
      id: userId,
      ...updateData,
      updatedAt: new Date(),
    };

    // Invalidate old cache
    await this.cacheUtils.invalidateUserProfile(userId);
    this.logger.log(`Invalidated cache for user ${userId}`);

    // Optionally pre-cache the new data
    await this.cacheUtils.cacheUserProfile(userId, updatedProfile);

    return updatedProfile;
  }

  /**
   * Ví dụ 5: Batch operations
   */
  async createNewPostExample(userId: string, postData: any) {
    const newPost = {
      id: `post_${Date.now()}`,
      ...postData,
      authorId: userId,
      createdAt: new Date(),
    };

    // Simulate saving to DB
    this.logger.log(`Creating new post ${newPost.id} for user ${userId}`);

    // Cache the new post
    await this.cacheUtils.cachePost(newPost.id, newPost);

    // Invalidate user's timeline feed since they have a new post
    await this.cacheUtils.invalidateTimelineFeed(userId);

    this.logger.log(
      `Created and cached post ${newPost.id}, invalidated user feed`,
    );

    return newPost;
  }

  /**
   * Ví dụ 6: Search với cache
   */
  async searchUsersExample(query: string) {
    // Check cache first
    const cachedResults = await this.cacheUtils.getCachedSearchResults(
      query,
      'users',
    );

    if (cachedResults) {
      this.logger.log(`Found cached search results for query: ${query}`);
      return cachedResults;
    }

    // Simulate search in DB
    const searchResults = [
      { id: 'user1', name: `${query} User 1`, email: `${query}1@example.com` },
      { id: 'user2', name: `${query} User 2`, email: `${query}2@example.com` },
    ];

    // Cache the results
    await this.cacheUtils.cacheSearchResults(query, searchResults, 'users');
    this.logger.log(`Cached search results for query: ${query}`);

    return searchResults;
  }

  /**
   * Ví dụ 7: Manual cache với custom TTL
   */
  async getTemporaryDataExample(key: string) {
    return await this.cacheService.getOrSet(
      `temp:${key}`,
      async () => {
        this.logger.log(`Generating temporary data for ${key}`);
        return {
          data: `Temporary data for ${key}`,
          generatedAt: new Date(),
          expiresIn: '5 minutes',
        };
      },
      300, // Cache for only 5 minutes
    );
  }

  /**
   * Ví dụ 8: Check cache existence
   */
  async checkCacheStatusExample(userId: string) {
    const profileExists = await this.cacheService.exists(
      `user:profile:${userId}`,
    );
    const feedExists = await this.cacheService.exists(
      `user:feed:${userId}:page:1`,
    );

    return {
      profileCached: profileExists,
      feedCached: feedExists,
      timestamp: new Date(),
    };
  }
}
