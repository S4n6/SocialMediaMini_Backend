import { Injectable } from '@nestjs/common';
import { SearchHistory } from '../../domain/search-history.entity';
import { SearchHistoryRepository } from '../../domain/repositories/search-history.repository';
import { InvalidUserIdException } from '../../domain/search-history.exceptions';

export interface GetSearchHistoryUseCaseInput {
  userId: string;
}

export interface GetSearchHistoryUseCaseOutput {
  searchHistory: SearchHistory | null;
}

@Injectable()
export class GetSearchHistoryUseCase {
  constructor(
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
