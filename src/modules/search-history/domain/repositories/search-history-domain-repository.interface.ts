import { SearchHistory } from '../search-history.entity';

export interface ISearchHistoryRepository {
  /**
   * Find search history by user ID
   */
  findByUserId(userId: string): Promise<SearchHistory | null>;

  /**
   * Save search history (create or update)
   */
  save(searchHistory: SearchHistory): Promise<SearchHistory>;

  /**
   * Delete search history by user ID
   */
  deleteByUserId(userId: string): Promise<void>;

  /**
   * Check if user has search history
   */
  existsByUserId(userId: string): Promise<boolean>;

  /**
   * Get search history entries count for a user
   */
  getEntriesCountByUserId(userId: string): Promise<number>;

  /**
   * Find multiple search histories by user IDs
   */
  findManyByUserIds(userIds: string[]): Promise<SearchHistory[]>;
}
