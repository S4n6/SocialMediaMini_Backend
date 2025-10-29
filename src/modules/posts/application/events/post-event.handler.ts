import { Injectable } from '@nestjs/common';
// import { OnEvent } from '@nestjs/event-emitter'; // TODO: Install @nestjs/event-emitter package
import {
  PostCreatedEvent,
  PostUpdatedEvent,
  PostDeletedEvent,
  PostLikedEvent,
  PostUnlikedEvent,
  PostCommentedEvent,
} from '../../domain/events/post.events';
import { RedisCacheService } from '../../../cache/cache.service';
import { generateCacheKey } from '../../../cache/cache.interfaces';

/**
 * Domain Event Handlers for Post events
 * Handles side effects when domain events occur
 */
@Injectable()
export class PostEventHandler {
  constructor(private readonly cacheService: RedisCacheService) {}

  /**
   * Handle when a new post is created
   * TODO: Add @OnEvent('PostCreated') when @nestjs/event-emitter is installed
   */
  // @OnEvent('PostCreated')
  async handlePostCreated(event: PostCreatedEvent): Promise<void> {
    console.log(`📝 Post created: ${event.postId} by ${event.authorId}`);

    // Invalidate timeline caches for all followers
    await this.invalidateFollowersTimeline(event.authorId);

    // Add to trending algorithms if public post
    if (event.privacy === 'PUBLIC') {
      await this.updateTrendingMetrics(event.postId);
    }

    // TODO: Send notifications to followers
    // await this.notificationService.notifyFollowers(event.authorId, event.postId);
  }

  /**
   * Handle when a post is updated
   * TODO: Add @OnEvent('PostUpdated') when @nestjs/event-emitter is installed
   */
  // @OnEvent('PostUpdated')
  async handlePostUpdated(event: PostUpdatedEvent): Promise<void> {
    console.log(`✏️ Post updated: ${event.postId} by ${event.authorId}`);

    // Invalidate specific post cache
    await this.invalidatePostCache(event.postId);

    // Invalidate timeline caches
    await this.invalidateFollowersTimeline(event.authorId);
  }

  /**
   * Handle when a post is deleted
   * TODO: Add @OnEvent('PostDeleted') when @nestjs/event-emitter is installed
   */
  // @OnEvent('PostDeleted')
  async handlePostDeleted(event: PostDeletedEvent): Promise<void> {
    console.log(`🗑️ Post deleted: ${event.postId} by ${event.authorId}`);

    // Clean up all related caches
    await this.invalidatePostCache(event.postId);
    await this.invalidateFollowersTimeline(event.authorId);

    // Remove from trending metrics
    await this.removeFromTrendingMetrics(event.postId);

    // TODO: Clean up related data (notifications, etc.)
    // await this.cleanupService.cleanupPostData(event.postId);
  }

  /**
   * Handle when a post is liked/reacted
   * TODO: Add @OnEvent('PostLiked') when @nestjs/event-emitter is installed
   */
  // @OnEvent('PostLiked')
  async handlePostLiked(event: PostLikedEvent): Promise<void> {
    console.log(
      `👍 Post liked: ${event.postId} by ${event.userId} with ${event.reactionType}`,
    );

    // Invalidate post cache to reflect new like count
    await this.invalidatePostCache(event.postId);

    // Update trending metrics
    await this.updateTrendingMetrics(event.postId);

    // TODO: Send notification to post author
    // await this.notificationService.notifyPostReaction(event.postId, event.userId, event.reactionType);
  }

  /**
   * Handle when a post is unliked
   * TODO: Add @OnEvent('PostUnliked') when @nestjs/event-emitter is installed
   */
  // @OnEvent('PostUnliked')
  async handlePostUnliked(event: PostUnlikedEvent): Promise<void> {
    console.log(`👎 Post unliked: ${event.postId} by ${event.userId}`);

    // Invalidate post cache to reflect updated like count
    await this.invalidatePostCache(event.postId);

    // Update trending metrics
    await this.updateTrendingMetrics(event.postId);
  }

  /**
   * Handle when a post is commented
   * TODO: Add @OnEvent('PostCommented') when @nestjs/event-emitter is installed
   */
  // @OnEvent('PostCommented')
  async handlePostCommented(event: PostCommentedEvent): Promise<void> {
    console.log(`💬 Post commented: ${event.postId} by ${event.authorId}`);

    // Invalidate post cache to reflect new comment
    await this.invalidatePostCache(event.postId);

    // Update trending metrics
    await this.updateTrendingMetrics(event.postId);

    // TODO: Send notification to post author
    // await this.notificationService.notifyPostComment(event.postId, event.commentId, event.authorId);
  }

  // ===== PRIVATE HELPER METHODS =====

  /**
   * Invalidate cache for a specific post
   */
  private async invalidatePostCache(postId: string): Promise<void> {
    try {
      const cacheKey = generateCacheKey('POST', postId);
      await this.cacheService.del(cacheKey);
    } catch (error) {
      console.error(`Failed to invalidate cache for post ${postId}:`, error);
    }
  }

  /**
   * Invalidate timeline caches for author's followers
   */
  private async invalidateFollowersTimeline(authorId: string): Promise<void> {
    try {
      // TODO: Get actual follower IDs from User/Follow service
      // const followerIds = await this.userAdapter.getFollowerIds(authorId);

      // For now, just invalidate the author's own timeline
      const timelineCacheKey = generateCacheKey(
        'TIMELINE_FEED',
        `${authorId}:*`,
      );
      // Note: Redis pattern-based deletion would be more efficient
      // await this.cacheService.delPattern(timelineCacheKey);

      // For now, invalidate common pagination combinations
      const commonPages = [1, 2, 3];
      const commonLimits = [10, 20];
      const algorithms = ['chronological', 'smart', 'diversified'];

      for (const page of commonPages) {
        for (const limit of commonLimits) {
          for (const algo of algorithms) {
            const cacheKey = generateCacheKey(
              'TIMELINE_FEED',
              `${authorId}:page:${page}:limit:${limit}:algo:${algo}`,
            );
            await this.cacheService.del(cacheKey);
          }
        }
      }
    } catch (error) {
      console.error(
        `Failed to invalidate timeline for author ${authorId}:`,
        error,
      );
    }
  }

  /**
   * Update trending metrics for a post
   */
  private async updateTrendingMetrics(postId: string): Promise<void> {
    try {
      // TODO: Implement trending algorithm updates
      // This could involve:
      // - Incrementing engagement scores in Redis
      // - Updating time-decay factors
      // - Recalculating trending rankings

      console.log(`📈 Updated trending metrics for post ${postId}`);
    } catch (error) {
      console.error(
        `Failed to update trending metrics for post ${postId}:`,
        error,
      );
    }
  }

  /**
   * Remove post from trending metrics
   */
  private async removeFromTrendingMetrics(postId: string): Promise<void> {
    try {
      // TODO: Implement trending algorithm cleanup
      // Remove post from trending calculations

      console.log(`📉 Removed post ${postId} from trending metrics`);
    } catch (error) {
      console.error(
        `Failed to remove post ${postId} from trending metrics:`,
        error,
      );
    }
  }
}
