import { Injectable, Logger } from '@nestjs/common';
import { RedisCacheService } from '../../cache/cache.service';
import { SEARCH_HISTORY_CONSTANTS } from '../interfaces/search-history.interface';

interface SearchHistoryEntry {
  userId: string;
  timestamp: number;
}

@Injectable()
export class SearchHistoryRepository {
  private readonly logger = new Logger(SearchHistoryRepository.name);

  constructor(private readonly cacheService: RedisCacheService) {}

  /**
   * Add user to search history using regular cache operations (fallback)
   */
  async addToSearchHistory(
    currentUserId: string,
    searchedUserId: string,
  ): Promise<void> {
    try {
      const key = this.generateCacheKey(currentUserId);
      const timestamp = Date.now();

      // Get existing history
      const existingHistory =
        (await this.cacheService.get<SearchHistoryEntry[]>(key)) || [];

      // Remove if already exists (to update timestamp)
      const filteredHistory = existingHistory.filter(
        (item) => item.userId !== searchedUserId,
      );

      // Add new entry at the beginning
      const newHistory = [
        { userId: searchedUserId, timestamp },
        ...filteredHistory,
      ];

      // Keep only MAX_HISTORY_ITEMS
      const limitedHistory = newHistory.slice(
        0,
        SEARCH_HISTORY_CONSTANTS.MAX_HISTORY_ITEMS,
      );

      // Save back to cache
      await this.cacheService.set(
        key,
        limitedHistory,
        SEARCH_HISTORY_CONSTANTS.CACHE_TTL_SECONDS,
      );

      this.logger.log('Added to search history (fallback):', {
        currentUserId,
        searchedUserId,
        timestamp,
        totalItems: limitedHistory.length,
      });
    } catch (error) {
      this.logger.error(
        `Failed to add to search history: ${error.message}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get search history (most recent first)
   */
  async getSearchHistory(
    currentUserId: string,
  ): Promise<{ userId: string; timestamp: number }[]> {
    try {
      const key = this.generateCacheKey(currentUserId);
      const history = await this.cacheService.get<SearchHistoryEntry[]>(key);

      if (!history || !Array.isArray(history)) {
        return [];
      }

      // Sort by timestamp descending (most recent first)
      return history.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      this.logger.error(
        `Failed to get search history: ${error.message}`,
        error,
      );
      return [];
    }
  }

  /**
   * Remove specific user from search history
   */
  async removeFromSearchHistory(
    currentUserId: string,
    searchedUserId: string,
  ): Promise<void> {
    try {
      const key = this.generateCacheKey(currentUserId);
      const existingHistory =
        (await this.cacheService.get<SearchHistoryEntry[]>(key)) || [];

      // Filter out the user
      const filteredHistory = existingHistory.filter(
        (item) => item.userId !== searchedUserId,
      );

      // Save back to cache
      await this.cacheService.set(
        key,
        filteredHistory,
        SEARCH_HISTORY_CONSTANTS.CACHE_TTL_SECONDS,
      );
    } catch (error) {
      this.logger.error(
        `Failed to remove from search history: ${error.message}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Clear all search history for user
   */
  async clearSearchHistory(currentUserId: string): Promise<void> {
    try {
      const key = this.generateCacheKey(currentUserId);
      await this.cacheService.del(key);
    } catch (error) {
      this.logger.error(
        `Failed to clear search history: ${error.message}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Check if user exists in search history
   */
  async isUserInHistory(
    currentUserId: string,
    searchedUserId: string,
  ): Promise<boolean> {
    try {
      const key = this.generateCacheKey(currentUserId);
      const history =
        (await this.cacheService.get<SearchHistoryEntry[]>(key)) || [];

      return history.some((item) => item.userId === searchedUserId);
    } catch (error) {
      this.logger.error(
        `Failed to check user in history: ${error.message}`,
        error,
      );
      return false;
    }
  }

  /**
   * Get search history count
   */
  async getSearchHistoryCount(currentUserId: string): Promise<number> {
    try {
      const key = this.generateCacheKey(currentUserId);
      const history =
        (await this.cacheService.get<SearchHistoryEntry[]>(key)) || [];

      return history.length;
    } catch (error) {
      this.logger.error(
        `Failed to get search history count: ${error.message}`,
        error,
      );
      return 0;
    }
  }

  /**
   * Generate cache key for user's search history
   */
  private generateCacheKey(userId: string): string {
    return `${SEARCH_HISTORY_CONSTANTS.CACHE_KEY_PREFIX}${userId}`;
  }
}
