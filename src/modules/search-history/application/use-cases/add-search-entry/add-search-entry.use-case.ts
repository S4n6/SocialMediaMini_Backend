import { Injectable, Inject } from '@nestjs/common';
import { SearchHistory } from '../../../domain/search-history.entity';
import { ISearchHistoryRepository } from '../../../domain/repositories/i-search-history.repository';
import { InvalidUserIdException } from '../../../domain/search-history.exceptions';
import { SEARCH_HISTORY_REPOSITORY_TOKEN } from '../../../search-history.constants';

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

@Injectable()
export class AddSearchEntryUseCase {
  constructor(
    @Inject(SEARCH_HISTORY_REPOSITORY_TOKEN)
    private readonly searchHistoryRepository: ISearchHistoryRepository,
  ) {}

  async execute(input: AddSearchEntryUseCaseInput): Promise<void> {
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

    // Add entry to search history (entity handles deduplication & limits)
    searchHistory.addEntry(searchedUserId, searchedUserProfile);

    await this.searchHistoryRepository.save(searchHistory);
  }
}
