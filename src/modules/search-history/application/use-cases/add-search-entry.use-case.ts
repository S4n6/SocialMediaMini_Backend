import { Injectable } from '@nestjs/common';
import { SearchHistory } from '../../domain/search-history.entity';
import { SearchHistoryRepository } from '../../domain/repositories/search-history.repository';
import { InvalidUserIdException } from '../../domain/search-history.exceptions';

export interface AddSearchEntryUseCaseInput {
  userId: string;
  searchedUserId: string;
  searchedUserProfile?: {
    id: string;
    userName: string;
    fullName: string;
    avatar: string | null;
  };
}

export interface AddSearchEntryUseCaseOutput {
  searchHistory: SearchHistory;
}

@Injectable()
export class AddSearchEntryUseCase {
  constructor(
    private readonly searchHistoryRepository: SearchHistoryRepository,
  ) {}

  async execute(
    input: AddSearchEntryUseCaseInput,
  ): Promise<AddSearchEntryUseCaseOutput> {
    const { userId, searchedUserId, searchedUserProfile } = input;

    if (!userId || userId.trim() === '') {
      throw new InvalidUserIdException('User ID is required');
    }

    if (!searchedUserId || searchedUserId.trim() === '') {
      throw new InvalidUserIdException('Searched user ID is required');
    }

    // Get existing search history or create new one
    let searchHistory = await this.searchHistoryRepository.findByUserId(userId);

    if (!searchHistory) {
      searchHistory = SearchHistory.create(userId);
    }

    // Add entry to search history
    searchHistory.addEntry(searchedUserId, searchedUserProfile);

    // Save the updated search history
    const updatedSearchHistory =
      await this.searchHistoryRepository.save(searchHistory);

    return { searchHistory: updatedSearchHistory };
  }
}
