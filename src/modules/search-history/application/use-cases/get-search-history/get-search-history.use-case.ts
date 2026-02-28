import { Injectable, Inject } from '@nestjs/common';
import { SearchHistory } from '../../../domain/search-history.entity';
import { ISearchHistoryRepository } from '../../../domain/repositories/i-search-history.repository';
import { InvalidUserIdException } from '../../../domain/search-history.exceptions';
import { SEARCH_HISTORY_REPOSITORY_TOKEN } from '../../../search-history.constants';

export interface GetSearchHistoryUseCaseInput {
  userId: string;
}

export interface GetSearchHistoryUseCaseOutput {
  searchHistory: SearchHistory | null;
}

@Injectable()
export class GetSearchHistoryUseCase {
  constructor(
    @Inject(SEARCH_HISTORY_REPOSITORY_TOKEN)
    private readonly searchHistoryRepository: ISearchHistoryRepository,
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
