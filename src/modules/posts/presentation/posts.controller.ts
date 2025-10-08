import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
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
  CreateReactionDto,
  CreateCommentDto,
  UpdateCommentDto,
  GetUserFeedDto,
} from '../application/dto/post-use-case.dto';

// Presentation DTOs
import {
  CreatePostRequestDto,
  UpdatePostRequestDto,
  GetPostsQueryRequestDto,
  CreateReactionRequestDto,
  CreateCommentRequestDto,
} from './dto/post-request.dto';
import {
  PostResponseDto as PostApiResponse,
  PostListResponseDto as PostListApiResponse,
  CreatePostResponseDto,
} from './dto/post-response.dto';
import {
  GetFeedDto,
  PostCommentResponseDto,
  PostDetailResponseDto,
  PostListResponseDto,
  PostResponseDto,
} from '../application';

// These would be imported from auth module
// import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
// import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@ApiTags('Posts')
@Controller('posts')
// @UseGuards(JwtAuthGuard) // Uncomment when auth is ready
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
    @Body() createPostDto: CreatePostDto,
    @Request() req: unknown, // Replace with @CurrentUser() when auth is ready
  ): Promise<PostResponseDto> {
    // Safe accessor for user id from request
    const getUserId = (r: unknown): string => {
      try {
        const maybe = r as { user?: { userId?: unknown } };
        const v = maybe?.user?.userId;
        return typeof v === 'string' && v ? v : 'temp-user-id';
      } catch {
        return 'temp-user-id';
      }
    };

    const authorId = getUserId(req);
    return this.postApplicationService.createPost(authorId, createPostDto);
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
    @Body() updatePostDto: UpdatePostDto,
    @Request() req: unknown, // Replace with @CurrentUser() when auth is ready
  ): Promise<PostResponseDto> {
    // Safe accessor for user id
    const getUserId = (r: unknown): string => {
      try {
        const maybe = r as { user?: { userId?: unknown } };
        const v = maybe?.user?.userId;
        return typeof v === 'string' && v ? v : 'temp-user-id';
      } catch {
        return 'temp-user-id';
      }
    };

    const userId = getUserId(req);
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
    @Request() req: unknown, // Replace with @CurrentUser() when auth is ready
  ): Promise<void> {
    // Safe accessors for user id and role
    const getUserId = (r: unknown): string => {
      try {
        const maybe = r as { user?: { userId?: unknown } };
        const v = maybe?.user?.userId;
        return typeof v === 'string' && v ? v : 'temp-user-id';
      } catch {
        return 'temp-user-id';
      }
    };

    const getUserRole = (r: unknown): string => {
      try {
        const maybe = r as { user?: { role?: unknown } };
        const v = maybe?.user?.role;
        return typeof v === 'string' && v ? v : 'USER';
      } catch {
        return 'USER';
      }
    };

    const userId = getUserId(req);
    const userRole = getUserRole(req);
    return this.postApplicationService.deletePost(id, userId, userRole);
  }

  // ===== POST RETRIEVAL =====

  @Get(':id')
  @ApiOperation({ summary: 'Get a post by ID' })
  @ApiResponse({
    status: 200,
    description: 'Post retrieved successfully',
    type: PostDetailResponseDto,
  })
  @ApiParam({ name: 'id', description: 'Post ID', type: 'string' })
  async getPost(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: unknown, // Replace with @CurrentUser() when auth is ready
  ): Promise<PostDetailResponseDto> {
    // Safe accessor for optional viewer id
    const getOptionalUserId = (r: unknown): string | undefined => {
      try {
        const maybe = r as { user?: { userId?: unknown } };
        const v = maybe?.user?.userId;
        return typeof v === 'string' && v ? v : undefined;
      } catch {
        return undefined;
      }
    };

    const viewerId = getOptionalUserId(req);
    const isFollowing = false; // TODO: Implement following check
    return this.postApplicationService.getPostById(id, viewerId, isFollowing);
  }

  @Get()
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
    @Request() req: unknown, // Replace with @CurrentUser() when auth is ready
  ): Promise<PostListResponseDto> {
    // Safe accessor for optional viewer id
    const getOptionalUserId = (r: unknown): string | undefined => {
      try {
        const maybe = r as { user?: { userId?: unknown } };
        const v = maybe?.user?.userId;
        return typeof v === 'string' && v ? v : undefined;
      } catch {
        return undefined;
      }
    };

    const viewerId = getOptionalUserId(req);
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
    @Request() req: unknown, // Replace with @CurrentUser() when auth is ready
  ): Promise<PostListResponseDto> {
    // Safe accessor for user id
    const getUserId = (r: unknown): string => {
      try {
        const maybe = r as { user?: { userId?: unknown } };
        const v = maybe?.user?.userId;
        return typeof v === 'string' && v ? v : 'temp-user-id';
      } catch {
        return 'temp-user-id';
      }
    };

    const userId = getUserId(req);
    return this.postApplicationService.getUserFeed(userId, query);
  }

  // ===== REACTIONS =====

  @Post(':id/reactions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add reaction to a post' })
  @ApiResponse({ status: 201, description: 'Reaction added successfully' })
  @ApiParam({ name: 'id', description: 'Post ID', type: 'string' })
  @ApiBearerAuth()
  async addReaction(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() createReactionDto: CreateReactionDto,
    @Request() req: unknown, // Replace with @CurrentUser() when auth is ready
  ): Promise<void> {
    // Safe accessor for user id
    const getUserId = (r: unknown): string => {
      try {
        const maybe = r as { user?: { userId?: unknown } };
        const v = maybe?.user?.userId;
        return typeof v === 'string' && v ? v : 'temp-user-id';
      } catch {
        return 'temp-user-id';
      }
    };

    const userId = getUserId(req);
    return this.postApplicationService.addReaction(
      id,
      userId,
      createReactionDto,
    );
  }

  @Delete(':id/reactions')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove reaction from a post' })
  @ApiResponse({ status: 204, description: 'Reaction removed successfully' })
  @ApiParam({ name: 'id', description: 'Post ID', type: 'string' })
  @ApiBearerAuth()
  async removeReaction(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: unknown, // Replace with @CurrentUser() when auth is ready
  ): Promise<void> {
    // Safe accessor for user id
    const getUserId = (r: unknown): string => {
      try {
        const maybe = r as { user?: { userId?: unknown } };
        const v = maybe?.user?.userId;
        return typeof v === 'string' && v ? v : 'temp-user-id';
      } catch {
        return 'temp-user-id';
      }
    };

    const userId = getUserId(req);
    return this.postApplicationService.removeReaction(id, userId);
  }

  @Put(':id/reactions/toggle')
  @ApiOperation({ summary: 'Toggle reaction on a post' })
  @ApiResponse({
    status: 200,
    description: 'Reaction toggled successfully',
    schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['added', 'removed', 'changed'] },
        reactionType: { type: 'string', nullable: true },
      },
    },
  })
  @ApiParam({ name: 'id', description: 'Post ID', type: 'string' })
  @ApiBearerAuth()
  async toggleReaction(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() createReactionDto: CreateReactionDto,
    @Request() req: unknown, // Replace with @CurrentUser() when auth is ready
  ): Promise<{
    action: 'added' | 'removed' | 'changed';
    reactionType?: string;
  }> {
    // Safe accessor for user id
    const getUserId = (r: unknown): string => {
      try {
        const maybe = r as { user?: { userId?: unknown } };
        const v = maybe?.user?.userId;
        return typeof v === 'string' && v ? v : 'temp-user-id';
      } catch {
        return 'temp-user-id';
      }
    };

    const userId = getUserId(req);
    return this.postApplicationService.toggleReaction(
      id,
      userId,
      createReactionDto,
    );
  }

  // ===== COMMENTS =====

  @Post(':id/comments')
  @ApiOperation({ summary: 'Add comment to a post' })
  @ApiResponse({
    status: 201,
    description: 'Comment added successfully',
    type: PostCommentResponseDto,
  })
  @ApiParam({ name: 'id', description: 'Post ID', type: 'string' })
  @ApiBearerAuth()
  async addComment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() createCommentDto: CreateCommentDto,
    @Request() req: unknown, // Replace with @CurrentUser() when auth is ready
  ): Promise<PostCommentResponseDto> {
    // Safe accessor for user id
    const getUserId = (r: unknown): string => {
      try {
        const maybe = r as { user?: { userId?: unknown } };
        const v = maybe?.user?.userId;
        return typeof v === 'string' && v ? v : 'temp-user-id';
      } catch {
        return 'temp-user-id';
      }
    };

    const authorId = getUserId(req);
    return this.postApplicationService.addComment(
      id,
      authorId,
      createCommentDto,
    );
  }

  @Put(':id/comments/:commentId')
  @ApiOperation({ summary: 'Update a comment' })
  @ApiResponse({
    status: 200,
    description: 'Comment updated successfully',
    type: PostCommentResponseDto,
  })
  @ApiParam({ name: 'id', description: 'Post ID', type: 'string' })
  @ApiParam({ name: 'commentId', description: 'Comment ID', type: 'string' })
  @ApiBearerAuth()
  async updateComment(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @Request() req: unknown, // Replace with @CurrentUser() when auth is ready
  ): Promise<PostCommentResponseDto> {
    // Safe accessor for user id
    const getUserId = (r: unknown): string => {
      try {
        const maybe = r as { user?: { userId?: unknown } };
        const v = maybe?.user?.userId;
        return typeof v === 'string' && v ? v : 'temp-user-id';
      } catch {
        return 'temp-user-id';
      }
    };

    const userId = getUserId(req);
    return this.postApplicationService.updateComment(
      id,
      commentId,
      userId,
      updateCommentDto,
    );
  }

  @Delete(':id/comments/:commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiResponse({ status: 204, description: 'Comment deleted successfully' })
  @ApiParam({ name: 'id', description: 'Post ID', type: 'string' })
  @ApiParam({ name: 'commentId', description: 'Comment ID', type: 'string' })
  @ApiBearerAuth()
  async deleteComment(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Request() req: unknown, // Replace with @CurrentUser() when auth is ready
  ): Promise<void> {
    // Safe accessors for user id and role
    const getUserId = (r: unknown): string => {
      try {
        const maybe = r as { user?: { userId?: unknown } };
        const v = maybe?.user?.userId;
        return typeof v === 'string' && v ? v : 'temp-user-id';
      } catch {
        return 'temp-user-id';
      }
    };

    const getUserRole = (r: unknown): string => {
      try {
        const maybe = r as { user?: { role?: unknown } };
        const v = maybe?.user?.role;
        return typeof v === 'string' && v ? v : 'USER';
      } catch {
        return 'USER';
      }
    };

    const userId = getUserId(req);
    const userRole = getUserRole(req);
    return this.postApplicationService.deleteComment(
      id,
      commentId,
      userId,
      userRole,
    );
  }
}
