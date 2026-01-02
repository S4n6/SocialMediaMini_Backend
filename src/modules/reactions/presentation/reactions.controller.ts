import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  Logger,
  Inject,
} from '@nestjs/common';
import { ReactionApplicationService } from '../application';
import { JwtAuthGuard } from '../../../shared/guards/jwt.guard';
import {
  CreateReactionRequestDto,
  GetReactionsQueryDto,
} from './dto/reaction-request.dto';
import {
  CreateReactionResponseDto,
  ReactionResponseDto,
  PostReactionsResponseDto,
  ReactionStatusResponseDto,
} from './dto/reaction-response.dto';
import { CurrentUser } from '../../../shared/decorators/currentUser.decorator';
import { ApiResponse } from '../../../shared/utils/interfaces/api-response.interface';
import { ReactionPresentationMapper } from './mappers/reaction-presentation.mapper';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { IMetricsAdapter } from '../infrastructure/adapters';
// Remove unused import for now

@Controller('reactions')
@UseGuards(JwtAuthGuard)
@UseInterceptors(CacheInterceptor)
export class ReactionsController {
  private readonly logger = new Logger(ReactionsController.name);

  constructor(
    private readonly reactionApplicationService: ReactionApplicationService,
    @Inject('METRICS_ADAPTER')
    private readonly metricsAdapter: IMetricsAdapter,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createReactionDto: CreateReactionRequestDto,
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponse<CreateReactionResponseDto>> {
    const stopTimer = this.metricsAdapter.startTimer(
      'reaction_create_duration',
    );
    const operation = 'create_reaction';

    try {
      const targetType = createReactionDto.postId ? 'post' : 'comment';
      const targetId = createReactionDto.postId || createReactionDto.commentId;

      this.logger.debug(`Creating reaction for user ${userId}`, {
        targetType,
        targetId,
        reactionType: createReactionDto.type,
      });

      const result = await this.reactionApplicationService.createReaction(
        ReactionPresentationMapper.toCreateReactionDto(createReactionDto),
        userId,
      );

      this.metricsAdapter.incrementCounter('reaction_created_total', {
        target_type: targetType,
        reaction_type: createReactionDto.type,
      });

      this.logger.log(`Reaction created successfully`, {
        userId,
        reactionId: result.reaction.id,
      });

      return {
        success: true,
        message: result.message,
        data: result,
      };
    } catch (error) {
      const targetType = createReactionDto.postId ? 'post' : 'comment';
      this.metricsAdapter.incrementCounter('reaction_create_error_total', {
        target_type: targetType,
        error_type: error instanceof Error ? error.constructor.name : 'Unknown',
      });

      this.logger.error(`Failed to create reaction for user ${userId}`, error);
      throw error;
    } finally {
      stopTimer();
    }
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query() query: GetReactionsQueryDto,
  ): Promise<ApiResponse<ReactionResponseDto[]>> {
    const stopTimer = this.metricsAdapter.startTimer('reaction_list_duration');

    try {
      this.logger.debug('Fetching reactions', { query });

      const result = await this.reactionApplicationService.getReactions(
        ReactionPresentationMapper.toGetReactionsQuery(query),
      );

      this.metricsAdapter.incrementCounter('reaction_list_success_total', {
        target_type: query.targetType || 'all',
      });

      this.logger.log(`Retrieved ${result.length} reactions`);

      return {
        success: true,
        message: 'Reactions retrieved successfully',
        data: result,
      };
    } catch (error) {
      this.metricsAdapter.incrementCounter('reaction_list_error_total', {
        target_type: query.targetType || 'all',
        error_type: error instanceof Error ? error.constructor.name : 'Unknown',
      });

      this.logger.error('Failed to fetch reactions', error);
      throw error;
    } finally {
      stopTimer();
    }
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
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponse<{ message: string }>> {
    const stopTimer = this.metricsAdapter.startTimer(
      'reaction_delete_duration',
    );

    try {
      this.logger.debug(`Deleting reaction ${id} for user ${userId}`);

      const result = await this.reactionApplicationService.deleteReaction(
        id,
        userId,
      );

      this.metricsAdapter.incrementCounter('reaction_deleted_total', {
        user_id: userId,
      });

      this.logger.log(`Reaction ${id} deleted successfully`);

      return {
        success: true,
        message: 'Reaction removed successfully',
        data: result,
      };
    } catch (error) {
      this.metricsAdapter.incrementCounter('reaction_delete_error_total', {
        error_type: error instanceof Error ? error.constructor.name : 'Unknown',
      });

      this.logger.error(`Failed to delete reaction ${id}`, error);
      throw error;
    } finally {
      stopTimer();
    }
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

  @Get('health')
  @HttpCode(HttpStatus.OK)
  async getHealth(): Promise<
    ApiResponse<{
      status: string;
      metrics: any;
      timestamp: Date;
    }>
  > {
    try {
      const metrics = await this.metricsAdapter.getMetrics();

      return {
        success: true,
        message: 'Health check completed',
        data: {
          status: 'healthy',
          metrics,
          timestamp: new Date(),
        },
      };
    } catch (error) {
      this.logger.error('Health check failed', error);
      return {
        success: false,
        message: 'Health check failed',
        data: {
          status: 'unhealthy',
          metrics: {},
          timestamp: new Date(),
        },
      };
    }
  }

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  async getStats(): Promise<ApiResponse<any>> {
    try {
      const metrics = await this.metricsAdapter.getMetrics();

      return {
        success: true,
        message: 'Statistics retrieved successfully',
        data: metrics,
      };
    } catch (error) {
      this.logger.error('Failed to get statistics', error);
      throw error;
    }
  }
}
