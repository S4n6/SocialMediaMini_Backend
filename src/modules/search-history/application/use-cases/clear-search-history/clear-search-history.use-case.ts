import { Injectable, Inject } from '@nestjs/common';
import { ISearchHistoryRepository } from '../../../domain/repositories/i-search-history.repository';
import {
  InvalidUserIdException,
  SearchHistoryNotFoundException,
} from '../../../domain/search-history.exceptions';
import { SEARCH_HISTORY_REPOSITORY_TOKEN } from '../../../search-history.constants';

export interface ClearSearchHistoryUseCaseInput {
  userId: string;
}

@Injectable()
export class ClearSearchHistoryUseCase {
  constructor(
    @Inject(SEARCH_HISTORY_REPOSITORY_TOKEN)
    private readonly searchHistoryRepository: ISearchHistoryRepository,
  ) {}

  async execute(input: ClearSearchHistoryUseCaseInput): Promise<void> {
    const { userId } = input;

    if (!userId || userId.trim() === '') {
      throw new InvalidUserIdException('User ID is required');
    }

    const searchHistory =
      await this.searchHistoryRepository.findByUserId(userId);

    if (!searchHistory) {
      throw new SearchHistoryNotFoundException(userId);
    }

    searchHistory.clearAllEntries();

    await this.searchHistoryRepository.save(searchHistory);
  }
}
