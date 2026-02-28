import { SearchHistory } from './search-history.entity';
import { SearchHistoryLimitExceededException } from './search-history.exceptions';

/**
 * Domain service for SearchHistory business logic.
 * Encapsulates complex domain rules that don't belong to a single entity.
 *
 * Pure TypeScript — no framework imports.
 */
export class SearchHistoryDomainService {
  private static readonly MAX_ENTRIES = 20;
  private static readonly DUPLICATE_THRESHOLD_MS = 1000 * 60 * 5; // 5 minutes

  /**
   * Validates if a user can add a search entry
   */
  canAddSearchEntry(
    searchHistory: SearchHistory,
    searchedUserId: string,
  ): boolean {
    return searchHistory.userId !== searchedUserId;
  }

  /**
   * Only the owner can view their search history
   */
  canViewSearchHistory(
    searchHistory: SearchHistory,
    viewerId: string,
  ): boolean {
    return searchHistory.userId === viewerId;
  }

  /**
   * Only the owner can modify their search history
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
    return searchHistory.entriesCount >= SearchHistoryDomainService.MAX_ENTRIES;
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
    return timeDiff < SearchHistoryDomainService.DUPLICATE_THRESHOLD_MS;
  }

  /**
   * Validates search history business rules
   */
  validateSearchHistory(searchHistory: SearchHistory): void {
    if (searchHistory.entriesCount > SearchHistoryDomainService.MAX_ENTRIES) {
      throw new SearchHistoryLimitExceededException(
        `Search history cannot exceed ${SearchHistoryDomainService.MAX_ENTRIES} entries`,
      );
    }
  }
}
