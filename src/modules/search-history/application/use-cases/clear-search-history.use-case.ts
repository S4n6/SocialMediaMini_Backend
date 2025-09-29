import { Injectable } from '@nestjs/common';
import { SearchHistory } from '../../domain/search-history.entity';
import { SearchHistoryRepository } from '../../domain/repositories/search-history.repository';
import {
  InvalidUserIdException,
  SearchHistoryNotFoundException,
} from '../../domain/search-history.exceptions';

export interface ClearSearchHistoryUseCaseInput {
  userId: string;
}

export interface ClearSearchHistoryUseCaseOutput {
  searchHistory: SearchHistory;
}

@Injectable()
export class ClearSearchHistoryUseCase {
  constructor(
    private readonly searchHistoryRepository: SearchHistoryRepository,
  ) {}

  async execute(
    input: ClearSearchHistoryUseCaseInput,
  ): Promise<ClearSearchHistoryUseCaseOutput> {
    const { userId } = input;

    if (!userId || userId.trim() === '') {
      throw new InvalidUserIdException('User ID is required');
    }

    // Get existing search history
    const searchHistory =
      await this.searchHistoryRepository.findByUserId(userId);

    if (!searchHistory) {
      throw new SearchHistoryNotFoundException('Search history not found');
    }

    // Clear all entries from search history
    searchHistory.clearAllEntries();

    // Save the updated search history
    const updatedSearchHistory =
      await this.searchHistoryRepository.save(searchHistory);

    return { searchHistory: updatedSearchHistory };
  }
}
