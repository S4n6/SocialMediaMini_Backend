import { Injectable } from '@nestjs/common';
import { SearchHistory } from '../../domain/search-history.entity';
import { SearchHistoryRepository } from '../../domain/repositories/search-history.repository';
import {
  InvalidUserIdException,
  SearchHistoryNotFoundException,
} from '../../domain/search-history.exceptions';

export interface RemoveSearchEntryUseCaseInput {
  userId: string;
  searchedUserId: string;
}

export interface RemoveSearchEntryUseCaseOutput {
  searchHistory: SearchHistory;
}

@Injectable()
export class RemoveSearchEntryUseCase {
  constructor(
    private readonly searchHistoryRepository: SearchHistoryRepository,
  ) {}

  async execute(
    input: RemoveSearchEntryUseCaseInput,
  ): Promise<RemoveSearchEntryUseCaseOutput> {
    const { userId, searchedUserId } = input;

    if (!userId || userId.trim() === '') {
      throw new InvalidUserIdException('User ID is required');
    }

    if (!searchedUserId || searchedUserId.trim() === '') {
      throw new InvalidUserIdException('Searched user ID is required');
    }

    // Get existing search history
    const searchHistory =
      await this.searchHistoryRepository.findByUserId(userId);

    if (!searchHistory) {
      throw new SearchHistoryNotFoundException('Search history not found');
    }

    // Remove entry from search history
    searchHistory.removeEntry(searchedUserId);

    // Save the updated search history
    const updatedSearchHistory =
      await this.searchHistoryRepository.save(searchHistory);

    return { searchHistory: updatedSearchHistory };
  }
}
