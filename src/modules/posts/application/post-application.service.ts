import { Injectable } from '@nestjs/common';
import { CreatePostUseCase } from './use-cases/create-post.use-case';
import { UpdatePostUseCase } from './use-cases/update-post.use-case';
import { DeletePostUseCase } from './use-cases/delete-post.use-case';
import {
  GetPostByIdUseCase,
  GetPostsUseCase,
  GetTimelineFeedUseCase,
} from './use-cases/get-post.use-case';
import { RedisCacheService } from '../../cache/cache.service';
import { generateCacheKey, getCacheTTL } from '../../cache/cache.interfaces';

import {
  CreatePostDto,
  UpdatePostDto,
  GetPostsQueryDto,
  GetTimelineFeedDto,
  PostResponseDto,
  PostDetailResponseDto,
  PostListResponseDto,
} from './dto/post.dto';

/**
 * Application Service for Post domain
 * Coordinates use cases and provides a clean interface for controllers
 */
@Injectable()
export class PostApplicationService {
  constructor(
    // Post management use cases
    private readonly createPostUseCase: CreatePostUseCase,
    private readonly updatePostUseCase: UpdatePostUseCase,
    private readonly deletePostUseCase: DeletePostUseCase,

    // Post retrieval use cases
    private readonly getPostByIdUseCase: GetPostByIdUseCase,
    private readonly getPostsUseCase: GetPostsUseCase,
    private readonly getTimelineFeedUseCase: GetTimelineFeedUseCase,

    // Cache service
    private readonly cacheService: RedisCacheService,
  ) {}

  // ===== POST MANAGEMENT =====

  async createPost(
    authorId: string,
    dto: CreatePostDto,
  ): Promise<PostResponseDto> {
    const result = await this.createPostUseCase.execute(authorId, dto);

    // Invalidate user's timeline feed cache after creating a new post
    await this.invalidateTimelineFeedCache(authorId);

    return this.enrichPostResponse(result);
  }

  async updatePost(
    postId: string,
    userId: string,
    dto: UpdatePostDto,
  ): Promise<PostResponseDto> {
    const result = await this.updatePostUseCase.execute(postId, userId, dto);

    // Invalidate user's timeline feed cache after updating a post
    await this.invalidateTimelineFeedCache(userId);

    return this.enrichPostResponse(result);
  }

  async deletePost(
    postId: string,
    userId: string,
    userRole?: string,
  ): Promise<void> {
    const result = await this.deletePostUseCase.execute(
      postId,
      userId,
      userRole,
    );

    // Invalidate user's timeline feed cache after deleting a post
    await this.invalidateTimelineFeedCache(userId);

    return result;
  }

  // ===== POST RETRIEVAL =====

  async getPostById(
    postId: string,
    viewerId?: string,
    isFollowing?: boolean,
  ): Promise<PostDetailResponseDto> {
    const result = await this.getPostByIdUseCase.execute(
      postId,
      viewerId,
      isFollowing,
    );
    return this.enrichPostDetailResponse(result);
  }

  async getPosts(
    query: GetPostsQueryDto,
    viewerId?: string,
  ): Promise<PostListResponseDto> {
    const result = await this.getPostsUseCase.execute(query, viewerId);

    // Enrich each post with user information
    const enrichedPosts = await Promise.all(
      result.posts.map((post) => this.enrichPostResponse(post)),
    );

    return {
      ...result,
      posts: enrichedPosts,
    };
  }

  async getTimelineFeed(
    userId: string,
    dto: GetTimelineFeedDto,
  ): Promise<PostListResponseDto> {
    // Generate cache key with user ID and pagination params
    const cacheKey = generateCacheKey(
      'TIMELINE_FEED',
      `${userId}:page:${dto.page || 1}:limit:${dto.limit || 10}`,
    );

    // Try to get from cache first
    const cachedResult = await this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const result = await this.getTimelineFeedUseCase.execute(
          userId,
          dto.page || 1,
          dto.limit || 10,
        );

        // Enrich each post with user information
        const enrichedPosts = await Promise.all(
          result.posts.map((post) => this.enrichPostResponse(post)),
        );

        return {
          ...result,
          posts: enrichedPosts,
        };
      },
      getCacheTTL('TIMELINE_FEED'), // 5 minutes as defined in cache config
    );

    return cachedResult;
  }

  // ===== CACHE MANAGEMENT =====

  /**
   * Invalidate user's timeline feed cache when posts change
   */
  private async invalidateTimelineFeedCache(userId: string): Promise<void> {
    try {
      // Since we cache with pagination params, we need to invalidate multiple keys
      // For simplicity, we'll use a pattern-based approach or clear specific common combinations
      const commonPages = [1, 2, 3]; // Most common pages
      const commonLimits = [10, 20]; // Common limits
      const feedTypes = ['timeline', 'following', 'trending'];

      for (const page of commonPages) {
        for (const limit of commonLimits) {
          for (const feedType of feedTypes) {
            const cacheKey = generateCacheKey(
              'TIMELINE_FEED',
              `${userId}:page:${page}:limit:${limit}:type:${feedType}`,
            );
            await this.cacheService.del(cacheKey);
          }
        }
      }
    } catch (error) {
      // Log error but don't fail the operation
      console.error('Failed to invalidate timeline feed cache:', error);
    }
  }

  // ===== PRIVATE HELPER METHODS =====

  /**
   * Enriches post response with additional user information
   * In a real implementation, this would fetch user data from UserApplicationService
   */
  private enrichPostResponse(post: PostResponseDto): Promise<PostResponseDto> {
    // TODO: Integrate with UserApplicationService to fetch user details
    // For now, return the post as-is (wrapped in a resolved promise to keep callers consistent)
    return Promise.resolve({
      ...post,
      author: {
        ...post.author,
        fullName: 'User ' + post.author.id.substring(0, 8), // Placeholder
        username: '@user' + post.author.id.substring(0, 4), // Placeholder
      },
    });
  }

  /**
   * Enriches post detail response with additional user information
   */
  private enrichPostDetailResponse(
    post: PostDetailResponseDto,
  ): Promise<PostDetailResponseDto> {
    // TODO: Integrate with UserApplicationService to fetch user details
    const enrichedComments = post.comments.map((comment) => ({
      ...comment,
      authorFullName: 'User ' + comment.authorId.substring(0, 8), // Placeholder
    }));

    const enrichedReactions = post.reactions.map((reaction) => ({
      ...reaction,
      userFullName: 'User ' + reaction.userId.substring(0, 8), // Placeholder
    }));

    return Promise.resolve({
      ...post,
      author: {
        ...post.author,
        fullName: 'User ' + post.author.id.substring(0, 8), // Placeholder
        username: '@user' + post.author.id.substring(0, 4), // Placeholder
      },
      comments: enrichedComments,
      reactions: enrichedReactions,
    });
  }
}
