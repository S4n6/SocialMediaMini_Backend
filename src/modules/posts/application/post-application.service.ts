import { Injectable, Logger } from '@nestjs/common';
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

  private readonly logger = new Logger(PostApplicationService.name);

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
    const limit = dto.limit ?? 10;
    const cursor = dto.cursor ?? null;
    const algorithm = dto.algorithm ?? 'chronological';

    // Generate a deterministic cache key per scroll position.
    const cacheKey = generateCacheKey(
      'TIMELINE_FEED',
      `${userId}:cursor:${cursor ?? 'initial'}:limit:${limit}:algo:${algorithm}`,
    );

    // Cache the *raw* (non-enriched) feed so that user-profile changes
    // (avatar, username) are reflected on the next enrichment pass rather
    // than being frozen for the full TTL window.
    const rawResult = await this.cacheService.getOrSet(
      cacheKey,
      () => this.getTimelineFeedUseCase.execute(userId, limit, cursor, algorithm),
      getCacheTTL('TIMELINE_FEED'),
    );

    // Enrich after cache retrieval — always reflects the latest user data.
    const enrichedPosts = await this.postEnrichmentService.enrichPosts(
      rawResult.data,
    );

    return {
      ...rawResult,
      data: enrichedPosts,
    };
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

      // Build all cache keys and delete them in parallel (single batch round-trip)
      // rather than issuing serial DEL commands in a nested loop.
      const deletePromises = commonLimits.flatMap((limit) =>
        algorithms.map((algo) => {
          const cacheKey = generateCacheKey(
            'TIMELINE_FEED',
            `${userId}:cursor:initial:limit:${limit}:algo:${algo}`,
          );
          return this.cacheService.del(cacheKey);
        }),
      );

      await Promise.all(deletePromises);
    } catch (error) {
      // Log but don't propagate — a cache invalidation failure must never
      // fail the originating write operation.
      this.logger.error(
        `Failed to invalidate timeline feed cache for user ${userId}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
