import { SearchHistory } from '../search-history.entity';

/**
 * Search History Repository Interface - Domain Layer
 * Pure domain contract for search history persistence operations
 */
export interface ISearchHistoryRepository {
  /**
   * Find search history by user ID
   */
  findByUserId(userId: string): Promise<SearchHistory | null>;

  /**
   * Save search history (create or update)
   */
  save(searchHistory: SearchHistory): Promise<void>;

  /**
   * Delete search history by user ID
   */
  deleteByUserId(userId: string): Promise<void>;
}
