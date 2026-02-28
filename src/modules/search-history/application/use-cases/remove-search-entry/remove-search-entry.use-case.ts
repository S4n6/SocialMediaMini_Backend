import { Injectable, Inject } from '@nestjs/common';
import { ISearchHistoryRepository } from '../../../domain/repositories/i-search-history.repository';
import {
  InvalidUserIdException,
  SearchHistoryNotFoundException,
} from '../../../domain/search-history.exceptions';
import { SEARCH_HISTORY_REPOSITORY_TOKEN } from '../../../search-history.constants';

export interface RemoveSearchEntryUseCaseInput {
  userId: string;
  searchedUserId: string;
}

@Injectable()
export class RemoveSearchEntryUseCase {
  constructor(
    @Inject(SEARCH_HISTORY_REPOSITORY_TOKEN)
    private readonly searchHistoryRepository: ISearchHistoryRepository,
  ) {}

  async execute(input: RemoveSearchEntryUseCaseInput): Promise<void> {
    const { userId, searchedUserId } = input;

    if (!userId || userId.trim() === '') {
      throw new InvalidUserIdException('User ID is required');
    }

    if (!searchedUserId || searchedUserId.trim() === '') {
      throw new InvalidUserIdException('Searched user ID is required');
    }

    const searchHistory =
      await this.searchHistoryRepository.findByUserId(userId);

    if (!searchHistory) {
      throw new SearchHistoryNotFoundException(userId);
    }

    searchHistory.removeEntry(searchedUserId);

    await this.searchHistoryRepository.save(searchHistory);
  }
}
