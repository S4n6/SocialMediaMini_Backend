import { Injectable } from '@nestjs/common';
import { CreatePostUseCase } from './use-cases/create-post.use-case';
import { UpdatePostUseCase } from './use-cases/update-post.use-case';
import { DeletePostUseCase } from './use-cases/delete-post.use-case';
import { GetPostByIdUseCase } from './use-cases/get-post-by-id.use-case';
import { GetPostsUseCase } from './use-cases/get-posts.use-case';
import { GetTimelineFeedUseCase } from './use-cases/get-timeline-feed.use-case';
import { RedisCacheService } from '../../cache/cache.service';
import { generateCacheKey, getCacheTTL } from '../../cache/cache.interfaces';
import { PostEnrichmentService } from './services/post-enrichment.service';

import {
  CreatePostDto,
  UpdatePostDto,
  GetPostsQueryDto,
  GetTimelineFeedDto,
  PostResponseDto,
  PostDetailResponseDto,
  PostListResponseDto,
  CursorPaginatedPostsResponseDto,
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

    // Enrichment service
    private readonly postEnrichmentService: PostEnrichmentService,
  ) {}

  // ===== POST MANAGEMENT =====

  async createPost(
    authorId: string,
    dto: CreatePostDto,
  ): Promise<PostResponseDto> {
    const result = await this.createPostUseCase.execute(authorId, dto);

    // Invalidate user's timeline feed cache after creating a new post
    await this.invalidateTimelineFeedCache(authorId);

    return this.postEnrichmentService.enrichPost(result);
  }

  async updatePost(
    postId: string,
    userId: string,
    dto: UpdatePostDto,
  ): Promise<PostResponseDto> {
    const result = await this.updatePostUseCase.execute(postId, userId, dto);

    // Invalidate user's timeline feed cache after updating a post
    await this.invalidateTimelineFeedCache(userId);

    return this.postEnrichmentService.enrichPost(result);
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
    return this.postEnrichmentService.enrichDetailedPost(result);
  }

  async getPosts(
    query: GetPostsQueryDto,
    viewerId?: string,
  ): Promise<PostListResponseDto> {
    const result = await this.getPostsUseCase.execute(query, viewerId);

    // Enrich each post with user information
    const enrichedPosts = await this.postEnrichmentService.enrichPosts(
      result.posts,
    );

    return {
      ...result,
      posts: enrichedPosts,
    };
  }

  async getTimelineFeed(
    userId: string,
    dto: GetTimelineFeedDto,
  ): Promise<CursorPaginatedPostsResponseDto> {
    const limit = dto.limit || 10;
    const cursor = dto.cursor || null;
    const algorithm = dto.algorithm || 'chronological';

    // Generate cache key with cursor (deterministic per scroll position)
    const cacheKey = generateCacheKey(
      'TIMELINE_FEED',
      `${userId}:cursor:${cursor ?? 'initial'}:limit:${limit}:algo:${algorithm}`,
    );

    const cachedResult = await this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const result = await this.getTimelineFeedUseCase.execute(
          userId,
          limit,
          cursor,
          algorithm,
        );

        // Enrich each post with user information
        const enrichedPosts = await this.postEnrichmentService.enrichPosts(
          result.data,
        );

        return {
          ...result,
          data: enrichedPosts,
        };
      },
      getCacheTTL('TIMELINE_FEED'), // 5 minutes as defined in cache config
    );

    return cachedResult;
  }

  // ===== CACHE MANAGEMENT =====

  /**
   * Invalidate user's timeline feed cache when posts change.
   * With cursor pagination we only need to bust the initial page
   * (cursor=null) since subsequent pages are fetched on-demand
   * and will naturally pick up changes.
   */
  private async invalidateTimelineFeedCache(userId: string): Promise<void> {
    try {
      const commonLimits = [10, 20];
      const algorithms = ['chronological', 'smart', 'diversified'];

      for (const limit of commonLimits) {
        for (const algo of algorithms) {
          const cacheKey = generateCacheKey(
            'TIMELINE_FEED',
            `${userId}:cursor:initial:limit:${limit}:algo:${algo}`,
          );
          await this.cacheService.del(cacheKey);
        }
      }
    } catch (error) {
      // Log error but don't fail the operation
      console.error('Failed to invalidate timeline feed cache:', error);
    }
  }
}
