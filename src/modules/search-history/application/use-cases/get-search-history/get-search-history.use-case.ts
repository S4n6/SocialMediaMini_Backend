import { Injectable, Inject } from '@nestjs/common';
import { SearchHistory } from '../../../domain/search-history.entity';
import { SearchHistoryRepository } from '../../../domain/search-history.repository';
import { InvalidUserIdException } from '../../../domain/search-history.exceptions';
import { SEARCH_HISTORY_REPOSITORY } from '../../../tokens';

export interface GetSearchHistoryUseCaseInput {
  userId: string;
}

export interface GetSearchHistoryUseCaseOutput {
  searchHistory: SearchHistory | null;
}

@Injectable()
export class GetSearchHistoryUseCase {
  constructor(
    @Inject(SEARCH_HISTORY_REPOSITORY)
    private readonly searchHistoryRepository: SearchHistoryRepository,
  ) {}

  async execute(
    input: GetSearchHistoryUseCaseInput,
  ): Promise<GetSearchHistoryUseCaseOutput> {
    const { userId } = input;

    if (!userId || userId.trim() === '') {
      throw new InvalidUserIdException('User ID is required');
    }

    const searchHistory =
      await this.searchHistoryRepository.findByUserId(userId);

    return { searchHistory };
  }
}
