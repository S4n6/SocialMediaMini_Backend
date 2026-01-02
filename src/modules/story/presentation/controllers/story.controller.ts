import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../../shared/guards/jwt.guard';
import { CurrentUser } from '../../../../shared/decorators/currentUser.decorator';
import { StoryApplicationService } from '../../application/services';
import {
  CreateStoryRequestDto,
  GetUserStoriesParamsDto,
  StoryResponseDto,
  StoriesListResponseDto,
  ApiSuccessResponse,
} from '../dto';
import { STORY_ROUTES, STORY_ERROR_MESSAGES } from '../../constants';
import {
  CreateStoryCommand,
  GetFollowedUsersStoriesQuery,
  GetUserStoriesQuery,
  ViewStoryCommand,
} from '../../application/dto';

@Controller(STORY_ROUTES.BASE)
@UseGuards(JwtAuthGuard)
export class StoryController {
  constructor(
    private readonly storyApplicationService: StoryApplicationService,
  ) {}

  private createResponse<T>(
    data: T,
    message: string,
    statusCode: HttpStatus = HttpStatus.OK,
  ): ApiSuccessResponse<T> {
    return {
      statusCode,
      message,
      success: true,
      data,
      timestamp: new Date(),
    };
  }

  /**
   * POST /stories - Create a new story
   */
  @Post()
  async createStory(
    @Body() createDto: CreateStoryRequestDto,
    @CurrentUser('id') userId: string,
  ): Promise<ApiSuccessResponse<StoryResponseDto>> {
    const command: CreateStoryCommand = {
      authorId: userId,
      content: createDto.content,
      mediaUrl: createDto.mediaUrl,
      mediaType: createDto.mediaType,
    };

    const story = await this.storyApplicationService.createStory(command);

    return this.createResponse(
      story,
      'Story created successfully',
      HttpStatus.CREATED,
    );
  }

  /**
   * GET /stories/feed - Get stories from followed users
   */
  @Get(STORY_ROUTES.GET_FEED)
  async getFollowedUsersStories(
    @CurrentUser('id') userId: string,
  ): Promise<ApiSuccessResponse<StoriesListResponseDto>> {
    const query: GetFollowedUsersStoriesQuery = {
      currentUserId: userId,
    };

    const stories =
      await this.storyApplicationService.getFollowedUsersStories(query);

    return this.createResponse(stories, 'Stories retrieved successfully');
  }

  /**
   * GET /stories/user/:userId - Get stories from specific user
   */
  @Get(STORY_ROUTES.GET_USER_STORIES)
  async getUserStories(
    @Param() params: GetUserStoriesParamsDto,
    @CurrentUser('id') currentUserId?: string,
  ): Promise<ApiSuccessResponse<StoriesListResponseDto>> {
    const query: GetUserStoriesQuery = {
      userId: params.userId,
      currentUserId,
    };

    const stories = await this.storyApplicationService.getUserStories(query);

    return this.createResponse(stories, 'User stories retrieved successfully');
  }

  /**
   * POST /stories/:storyId/view - View a story
   */
  @Post(STORY_ROUTES.VIEW_STORY)
  async viewStory(
    @Param('storyId') storyId: string,
    @CurrentUser('id') userId: string,
  ): Promise<ApiSuccessResponse<StoryResponseDto>> {
    const command: ViewStoryCommand = {
      storyId,
      viewerId: userId,
    };

    const story = await this.storyApplicationService.viewStory(command);

    return this.createResponse(story, 'Story viewed successfully');
  }
}
