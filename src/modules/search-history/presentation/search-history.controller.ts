import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../shared/guards/jwt.guard';
import { CurrentUser } from '../../../shared/decorators/currentUser.decorator';
import { SearchHistoryApplicationService } from '../application/search-history-application.service';
import {
  AddSearchEntryRequestDto,
  SearchHistoryResponseDto,
  SearchHistoryEntryResponseDto,
} from './dto/search-history.dto';
import {
  ApiResponse as ApiResponseType,
  createSuccessResponse,
} from '../../../shared/utils/interfaces/api-response.interface';

@ApiTags('Search History')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('search-history')
export class SearchHistoryController {
  constructor(
    private readonly searchHistoryService: SearchHistoryApplicationService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get user search history' })
  @ApiResponse({
    status: 200,
    description: 'Search history retrieved successfully',
    type: SearchHistoryResponseDto,
  })
  async getSearchHistory(
    @CurrentUser('id') currentUserId: string,
  ): Promise<ApiResponseType<SearchHistoryResponseDto>> {
    const searchHistory =
      await this.searchHistoryService.getSearchHistory(currentUserId);

    if (!searchHistory || searchHistory.isEmpty) {
      return createSuccessResponse(
        { history: [], total: 0 },
        'Search history retrieved successfully',
      );
    }

    const history: SearchHistoryEntryResponseDto[] = searchHistory.entries.map(
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

    return createSuccessResponse(
      { history, total: history.length },
      'Search history retrieved successfully',
    );
  }

  @Post()
  @ApiOperation({ summary: 'Add user to search history' })
  @ApiResponse({
    status: 201,
    description: 'User added to search history successfully',
  })
  async addToSearchHistory(
    @CurrentUser('id') currentUserId: string,
    @Body() dto: AddSearchEntryRequestDto,
  ): Promise<ApiResponseType<null>> {
    await this.searchHistoryService.addToSearchHistory(currentUserId, {
      searchedUserId: dto.searchedUserId,
    });

    return createSuccessResponse(
      null,
      'User added to search history successfully',
    );
  }

  @Delete(':searchedUserId')
  @ApiOperation({ summary: 'Remove user from search history' })
  @ApiParam({
    name: 'searchedUserId',
    description: 'ID of the user to remove from search history',
  })
  @ApiResponse({
    status: 200,
    description: 'User removed from search history successfully',
  })
  async removeFromSearchHistory(
    @CurrentUser('id') currentUserId: string,
    @Param('searchedUserId') searchedUserId: string,
  ): Promise<ApiResponseType<null>> {
    await this.searchHistoryService.removeFromSearchHistory(
      currentUserId,
      searchedUserId,
    );

    return createSuccessResponse(
      null,
      'User removed from search history successfully',
    );
  }

  @Delete()
  @ApiOperation({ summary: 'Clear all search history' })
  @ApiResponse({
    status: 200,
    description: 'Search history cleared successfully',
  })
  async clearSearchHistory(
    @CurrentUser('id') currentUserId: string,
  ): Promise<ApiResponseType<null>> {
    await this.searchHistoryService.clearSearchHistory(currentUserId);

    return createSuccessResponse(null, 'Search history cleared successfully');
  }
}
