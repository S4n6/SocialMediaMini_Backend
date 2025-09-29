import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import {
  SearchHistory,
  SearchHistoryEntry,
} from '../../domain/search-history.entity';
import { SearchHistoryRepository } from '../../domain/repositories/search-history.repository';

@Injectable()
export class PrismaSearchHistoryRepository extends SearchHistoryRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findByUserId(userId: string): Promise<SearchHistory | null> {
    const searchHistoryData = await this.prisma.searchHistory.findUnique({
      where: { userId },
      include: {
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
          orderBy: {
            searchedAt: 'desc',
          },
        },
      },
    });

    if (!searchHistoryData) {
      return null;
    }

    return this.toDomainEntity(searchHistoryData);
  }

  async save(searchHistory: SearchHistory): Promise<SearchHistory> {
    const snapshot = searchHistory.toSnapshot();

    // Use upsert to handle both create and update
    const savedData = await this.prisma.searchHistory.upsert({
      where: { userId: snapshot.userId },
      create: {
        id: snapshot.id!,
        userId: snapshot.userId,
        createdAt: snapshot.createdAt!,
        updatedAt: snapshot.updatedAt!,
        entries: {
          create: snapshot.entries.map((entry) => ({
            id: entry.id,
            searchedUserId: entry.searchedUserId,
            searchedAt: entry.searchedAt,
          })),
        },
      },
      update: {
        updatedAt: snapshot.updatedAt!,
        entries: {
          // Delete existing entries and create new ones
          deleteMany: {},
          create: snapshot.entries.map((entry) => ({
            id: entry.id,
            searchedUserId: entry.searchedUserId,
            searchedAt: entry.searchedAt,
          })),
        },
      },
      include: {
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
          orderBy: {
            searchedAt: 'desc',
          },
        },
      },
    });

    return this.toDomainEntity(savedData);
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.prisma.searchHistory.delete({
      where: { userId },
    });
  }

  async existsByUserId(userId: string): Promise<boolean> {
    const count = await this.prisma.searchHistory.count({
      where: { userId },
    });
    return count > 0;
  }

  async getEntriesCountByUserId(userId: string): Promise<number> {
    const searchHistory = await this.prisma.searchHistory.findUnique({
      where: { userId },
      include: {
        _count: {
          select: { entries: true },
        },
      },
    });

    return searchHistory?._count?.entries ?? 0;
  }

  async findManyByUserIds(userIds: string[]): Promise<SearchHistory[]> {
    const searchHistories = await this.prisma.searchHistory.findMany({
      where: {
        userId: {
          in: userIds,
        },
      },
      include: {
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
          orderBy: {
            searchedAt: 'desc',
          },
        },
      },
    });

    return searchHistories.map((data) => this.toDomainEntity(data));
  }

  private toDomainEntity(data: any): SearchHistory {
    const entries: SearchHistoryEntry[] = data.entries.map((entry: any) => ({
      id: entry.id,
      searchedUserId: entry.searchedUserId,
      searchedAt: entry.searchedAt,
      searchedUserProfile: entry.searchedUser
        ? {
            id: entry.searchedUser.id,
            userName: entry.searchedUser.username,
            fullName: entry.searchedUser.fullName,
            avatar: entry.searchedUser.avatar,
          }
        : undefined,
    }));

    return SearchHistory.fromPersistence({
      id: data.id,
      userId: data.userId,
      entries,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }
}
