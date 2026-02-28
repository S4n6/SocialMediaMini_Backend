import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../database/prisma.service';
import { SearchHistory } from '../../../domain/search-history.entity';
import { ISearchHistoryRepository } from '../../../domain/repositories/i-search-history.repository';
import { SearchHistoryMapper } from '../mappers/search-history.mapper';

const SEARCH_HISTORY_INCLUDE = {
  entries: {
    include: {
      searchedUser: {
        select: {
          id: true,
          username: true,
          fullName: true,
          avatar: true,
        },
      },
    },
    orderBy: { searchedAt: 'desc' as const },
  },
};

@Injectable()
export class PrismaSearchHistoryRepository implements ISearchHistoryRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: SearchHistoryMapper,
  ) {}

  async findByUserId(userId: string): Promise<SearchHistory | null> {
    const data = await this.prisma.searchHistory.findUnique({
      where: { userId },
      include: SEARCH_HISTORY_INCLUDE,
    });

    return data ? this.mapper.toDomain(data) : null;
  }

  async save(searchHistory: SearchHistory): Promise<void> {
    const snapshot = searchHistory.toSnapshot();

    await this.prisma.searchHistory.upsert({
      where: { userId: snapshot.userId },
      create: this.mapper.toPrismaCreate(snapshot),
      update: this.mapper.toPrismaUpdate(snapshot),
    });
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.prisma.searchHistory.delete({
      where: { userId },
    });
  }
}
