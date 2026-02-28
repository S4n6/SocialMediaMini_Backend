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
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ReactionApplicationService } from '../application';
import { JwtAuthGuard } from '../../../shared/guards/jwt.guard';
import {
  CreateReactionRequestDto,
  GetReactionsQueryDto,
} from './dto/reaction-request.dto';
import { CurrentUser } from '../../../shared/decorators/currentUser.decorator';
import { ApiResponse } from '../../../shared/utils/interfaces/api-response.interface';
import { ReactionPresentationMapper } from './mappers/reaction-presentation.mapper';
import {
  ReactionNotFoundException,
  PostNotFoundException,
  CommentNotFoundException,
  InvalidReactionTargetException,
  InvalidReactionTypeException,
  UnauthorizedReactionException,
  ReactionDomainException,
} from '../domain/exceptions/reaction.exceptions';

@Controller('reactions')
@UseGuards(JwtAuthGuard)
export class ReactionsController {
  constructor(
    private readonly reactionApplicationService: ReactionApplicationService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateReactionRequestDto,
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponse<unknown>> {
    try {
      const result = await this.reactionApplicationService.createReaction(
        ReactionPresentationMapper.toCreateReactionDto(dto),
        userId,
      );
      return { success: true, message: result.message, data: result };
    } catch (error) {
      throw this.mapDomainError(error);
    }
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query() query: GetReactionsQueryDto,
  ): Promise<ApiResponse<unknown>> {
    try {
      const result = await this.reactionApplicationService.getReactions(
        ReactionPresentationMapper.toGetReactionsQuery(query),
      );
      return {
        success: true,
        message: 'Reactions retrieved successfully',
        data: result,
      };
    } catch (error) {
      throw this.mapDomainError(error);
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ApiResponse<unknown>> {
    try {
      const result = await this.reactionApplicationService.getReaction(id);
      return {
        success: true,
        message: 'Reaction retrieved successfully',
        data: result,
      };
    } catch (error) {
      throw this.mapDomainError(error);
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponse<unknown>> {
    try {
      const result = await this.reactionApplicationService.deleteReaction(
        id,
        userId,
      );
      return {
        success: true,
        message: 'Reaction removed successfully',
        data: result,
      };
    } catch (error) {
      throw this.mapDomainError(error);
    }
  }

  @Get('post/:postId')
  async getPostReactions(
    @Param('postId') postId: string,
  ): Promise<ApiResponse<unknown>> {
    try {
      const result =
        await this.reactionApplicationService.getPostReactions(postId);
      return {
        success: true,
        message: 'Post reactions retrieved successfully',
        data: result,
      };
    } catch (error) {
      throw this.mapDomainError(error);
    }
  }

  @Get('post/:postId/check/:userId')
  async checkUserReactionStatus(
    @Param('postId') postId: string,
    @Param('userId') userId: string,
  ): Promise<ApiResponse<unknown>> {
    try {
      const result = await this.reactionApplicationService.getReactionStatus(
        postId,
        userId,
      );
      return {
        success: true,
        message: 'Reaction status retrieved',
        data: result,
      };
    } catch (error) {
      throw this.mapDomainError(error);
    }
  }

  @Get('post/:postId/my-status')
  async checkMyReactionStatus(
    @Param('postId') postId: string,
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponse<unknown>> {
    try {
      const result = await this.reactionApplicationService.getReactionStatus(
        postId,
        userId,
      );
      return {
        success: true,
        message: 'Your reaction status retrieved',
        data: result,
      };
    } catch (error) {
      throw this.mapDomainError(error);
    }
  }

  /**
   * Maps pure domain exceptions to NestJS HTTP exceptions
   * Uses instanceof checks as recommended by the refactoring checklist
   */
  private mapDomainError(error: unknown): Error {
    if (
      error instanceof ReactionNotFoundException ||
      error instanceof PostNotFoundException ||
      error instanceof CommentNotFoundException
    ) {
      return new NotFoundException(error.message);
    }

    if (
      error instanceof InvalidReactionTargetException ||
      error instanceof InvalidReactionTypeException
    ) {
      return new BadRequestException(error.message);
    }

    if (error instanceof UnauthorizedReactionException) {
      return new ForbiddenException(error.message);
    }

    // Re-throw unknown domain exceptions as bad request
    if (error instanceof ReactionDomainException) {
      return new BadRequestException(error.message);
    }

    // Re-throw NestJS/unknown exceptions as-is
    return error instanceof Error ? error : new Error(String(error));
  }
}
