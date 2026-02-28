import { Injectable } from '@nestjs/common';
import {
  SearchHistory,
  SearchHistoryEntry,
  SearchHistoryProps,
} from '../../../domain/search-history.entity';

/**
 * Maps between Prisma persistence models and domain entities for SearchHistory.
 */
@Injectable()
export class SearchHistoryMapper {
  toDomain(data: any): SearchHistory {
    const entries: SearchHistoryEntry[] = (data.entries ?? []).map(
      (entry: any) => ({
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
      }),
    );

    return SearchHistory.fromPersistence({
      id: data.id,
      userId: data.userId,
      entries,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  toPrismaCreate(snapshot: SearchHistoryProps) {
    return {
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
    };
  }

  toPrismaUpdate(snapshot: SearchHistoryProps) {
    return {
      updatedAt: snapshot.updatedAt!,
      entries: {
        deleteMany: {},
        create: snapshot.entries.map((entry) => ({
          id: entry.id,
          searchedUserId: entry.searchedUserId,
          searchedAt: entry.searchedAt,
        })),
      },
    };
  }
}
