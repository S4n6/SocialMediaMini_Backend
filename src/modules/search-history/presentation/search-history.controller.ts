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
import { JwtAuthGuard } from '../../../guards/jwt.guard';
import { CurrentUser } from '../../../decorators/currentUser.decorator';
import { SearchHistoryApplicationService } from '../application/search-history-application.service';
import {
  AddSearchEntryDto,
  SearchHistoryResponseDto,
} from '../application/dto/search-history.dto';
import { ApiResponse as ApiResponseInterface } from '../../../common/interfaces/api-response.interface';

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
  ): Promise<ApiResponseInterface<SearchHistoryResponseDto>> {
    return this.searchHistoryService.getSearchHistory(currentUserId);
  }

  @Post()
  @ApiOperation({ summary: 'Add user to search history' })
  @ApiResponse({
    status: 201,
    description: 'User added to search history successfully',
  })
  async addToSearchHistory(
    @CurrentUser('id') currentUserId: string,
    @Body() dto: AddSearchEntryDto,
  ): Promise<ApiResponseInterface<null>> {
    return this.searchHistoryService.addToSearchHistory(currentUserId, dto);
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
  ): Promise<ApiResponseInterface<null>> {
    return this.searchHistoryService.removeFromSearchHistory(
      currentUserId,
      searchedUserId,
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
  ): Promise<ApiResponseInterface<null>> {
    return this.searchHistoryService.clearSearchHistory(currentUserId);
  }
}
