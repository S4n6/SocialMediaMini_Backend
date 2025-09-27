import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  UseGuards,
  ValidationPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SearchHistoryService } from './search-history.service';
import { JwtAuthGuard } from '../../guards/jwt.guard';
import { CurrentUser } from '../../decorators/currentUser.decorator';
import {
  AddSearchHistoryDto,
  SearchHistoryResponseDto,
} from './dto/search-history.dto';
import { ApiResponse } from 'src/common/interfaces/api-response.interface';

@Controller('search-history')
@UseGuards(JwtAuthGuard)
export class SearchHistoryController {
  constructor(private readonly searchHistoryService: SearchHistoryService) {}

  /**
   * Get user's search history
   */
  @Get()
  async getSearchHistory(
    @CurrentUser() user: any,
  ): Promise<ApiResponse<SearchHistoryResponseDto>> {
    return this.searchHistoryService.getSearchHistory(user.id);
  }

  /**
   * Add a searched user to user's history
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async addToSearchHistory(
    @CurrentUser() user: any,
    @Body(ValidationPipe) addSearchHistoryDto: AddSearchHistoryDto,
  ): Promise<ApiResponse<null>> {
    return this.searchHistoryService.addToSearchHistory(
      user.id,
      addSearchHistoryDto.searchedUserId,
    );
  }

  /**
   * Clear all search history for the user
   */
  @Delete('clear')
  @HttpCode(HttpStatus.OK)
  async clearSearchHistory(
    @CurrentUser() user: any,
  ): Promise<ApiResponse<null>> {
    return this.searchHistoryService.clearSearchHistory(user.id);
  }

  /**
   * Remove a specific user from search history
   */
  @Delete()
  @HttpCode(HttpStatus.OK)
  async removeUserFromHistory(
    @CurrentUser() user: any,
    @Query('userId') userId: string,
  ): Promise<ApiResponse<null>> {
    if (!userId || userId.trim() === '') {
      return {
        success: false,
        message: 'UserId parameter is required',
        data: null,
      };
    }

    return this.searchHistoryService.removeUserFromHistory(user.id, userId);
  }
}
