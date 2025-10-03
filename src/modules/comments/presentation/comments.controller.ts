import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../shared/guards/jwt.guard';
import { CurrentUser } from '../../../shared/decorators/currentUser.decorator';
import { CommentApplicationService } from '../application/interfaces/comment-application.interface';
import {
  CreateCommentDto,
  UpdateCommentDto,
  AddCommentReactionDto,
  GetCommentsDto,
  GetRepliesDto,
} from '../application/dto/comment.dto';
import { ApiResponse } from '../../../shared/common/interfaces/api-response.interface';

@Controller('comments')
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(
    @Inject('CommentApplicationService')
    private readonly commentService: CommentApplicationService,
  ) {}

  private createResponse<T>(
    data: T,
    message: string,
    statusCode: HttpStatus = HttpStatus.OK,
  ): ApiResponse<T> {
    return {
      statusCode,
      message,
      success: true,
      data,
    };
  }

  @Post()
  async createComment(
    @Body() createDto: CreateCommentDto,
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponse<any>> {
    const comment = await this.commentService.createComment(createDto, userId);

    return this.createResponse(
      comment,
      'Comment created successfully',
      HttpStatus.CREATED,
    );
  }

  @Get('post/:postId')
  async getCommentsByPost(
    @Param('postId') postId: string,
    @Query() query: GetCommentsDto,
    @CurrentUser('id') userId?: string,
  ): Promise<ApiResponse<any>> {
    const comments = await this.commentService.getCommentsByPost(
      postId,
      query,
      userId,
    );

    return this.createResponse(comments, 'Comments retrieved successfully');
  }

  @Get(':commentId')
  async getCommentById(
    @Param('commentId') commentId: string,
    @CurrentUser('id') userId?: string,
  ): Promise<ApiResponse<any>> {
    const comment = await this.commentService.getCommentById(commentId, userId);

    return this.createResponse(comment, 'Comment retrieved successfully');
  }

  @Get(':commentId/with-replies')
  async getCommentWithReplies(
    @Param('commentId') commentId: string,
    @Query() query: GetRepliesDto,
    @CurrentUser('id') userId?: string,
  ): Promise<ApiResponse<any>> {
    const comment = await this.commentService.getCommentWithReplies(
      commentId,
      query,
      userId,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Comment with replies retrieved successfully',
      success: true,
      data: comment,
    };
  }

  @Get(':commentId/replies')
  async getReplies(
    @Param('commentId') commentId: string,
    @Query() query: GetRepliesDto,
    @CurrentUser('id') userId?: string,
  ): Promise<ApiResponse<any>> {
    const replies = await this.commentService.getRepliesForComment(
      commentId,
      query,
      userId,
    );

    return this.createResponse(replies, 'Replies retrieved successfully');
  }

  @Put(':commentId')
  async updateComment(
    @Param('commentId') commentId: string,
    @Body() updateDto: UpdateCommentDto,
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponse<any>> {
    const comment = await this.commentService.updateComment(
      commentId,
      updateDto,
      userId,
    );

    return this.createResponse(comment, 'Comment updated successfully');
  }

  @Delete(':commentId')
  async deleteComment(
    @Param('commentId') commentId: string,
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponse<any>> {
    await this.commentService.deleteComment(commentId, userId);

    return this.createResponse(null, 'Comment deleted successfully');
  }

  @Post(':commentId/reactions')
  async addReaction(
    @Param('commentId') commentId: string,
    @Body() reactionDto: AddCommentReactionDto,
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponse<any>> {
    const result = await this.commentService.addReaction(
      commentId,
      reactionDto,
      userId,
    );

    return this.createResponse(result, 'Reaction added successfully');
  }

  @Delete(':commentId/reactions/:reactionType')
  async removeReaction(
    @Param('commentId') commentId: string,
    @Param('reactionType') reactionType: string,
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponse<any>> {
    const result = await this.commentService.removeReaction(
      commentId,
      reactionType,
      userId,
    );

    return this.createResponse(result, 'Reaction removed successfully');
  }

  @Post(':commentId/reactions/toggle')
  async toggleReaction(
    @Param('commentId') commentId: string,
    @Body() reactionDto: AddCommentReactionDto,
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponse<any>> {
    const result = await this.commentService.toggleReaction(
      commentId,
      reactionDto,
      userId,
    );

    return this.createResponse(result, 'Reaction toggled successfully');
  }

  @Get('author/:authorId')
  async getCommentsByAuthor(
    @Param('authorId') authorId: string,
    @Query() query: GetCommentsDto,
    @CurrentUser('id') userId?: string,
  ): Promise<ApiResponse<any>> {
    const comments = await this.commentService.getCommentsByAuthor(
      authorId,
      query,
      userId,
    );

    return this.createResponse(
      comments,
      'Comments by author retrieved successfully',
    );
  }
}
