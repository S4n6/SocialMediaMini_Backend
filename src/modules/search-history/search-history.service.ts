import { Injectable, Logger, forwardRef, Inject } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import {
  SearchHistoryItemDto,
  SearchHistoryResponseDto,
} from './dto/search-history.dto';
import { ApiResponse } from 'src/common/interfaces/api-response.interface';
import { SearchHistoryRepository } from './repositories/search-history.repository';

@Injectable()
export class SearchHistoryService {
  private readonly logger = new Logger(SearchHistoryService.name);

  constructor(
    private readonly searchHistoryRepository: SearchHistoryRepository,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
  ) {}

  /**
   * Get search history for a user with populated user data
   */
  async getSearchHistory(
    currentUserId: string,
  ): Promise<ApiResponse<SearchHistoryResponseDto>> {
    try {
      // Get user IDs and timestamps from repository
      const historyData =
        await this.searchHistoryRepository.getSearchHistory(currentUserId);

      if (!historyData || historyData.length === 0) {
        return {
          success: true,
          message: 'Search history retrieved successfully',
          data: {
            history: [],
            total: 0,
          },
        };
      }

      // Extract user IDs for batch query
      const userIds = historyData.map((item) => item.userId);

      // Batch query user information
      const users = await this.usersService.findManyByIds(userIds);

      // Create a map for quick user lookup
      const userMap = new Map(users.map((user) => [user.id, user]));

      // Combine history data with user information
      const historyItems: SearchHistoryItemDto[] = historyData
        .map((item) => {
          const user = userMap.get(item.userId);
          if (!user) return null; // Skip if user not found (might be deleted)

          return {
            userId: item.userId,
            searchedAt: new Date(item.timestamp).toISOString(),
            user: {
              id: user.id,
              userName: user.userName,
              fullName: user.fullName,
              avatar: user.avatar,
            },
          };
        })
        .filter(Boolean) as SearchHistoryItemDto[];

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
    searchedUserId: string,
  ): Promise<ApiResponse<null>> {
    try {
      // Don't add self to search history
      if (currentUserId === searchedUserId) {
        return {
          success: true,
          message: 'Cannot add yourself to search history',
          data: null,
        };
      }

      // Verify that the searched user exists
      const searchedUser = await this.usersService.findOne(searchedUserId);
      if (!searchedUser.success) {
        return {
          success: false,
          message: 'User not found',
          data: null,
        };
      }

      // Add to Redis using fallback service
      await this.searchHistoryRepository.addToSearchHistory(
        currentUserId,
        searchedUserId,
      );

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
   * Clear all search history for a user
   */
  async clearSearchHistory(currentUserId: string): Promise<ApiResponse<null>> {
    try {
      await this.searchHistoryRepository.clearSearchHistory(currentUserId);

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

  /**
   * Remove a specific user from search history
   */
  async removeUserFromHistory(
    currentUserId: string,
    searchedUserId: string,
  ): Promise<ApiResponse<null>> {
    try {
      await this.searchHistoryRepository.removeFromSearchHistory(
        currentUserId,
        searchedUserId,
      );

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
   * Check if a user is in search history
   */
  async isUserInHistory(
    currentUserId: string,
    searchedUserId: string,
  ): Promise<boolean> {
    try {
      return await this.searchHistoryRepository.isUserInHistory(
        currentUserId,
        searchedUserId,
      );
    } catch (error) {
      this.logger.error(
        `Failed to check user in history: ${error.message}`,
        error,
      );
      return false;
    }
  }

  /**
   * Get search history count for a user
   */
  async getSearchHistoryCount(currentUserId: string): Promise<number> {
    try {
      return await this.searchHistoryRepository.getSearchHistoryCount(
        currentUserId,
      );
    } catch (error) {
      this.logger.error(
        `Failed to get search history count: ${error.message}`,
        error,
      );
      return 0;
    }
  }
}
