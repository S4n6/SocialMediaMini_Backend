import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { PostApplicationService } from '../application/post-application.service';
// Application DTOs
import {
  CreatePostDto,
  UpdatePostDto,
  GetPostsQueryDto,
  GetUserFeedDto,
} from '../application/dto/post-use-case.dto';

// Domain enums
import { PostPrivacy } from '../domain/post.entity';

// Presentation DTOs
import {
  CreatePostRequestDto,
  UpdatePostRequestDto,
  GetPostsQueryRequestDto,
} from './dto/post-request.dto';

import {
  GetFeedDto,
  PostDetailResponseDto,
  PostListResponseDto,
  PostResponseDto,
} from '../application';

// Import guards and decorators from shared folder
import { JwtAuthGuard } from '../../../shared/guards/jwt.guard';
import { CurrentUser } from '../../../shared/decorators/currentUser.decorator';
import { SkipGuards } from '../../../shared/decorators/skipGuard.decorator';

@ApiTags('Posts')
@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostsController {
  constructor(
    private readonly postApplicationService: PostApplicationService,
  ) {}

  // ===== POST MANAGEMENT =====

  @Post()
  @ApiOperation({ summary: 'Create a new post' })
  @ApiResponse({
    status: 201,
    description: 'Post created successfully',
    type: PostResponseDto,
  })
  @ApiBearerAuth()
  async createPost(
    @Body() createPostRequest: CreatePostRequestDto,
    @CurrentUser('id') authorId: string,
  ): Promise<PostResponseDto> {
    const createPostDto: CreatePostDto = {
      content: createPostRequest.content,
      privacy: this.mapPrivacyToApplicationEnum(createPostRequest.privacy),
      hashtags: createPostRequest.hashtags,
      media: createPostRequest.media?.map((m) => ({
        url: m.url,
        type: m.type,
        order: m.order,
      })),
      authorId,
    };

    return this.postApplicationService.createPost(authorId, createPostDto);
  }

  private mapPrivacyToApplicationEnum(privacy?: string): PostPrivacy {
    switch (privacy) {
      case 'private':
        return PostPrivacy.PRIVATE;
      case 'followers':
        return PostPrivacy.FOLLOWERS;
      case 'public':
      default:
        return PostPrivacy.PUBLIC;
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a post' })
  @ApiResponse({
    status: 200,
    description: 'Post updated successfully',
    type: PostResponseDto,
  })
  @ApiParam({ name: 'id', description: 'Post ID', type: 'string' })
  @ApiBearerAuth()
  async updatePost(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePostRequest: UpdatePostRequestDto,
    @CurrentUser('userId') userId: string,
  ): Promise<PostResponseDto> {
    // Map presentation DTO to application DTO
    const updatePostDto: UpdatePostDto = {
      id,
      content: updatePostRequest.content,
      privacy: updatePostRequest.privacy
        ? this.mapPrivacyToApplicationEnum(updatePostRequest.privacy)
        : undefined,
      media: updatePostRequest.media?.map((m) => ({
        url: m.url,
        type: m.type,
        order: m.order,
      })),
      hashtags: updatePostRequest.hashtags,
      authorId: userId,
    };

    return this.postApplicationService.updatePost(id, userId, updatePostDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a post' })
  @ApiResponse({ status: 204, description: 'Post deleted successfully' })
  @ApiParam({ name: 'id', description: 'Post ID', type: 'string' })
  @ApiBearerAuth()
  async deletePost(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') userRole: string,
  ): Promise<void> {
    return this.postApplicationService.deletePost(id, userId, userRole);
  }

  // ===== POST RETRIEVAL =====

  @Get(':id')
  @SkipGuards()
  @ApiOperation({ summary: 'Get a post by ID' })
  @ApiResponse({
    status: 200,
    description: 'Post retrieved successfully',
    type: PostDetailResponseDto,
  })
  @ApiParam({ name: 'id', description: 'Post ID', type: 'string' })
  async getPost(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('userId') viewerId?: string,
  ): Promise<PostDetailResponseDto> {
    const isFollowing = false; // TODO: Implement following check
    return this.postApplicationService.getPostById(id, viewerId, isFollowing);
  }

  @Get()
  @SkipGuards()
  @ApiOperation({ summary: 'Get posts with filters' })
  @ApiResponse({
    status: 200,
    description: 'Posts retrieved successfully',
    type: PostListResponseDto,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'authorId',
    required: false,
    type: String,
    description: 'Filter by author ID',
  })
  @ApiQuery({
    name: 'hashtag',
    required: false,
    type: String,
    description: 'Filter by hashtag',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search in content',
  })
  async getPosts(
    @Query() query: GetPostsQueryDto,
    @CurrentUser('userId') viewerId?: string,
  ): Promise<PostListResponseDto> {
    return this.postApplicationService.getPosts(query, viewerId);
  }

  @Get('feed/timeline')
  @ApiOperation({ summary: 'Get user timeline/feed' })
  @ApiResponse({
    status: 200,
    description: 'Feed retrieved successfully',
    type: PostListResponseDto,
  })
  @ApiBearerAuth()
  async getFeed(
    @Query() query: GetFeedDto,
    @CurrentUser('userId') userId: string,
  ): Promise<PostListResponseDto> {
    return this.postApplicationService.getUserFeed(userId, query);
  }
}
