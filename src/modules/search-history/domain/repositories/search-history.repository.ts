import { Injectable } from '@nestjs/common';
import { SearchHistory } from '../search-history.entity';
import { ISearchHistoryRepository } from './search-history-domain-repository.interface';

@Injectable()
export abstract class SearchHistoryRepository
  implements ISearchHistoryRepository
{
  abstract findByUserId(userId: string): Promise<SearchHistory | null>;
  abstract save(searchHistory: SearchHistory): Promise<SearchHistory>;
  abstract deleteByUserId(userId: string): Promise<void>;
  abstract existsByUserId(userId: string): Promise<boolean>;
  abstract getEntriesCountByUserId(userId: string): Promise<number>;
  abstract findManyByUserIds(userIds: string[]): Promise<SearchHistory[]>;
}
