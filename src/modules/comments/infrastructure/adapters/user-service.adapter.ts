/**
 * User Service Adapter
 *
 * This adapter implements the IUserDomainPort interface and calls the actual
 * UserService from the users module. It acts as an anti-corruption layer
 * between the comment domain and external user services.
 */

import { Injectable, Inject, Logger } from '@nestjs/common';
import { IUserDomainPort } from '../../domain/interfaces/domain-ports.interface';
import { CommentCacheService } from '../cache/comment-cache.service';

/**
 * Interface for the actual UserService from users module
 * This represents the external dependency that we're adapting
 */
interface ExternalUserService {
  findById(
    id: string,
  ): Promise<{ id: string; username: string; role: string } | null>;
  checkUserRole(userId: string, role: string): Promise<boolean>;
  getUsersByIds(
    ids: string[],
  ): Promise<
    Array<{ id: string; username: string; fullName: string; avatar?: string }>
  >;
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
export class UserServiceAdapter implements IUserDomainPort {
  private readonly logger = new Logger(UserServiceAdapter.name);

  private readonly config: AdapterConfig = {
    enableCaching: true,
    cacheTimeoutMs: 5 * 60 * 1000, // 5 minutes
    retryAttempts: 3,
    timeoutMs: 5000, // 5 seconds
  };

  constructor(
    private readonly cacheService: CommentCacheService,
    // This would be injected from UsersModule in a real implementation
    // @Inject('EXTERNAL_USER_SERVICE')
    // private readonly externalUserService: ExternalUserService,
  ) {}

  /**
   * Check if a user exists in the system
   * Adapts the external user service to our domain interface
   */
  async exists(userId: string): Promise<boolean> {
    try {
      const cacheKey = CommentCacheService.userKey(userId, 'exists');

      return await this.cacheService.getOrSet(cacheKey, async () => {
        // TODO: Real implementation would call external service
        // const user = await this.callWithRetry(() => this.externalUserService.findById(userId));
        // return user !== null;

        // Mock implementation for now
        return this.mockUserExists(userId);
      });
    } catch (error) {
      this.logger.error(`Error checking if user ${userId} exists:`, error);
      return false;
    }
  }

  /**
   * Check if a user has admin privileges
   * Adapts the external user service role check to our domain interface
   */
  async isAdmin(userId: string): Promise<boolean> {
    try {
      const cacheKey = CommentCacheService.userKey(userId, 'admin');

      return await this.cacheService.getOrSet(cacheKey, async () => {
        // TODO: Real implementation would call external service
        // return await this.callWithRetry(() => this.externalUserService.checkUserRole(userId, 'admin'));

        // Mock implementation for now
        return this.mockUserIsAdmin(userId);
      });
    } catch (error) {
      this.logger.error(`Error checking if user ${userId} is admin:`, error);
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

  /**
   * Find user by ID with enhanced error handling and caching
   */
  async findUserById(
    userId: string,
  ): Promise<{ id: string; username: string } | null> {
    try {
      const cacheKey = CommentCacheService.userKey(userId, 'info');

      return await this.cacheService.getOrSet(cacheKey, async () => {
        // TODO: Real implementation would call external service
        // return await this.callWithRetry(() => this.externalUserService.findById(userId));

        // Mock implementation for testing
        return this.mockFindUserById(userId);
      });
    } catch (error) {
      this.logger.error(`Failed to find user ${userId}:`, error);
      throw new Error(`Unable to retrieve user information for ${userId}`);
    }
  }

  // ========== MOCK IMPLEMENTATIONS (TO BE REMOVED) ==========

  private async mockUserExists(userId: string): Promise<boolean> {
    // Mock: assume all non-empty user IDs exist
    return Boolean(userId && userId.trim().length > 0);
  }

  private async mockUserIsAdmin(userId: string): Promise<boolean> {
    // Mock: assume users with 'admin' in their ID are admins
    return userId.toLowerCase().includes('admin');
  }

  private mockFindUserById(
    userId: string,
  ): { id: string; username: string } | null {
    // Mock implementation for testing
    if (userId === 'user1') {
      return { id: 'user1', username: 'johndoe' };
    }
    if (userId === 'admin1') {
      return { id: 'admin1', username: 'admin' };
    }
    return null;
  }
}
