import { Injectable, Logger } from '@nestjs/common';
import { ApiResponse } from '../../../shared/common/interfaces/api-response.interface';
import {
  GetSearchHistoryUseCase,
  AddSearchEntryUseCase,
  RemoveSearchEntryUseCase,
  ClearSearchHistoryUseCase,
} from './use-cases';
import {
  SearchHistoryResponseDto,
  SearchHistoryEntryDto,
  AddSearchEntryDto,
} from './dto/search-history.dto';

@Injectable()
export class SearchHistoryApplicationService {
  private readonly logger = new Logger(SearchHistoryApplicationService.name);

  constructor(
    private readonly getSearchHistoryUseCase: GetSearchHistoryUseCase,
    private readonly addSearchEntryUseCase: AddSearchEntryUseCase,
    private readonly removeSearchEntryUseCase: RemoveSearchEntryUseCase,
    private readonly clearSearchHistoryUseCase: ClearSearchHistoryUseCase,
  ) {}

  /**
   * Get search history for a user with populated user data
   */
  async getSearchHistory(
    currentUserId: string,
  ): Promise<ApiResponse<SearchHistoryResponseDto>> {
    try {
      const { searchHistory } = await this.getSearchHistoryUseCase.execute({
        userId: currentUserId,
      });

      if (!searchHistory || searchHistory.isEmpty) {
        return {
          success: true,
          message: 'Search history retrieved successfully',
          data: {
            history: [],
            total: 0,
          },
        };
      }

      // Convert domain entities to DTOs
      const historyItems: SearchHistoryEntryDto[] = searchHistory.entries.map(
        (entry) => ({
          id: entry.id,
          searchedUserId: entry.searchedUserId,
          searchedAt: entry.searchedAt.toISOString(),
          user: {
            id: entry.searchedUserProfile?.id || entry.searchedUserId,
            userName: entry.searchedUserProfile?.userName || '',
            fullName: entry.searchedUserProfile?.fullName || '',
            avatar: entry.searchedUserProfile?.avatar || null,
          },
        }),
      );

      return {
        success: true,
        message: 'Search history retrieved successfully',
        data: {
          history: historyItems,
          total: historyItems.length,
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to get search history for user ${currentUserId}:`,
        error,
      );
      return {
        success: false,
        message: 'Failed to retrieve search history',
        data: {
          history: [],
          total: 0,
        },
      };
    }
  }

  /**
   * Add a searched user to current user's search history
   */
  async addToSearchHistory(
    currentUserId: string,
    dto: AddSearchEntryDto,
    searchedUserProfile?: {
      id: string;
      userName: string;
      fullName: string;
      avatar: string | null;
    },
  ): Promise<ApiResponse<null>> {
    try {
      // Don't add self to search history
      if (currentUserId === dto.searchedUserId) {
        return {
          success: true,
          message: 'Cannot add yourself to search history',
          data: null,
        };
      }

      await this.addSearchEntryUseCase.execute({
        userId: currentUserId,
        searchedUserId: dto.searchedUserId,
        searchedUserProfile,
      });

      return {
        success: true,
        message: 'User added to search history successfully',
        data: null,
      };
    } catch (error) {
      this.logger.error(
        `Failed to add user to search history: ${error.message}`,
        error,
      );
      return {
        success: false,
        message: 'Failed to add user to search history',
        data: null,
      };
    }
  }

  /**
   * Remove a user from search history
   */
  async removeFromSearchHistory(
    currentUserId: string,
    searchedUserId: string,
  ): Promise<ApiResponse<null>> {
    try {
      await this.removeSearchEntryUseCase.execute({
        userId: currentUserId,
        searchedUserId,
      });

      return {
        success: true,
        message: 'User removed from search history successfully',
        data: null,
      };
    } catch (error) {
      this.logger.error(
        `Failed to remove user from search history: ${error.message}`,
        error,
      );
      return {
        success: false,
        message: 'Failed to remove user from search history',
        data: null,
      };
    }
  }

  /**
   * Clear all search history for a user
   */
  async clearSearchHistory(currentUserId: string): Promise<ApiResponse<null>> {
    try {
      await this.clearSearchHistoryUseCase.execute({
        userId: currentUserId,
      });

      return {
        success: true,
        message: 'Search history cleared successfully',
        data: null,
      };
    } catch (error) {
      this.logger.error(
        `Failed to clear search history for user ${currentUserId}:`,
        error,
      );
      return {
        success: false,
        message: 'Failed to clear search history',
        data: null,
      };
    }
  }
}
