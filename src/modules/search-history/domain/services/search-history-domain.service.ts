import { Injectable } from '@nestjs/common';
import { SearchHistory } from '../search-history.entity';
import {
  InvalidUserIdException,
  SearchHistoryLimitExceededException,
} from '../search-history.exceptions';

/**
 * Domain service for SearchHistory business logic
 * Encapsulates complex domain rules that don't belong to a single entity
 */
@Injectable()
export class SearchHistoryDomainService {
  private readonly MAX_ENTRIES = 20;
  private readonly DUPLICATE_THRESHOLD_MS = 1000 * 60 * 5; // 5 minutes

  /**
   * Validates if a user can add a search entry
   */
  canAddSearchEntry(
    searchHistory: SearchHistory,
    searchedUserId: string,
  ): boolean {
    // Cannot add self to search history
    if (searchHistory.userId === searchedUserId) {
      return false;
    }

    return true;
  }

  /**
   * Validates if a user can view another user's search history
   */
  canViewSearchHistory(
    searchHistory: SearchHistory,
    viewerId: string,
  ): boolean {
    // Only the owner can view their search history
    return searchHistory.userId === viewerId;
  }

  /**
   * Validates if a user can modify search history
   */
  canModifySearchHistory(
    searchHistory: SearchHistory,
    userId: string,
  ): boolean {
    return searchHistory.userId === userId;
  }

  /**
   * Checks if adding an entry would exceed the limit
   */
  wouldExceedLimit(searchHistory: SearchHistory): boolean {
    return searchHistory.entriesCount >= this.MAX_ENTRIES;
  }

  /**
   * Checks if a search entry is considered a duplicate within the threshold
   */
  isDuplicateWithinThreshold(
    searchHistory: SearchHistory,
    searchedUserId: string,
    searchTime: Date,
  ): boolean {
    const existingEntry = searchHistory.entries.find(
      (entry) => entry.searchedUserId === searchedUserId,
    );

    if (!existingEntry) {
      return false;
    }

    const timeDiff = searchTime.getTime() - existingEntry.searchedAt.getTime();
    return timeDiff < this.DUPLICATE_THRESHOLD_MS;
  }

  /**
   * Gets the most frequently searched users from search history
   */
  getMostSearchedUsers(
    searchHistory: SearchHistory,
    limit: number = 5,
  ): string[] {
    const userCounts = new Map<string, number>();

    // Count occurrences of each searched user
    searchHistory.entries.forEach((entry) => {
      const count = userCounts.get(entry.searchedUserId) || 0;
      userCounts.set(entry.searchedUserId, count + 1);
    });

    // Sort by count and return top users
    return Array.from(userCounts.entries())
      .sort(([, countA], [, countB]) => countB - countA)
      .slice(0, limit)
      .map(([userId]) => userId);
  }

  /**
   * Gets recent search patterns for analytics
   */
  getSearchPatterns(searchHistory: SearchHistory): {
    totalSearches: number;
    uniqueUsers: number;
    averageSearchesPerDay: number;
    mostActiveDay: string | null;
  } {
    const entries = searchHistory.entries;
    const uniqueUsers = new Set(entries.map((e) => e.searchedUserId)).size;

    if (entries.length === 0) {
      return {
        totalSearches: 0,
        uniqueUsers: 0,
        averageSearchesPerDay: 0,
        mostActiveDay: null,
      };
    }

    // Group searches by date
    const searchesByDate = new Map<string, number>();
    entries.forEach((entry) => {
      const date = entry.searchedAt.toISOString().split('T')[0];
      const count = searchesByDate.get(date) || 0;
      searchesByDate.set(date, count + 1);
    });

    const days = searchesByDate.size;
    const averageSearchesPerDay = days > 0 ? entries.length / days : 0;

    // Find most active day
    let mostActiveDay: string | null = null;
    let maxSearches = 0;
    searchesByDate.forEach((count, date) => {
      if (count > maxSearches) {
        maxSearches = count;
        mostActiveDay = date;
      }
    });

    return {
      totalSearches: entries.length,
      uniqueUsers,
      averageSearchesPerDay: Math.round(averageSearchesPerDay * 100) / 100,
      mostActiveDay,
    };
  }

  /**
   * Validates search history business rules
   */
  validateSearchHistory(searchHistory: SearchHistory): void {
    if (searchHistory.entriesCount > this.MAX_ENTRIES) {
      throw new SearchHistoryLimitExceededException(
        `Search history cannot exceed ${this.MAX_ENTRIES} entries`,
      );
    }
  }
}
