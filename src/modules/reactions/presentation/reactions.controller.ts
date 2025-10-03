import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ReactionApplicationService } from '../application/reaction-application.service';
import { JwtAuthGuard } from '../../../shared/guards/jwt.guard';
import {
  CreateReactionDto,
  GetReactionsQuery,
} from '../application/dto/reaction.dto';
import { CurrentUser } from '../../../shared/decorators/currentUser.decorator';
import { ApiResponse } from '../../../shared/common/interfaces/api-response.interface';
import {
  CreateReactionResponseDto,
  ReactionResponseDto,
  PostReactionsResponseDto,
  ReactionStatusResponseDto,
} from '../application/dto/reaction-response.dto';

@Controller('reactions')
@UseGuards(JwtAuthGuard)
export class ReactionsController {
  constructor(
    private readonly reactionApplicationService: ReactionApplicationService,
  ) {}

  @Post()
  async create(
    @Body() createReactionDto: CreateReactionDto,
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponse<CreateReactionResponseDto>> {
    const result = await this.reactionApplicationService.createReaction(
      createReactionDto,
      userId,
    );

    return {
      success: true,
      message: result.message,
      data: result,
    };
  }

  @Get()
  async findAll(
    @Query() query: GetReactionsQuery,
  ): Promise<ApiResponse<ReactionResponseDto[]>> {
    const result = await this.reactionApplicationService.getReactions(query);

    return {
      success: true,
      message: 'Reactions retrieved successfully',
      data: result,
    };
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
  ): Promise<ApiResponse<ReactionResponseDto>> {
    const result = await this.reactionApplicationService.getReaction(id);

    return {
      success: true,
      message: 'Reaction retrieved successfully',
      data: result,
    };
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponse<{ message: string }>> {
    const result = await this.reactionApplicationService.deleteReaction(
      id,
      userId,
    );

    return {
      success: true,
      message: 'Reaction removed successfully',
      data: result,
    };
  }

  @Get('post/:postId')
  async getPostReactions(
    @Param('postId') postId: string,
  ): Promise<ApiResponse<PostReactionsResponseDto>> {
    const result =
      await this.reactionApplicationService.getPostReactions(postId);

    return {
      success: true,
      message: 'Post reactions retrieved successfully',
      data: result,
    };
  }

  @Get('post/:postId/check/:userId')
  async checkUserLiked(
    @Param('postId') postId: string,
    @Param('userId') userId: string,
  ): Promise<ApiResponse<ReactionStatusResponseDto>> {
    const result = await this.reactionApplicationService.getReactionStatus(
      postId,
      userId,
    );

    return {
      success: true,
      message: 'User reaction status retrieved successfully',
      data: result,
    };
  }

  @Get('post/:postId/my-status')
  async checkMyReactionStatus(
    @Param('postId') postId: string,
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponse<ReactionStatusResponseDto>> {
    const result = await this.reactionApplicationService.getReactionStatus(
      postId,
      userId,
    );

    return {
      success: true,
      message: 'Your reaction status retrieved successfully',
      data: result,
    };
  }
}
