/**
 * Post Service Adapter
 *
 * This adapter implements the IPostDomainPort interface and calls the actual
 * PostService from the posts module. It acts as an anti-corruption layer
 * between the comment domain and external post services.
 */

import { Injectable, Inject, Logger } from '@nestjs/common';
import { IPostDomainPort } from '../../domain/interfaces/domain-ports.interface';
import { CommentCacheService } from '../cache/comment-cache.service';

/**
 * Interface for the actual PostService from posts module
 * This represents the external dependency that we're adapting
 */
interface ExternalPostService {
  findById(
    id: string,
  ): Promise<{ id: string; title: string; allowComments: boolean } | null>;
  getPostSettings(postId: string): Promise<{ allowComments: boolean }>;
  getPostsByIds(
    ids: string[],
  ): Promise<Array<{ id: string; title: string; authorId: string }>>;
}

/**
 * Configuration for adapter behavior
 */
interface AdapterConfig {
  enableCaching: boolean;
  cacheTimeoutMs: number;
  retryAttempts: number;
  timeoutMs: number;
}

@Injectable()
export class PostServiceAdapter implements IPostDomainPort {
  private readonly logger = new Logger(PostServiceAdapter.name);

  private readonly config: AdapterConfig = {
    enableCaching: true,
    cacheTimeoutMs: 5 * 60 * 1000, // 5 minutes
    retryAttempts: 3,
    timeoutMs: 5000, // 5 seconds
  };

  constructor(
    private readonly cacheService: CommentCacheService,
    // This would be injected from PostsModule in a real implementation
    // @Inject('EXTERNAL_POST_SERVICE')
    // private readonly externalPostService: ExternalPostService,
  ) {}

  /**
   * Check if a post exists in the system
   * Adapts the external post service to our domain interface
   */
  async exists(postId: string): Promise<boolean> {
    try {
      const cacheKey = CommentCacheService.postKey(postId, 'exists');

      return await this.cacheService.getOrSet(cacheKey, async () => {
        // TODO: Real implementation would call external service
        // const post = await this.callWithRetry(() => this.externalPostService.findById(postId));
        // return post !== null;

        // Mock implementation for now
        return this.mockPostExists(postId);
      });
    } catch (error) {
      this.logger.error(`Error checking if post ${postId} exists:`, error);
      return false;
    }
  }

  /**
   * Check if a post allows comments
   * Adapts the external post service settings check to our domain interface
   */
  async allowsComments(postId: string): Promise<boolean> {
    try {
      const cacheKey = CommentCacheService.postKey(postId, 'comments');

      return await this.cacheService.getOrSet(cacheKey, async () => {
        // TODO: Real implementation would call external service
        // const settings = await this.callWithRetry(() => this.externalPostService.getPostSettings(postId));
        // return settings.allowComments;

        // Mock implementation for now
        return this.mockPostAllowsComments(postId);
      });
    } catch (error) {
      this.logger.error(
        `Error checking if post ${postId} allows comments:`,
        error,
      );
      return false;
    }
  }

  // ========== UTILITY METHODS ==========

  /**
   * Call external service with retry logic
   */
  private async callWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        // Add timeout wrapper
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('Operation timeout')),
            this.config.timeoutMs,
          ),
        );

        const result = await Promise.race([operation(), timeoutPromise]);
        return result;
      } catch (error) {
        lastError = error as Error;
        this.logger.warn(
          `Attempt ${attempt}/${this.config.retryAttempts} failed:`,
          error,
        );

        if (attempt < this.config.retryAttempts) {
          // Exponential backoff
          const delay = Math.pow(2, attempt - 1) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  }

  // ========== MOCK IMPLEMENTATIONS (TO BE REMOVED) ==========

  private mockPostExists(postId: string): boolean {
    // Mock: assume all non-empty post IDs exist
    return Boolean(postId && postId.trim().length > 0);
  }

  private mockPostAllowsComments(postId: string): boolean {
    // Mock: assume all posts allow comments unless they have 'nocomment' in ID
    return !postId.toLowerCase().includes('nocomment');
  }
}
