import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/createPost.dto';
import { UpdatePostDto } from './dto/updatePost.dto';
import { AddCommentDto } from './dto/addComment.dto';
import { AddReactionDto } from './dto/addReaction.dto';
import { JwtAuthGuard } from '../../guards/jwt.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { Role } from '../../constants/roles';
import { CurrentUser } from 'src/decorators/currentUser.decorator';

@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  async create(@Body() createPostDto: CreatePostDto & { userId: string }) {
    const result = await this.postsService.create(
      createPostDto,
      createPostDto.userId,
    );

    return {
      message: 'Post created successfully',
      data: result,
    };
  }

  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const result = await this.postsService.findAll(page, limit);

    return {
      message: 'Posts retrieved successfully',
      data: result.posts,
      pagination: result.pagination,
    };
  }

  @Get('search')
  async searchPosts(
    @Query('q') query: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    if (!query || query.trim() === '') {
      return {
        message: 'Search query is required',
        data: [],
        pagination: null,
      };
    }

    const result = await this.postsService.searchPosts(
      query.trim(),
      page,
      limit,
    );

    return {
      message: `Search results for "${query}"`,
      data: result.posts,
      query: result.query,
      pagination: result.pagination,
    };
  }

  @Get('user/:userId')
  async findByUser(
    @Param('userId') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const result = await this.postsService.findByUser(userId, page, limit);

    return {
      message: 'User posts retrieved successfully',
      data: result.posts,
      pagination: result.pagination,
    };
  }

  @Get('my-posts')
  async findMyPosts(
    @CurrentUser('id') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const result = await this.postsService.findByUser(userId, page, limit);

    return {
      message: 'My posts retrieved successfully',
      data: result.posts,
      pagination: result.pagination,
    };
  }

  @Get('stats')
  async getStats(@CurrentUser('id') userId: string) {
    const result = await this.postsService.getPostStats(userId);

    return {
      message: 'Post statistics retrieved successfully',
      data: result,
    };
  }

  @Get('stats/all')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async getAllStats() {
    const result = await this.postsService.getPostStats();

    return {
      message: 'All posts statistics retrieved successfully',
      data: result,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.postsService.findOne(id);

    return {
      message: 'Post retrieved successfully',
      data: result,
    };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.postsService.update(id, updatePostDto, userId);

    return {
      message: 'Post updated successfully',
      data: result,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const result = await this.postsService.remove(id, userId);

    return result;
  }

  // Reactions endpoints
  @Post(':id/reactions')
  async addReaction(
    @Param('id') postId: string,
    @Body() addReactionDto: AddReactionDto,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.postsService.addReaction(
      postId,
      userId,
      addReactionDto.reactionType,
    );

    return {
      message: 'Reaction added successfully',
      data: result,
    };
  }

  @Delete(':id/reactions')
  async removeReaction(
    @Param('id') postId: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.postsService.removeReaction(postId, userId);

    return result;
  }

  @Get(':id/reactions')
  async getPostReactions(@Param('id') postId: string) {
    const result = await this.postsService.getPostReactions(postId);

    return {
      message: 'Post reactions retrieved successfully',
      data: result,
    };
  }

  // Comments endpoints
  @Post(':id/comments')
  async addComment(
    @Param('id') postId: string,
    @Body() addCommentDto: AddCommentDto,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.postsService.addComment(
      postId,
      userId,
      addCommentDto.content,
    );

    return {
      message: 'Comment added successfully',
      data: result,
    };
  }

  @Get(':id/comments')
  async getPostComments(
    @Param('id') postId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const result = await this.postsService.getPostComments(postId, page, limit);

    return {
      message: 'Post comments retrieved successfully',
      data: result.comments,
      pagination: result.pagination,
    };
  }
}
