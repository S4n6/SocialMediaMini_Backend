import { Injectable } from '@nestjs/common';
import {
  GetSearchHistoryUseCase,
  AddSearchEntryUseCase,
  RemoveSearchEntryUseCase,
  ClearSearchHistoryUseCase,
} from './use-cases';
import { SearchHistory } from '../domain/search-history.entity';

export interface AddSearchEntryCommand {
  searchedUserId: string;
  searchedUserProfile?: {
    id: string;
    userName: string;
    fullName: string;
    avatar: string | null;
  };
}

@Injectable()
export class SearchHistoryApplicationService {
  constructor(
    private readonly getSearchHistoryUseCase: GetSearchHistoryUseCase,
    private readonly addSearchEntryUseCase: AddSearchEntryUseCase,
    private readonly removeSearchEntryUseCase: RemoveSearchEntryUseCase,
    private readonly clearSearchHistoryUseCase: ClearSearchHistoryUseCase,
  ) {}

  /**
   * Get search history for a user
   */
  async getSearchHistory(userId: string): Promise<SearchHistory | null> {
    const { searchHistory } = await this.getSearchHistoryUseCase.execute({
      userId,
    });
    return searchHistory;
  }

  /**
   * Add a searched user to current user's search history
   */
  async addToSearchHistory(
    userId: string,
    command: AddSearchEntryCommand,
  ): Promise<void> {
    await this.addSearchEntryUseCase.execute({
      userId,
      searchedUserId: command.searchedUserId,
      searchedUserProfile: command.searchedUserProfile,
    });
  }

  /**
   * Remove a user from search history
   */
  async removeFromSearchHistory(
    userId: string,
    searchedUserId: string,
  ): Promise<void> {
    await this.removeSearchEntryUseCase.execute({ userId, searchedUserId });
  }

  /**
   * Clear all search history for a user
   */
  async clearSearchHistory(userId: string): Promise<void> {
    await this.clearSearchHistoryUseCase.execute({ userId });
  }
}
