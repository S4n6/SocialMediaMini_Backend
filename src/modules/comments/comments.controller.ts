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
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../../guards/jwt.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../decorators/roles.decorator';
import { Role } from '../../constants/roles.constant';
import { CreateCommentDto } from './dto/createComment.dto';
import { AddCommentReactionDto } from './dto/addCommentReaction.dto';
import { UpdateCommentDto } from './dto/updateComment.dto';
import { CurrentUser } from 'src/decorators/currentUser.decorator';

@Controller('comments')
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  async create(
    @Body() createCommentDto: CreateCommentDto,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.commentsService.create(createCommentDto, userId);

    return {
      message: 'Comment created successfully',
      data: result,
    };
  }

  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const result = await this.commentsService.findAll(page, limit);

    return {
      message: 'Comments retrieved successfully',
      data: result.comments,
      pagination: result.pagination,
    };
  }

  @Get('search')
  async searchComments(
    @Query('q') query: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    if (!query || query.trim() === '') {
      return {
        message: 'Search query is required',
        data: [],
        pagination: null,
      };
    }

    const result = await this.commentsService.searchComments(
      query.trim(),
      page,
      limit,
    );

    return {
      message: `Search results for "${query}"`,
      data: result.comments,
      query: result.query,
      pagination: result.pagination,
    };
  }

  @Get('post/:postId')
  async findByPost(
    @Param('postId') postId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const result = await this.commentsService.findByPost(postId, page, limit);

    return {
      message: 'Post comments retrieved successfully',
      data: result.comments,
      pagination: result.pagination,
    };
  }

  @Get('user/:userId')
  async findByUser(
    @Param('userId') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const result = await this.commentsService.findByUser(userId, page, limit);

    return {
      message: 'User comments retrieved successfully',
      data: result.comments,
      pagination: result.pagination,
    };
  }

  @Get('my-comments')
  async findMyComments(
    @CurrentUser('id') userId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const result = await this.commentsService.findByUser(userId, page, limit);

    return {
      message: 'My comments retrieved successfully',
      data: result.comments,
      pagination: result.pagination,
    };
  }

  @Get('recent/:userId')
  async getRecentComments(
    @Param('userId') userId: string,
    @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number,
  ) {
    const result = await this.commentsService.getRecentComments(userId, limit);

    return {
      message: 'Recent comments retrieved successfully',
      data: result,
    };
  }

  @Get('trending')
  async getTrendingComments(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const result = await this.commentsService.getTrendingComments(limit);

    return {
      message: 'Trending comments retrieved successfully',
      data: result,
    };
  }

  @Get('stats')
  async getMyCommentStats(@CurrentUser('id') userId: string) {
    const result = await this.commentsService.getCommentStats(userId);

    return {
      message: 'Comment statistics retrieved successfully',
      data: result,
    };
  }

  @Get('stats/post/:postId')
  async getPostCommentStats(@Param('postId') postId: string) {
    const result = await this.commentsService.getCommentStats(
      undefined,
      postId,
    );

    return {
      message: 'Post comment statistics retrieved successfully',
      data: result,
    };
  }

  @Get('stats/all')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async getAllCommentStats() {
    const result = await this.commentsService.getCommentStats();

    return {
      message: 'All comment statistics retrieved successfully',
      data: result,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const result = await this.commentsService.findOne(id);

    return {
      message: 'Comment retrieved successfully',
      data: result,
    };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.commentsService.update(
      id,
      updateCommentDto,
      userId,
    );

    return {
      message: 'Comment updated successfully',
      data: result,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    const result = await this.commentsService.remove(id, userId);

    return result;
  }

  @Post(':id/reactions')
  async addReaction(
    @Param('id') commentId: string,
    @Body() addReactionDto: AddCommentReactionDto,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.commentsService.addReaction(
      commentId,
      userId,
      addReactionDto.reactionType,
    );

    return {
      message: 'Reaction added to comment successfully',
      data: result,
    };
  }

  @Delete(':id/reactions')
  async removeReaction(
    @Param('id') commentId: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.commentsService.removeReaction(commentId, userId);

    return result;
  }

  @Get(':id/reactions')
  async getCommentReactions(@Param('id') commentId: string) {
    const result = await this.commentsService.getCommentReactions(commentId);

    return {
      message: 'Comment reactions retrieved successfully',
      data: result,
    };
  }

  @Delete('post/:postId/all')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async removeAllByPost(
    @Param('postId') postId: string,
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.commentsService.removeAllByPost(postId, userId);

    return result;
  }

  @Post(':id/reply')
  async replyToComment(
    @Param('id') parentCommentId: string,
    @Body() replyDto: { content: string; postId: string },
    @CurrentUser('id') userId: string,
  ) {
    const createCommentDto: CreateCommentDto = {
      content: replyDto.content,
      postId: replyDto.postId,
      parentId: parentCommentId,
    };

    const result = await this.commentsService.create(createCommentDto, userId);

    return {
      message: 'Reply added successfully',
      data: result,
    };
  }

  @Get(':id/replies')
  async getCommentReplies(
    @Param('id') commentId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    const result = await this.commentsService.getReplies(
      commentId,
      page,
      limit,
    );

    return {
      message: 'Comment replies retrieved successfully',
      data: result.replies,
      pagination: result.pagination,
    };
  }
}
