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
import { Role } from '../../constants/roles.constant';
import { CurrentUser } from 'src/decorators/currentUser.decorator';

@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  async create(
    @Body() createPostDto: CreatePostDto,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.postsService.create(createPostDto, userId);

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

    console.log(`Searching posts with query: "${query}"`);

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

  @Get('feed')
  async getFeed(
    @CurrentUser('id') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    console.log(
      `Getting feed posts for user ${userId}, page ${page}, limit ${limit}`,
    );
    return this.postsService.getFeedPosts(userId, page, limit);
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
}
