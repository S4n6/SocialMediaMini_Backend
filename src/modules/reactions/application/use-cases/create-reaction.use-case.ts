import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  ReactionRepository,
  ReactionFactory,
  ReactionDomainService,
  ReactionOperationService,
  ReactionType,
  TargetType,
  InvalidReactionTargetException,
  PostNotFoundException,
  CommentNotFoundException,
  ReactionCreatedEvent,
  ReactionUpdatedEvent,
} from '../../domain';
import { CreateReactionDto } from '../dto/reaction.dto';
import { CreateReactionResponseDto } from '../dto/reaction-response.dto';
import { CreateReactionCommand } from '../dto/commands/reaction-commands.dto';
import { ReactionMapper } from '../mappers/reaction.mapper';
import {
  ExternalPostService,
  ExternalCommentService,
  NotificationService,
} from '../interfaces/external-services.interface';
import {
  EXTERNAL_POST_SERVICE,
  EXTERNAL_COMMENT_SERVICE,
  NOTIFICATION_SERVICE,
} from '../../constants';

export interface CreateReactionContext {
  command: CreateReactionCommand;
  targetInfo: {
    id: string;
    type: 'post' | 'comment';
    authorId: string;
    content: string;
    exists: boolean;
  };
  reactorInfo: {
    id: string;
    canReact: boolean;
    reason?: string;
  };
}

/**
 * Enhanced Create Reaction Use Case with better error handling,
 * logging, and separation of concerns
 */
@Injectable()
export class CreateReactionUseCase {
  private readonly logger = new Logger(CreateReactionUseCase.name);

  constructor(
    private readonly reactionRepository: ReactionRepository,
    private readonly reactionFactory: ReactionFactory,
    private readonly reactionDomainService: ReactionDomainService,
    private readonly reactionOperationService: ReactionOperationService,
    @Inject(EXTERNAL_POST_SERVICE)
    private readonly postService: ExternalPostService,
    @Inject(EXTERNAL_COMMENT_SERVICE)
    private readonly commentService: ExternalCommentService,
    @Inject(NOTIFICATION_SERVICE)
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Execute the create reaction use case with enhanced error handling
   */
  async execute(
    dto: CreateReactionDto,
    userId: string,
  ): Promise<CreateReactionResponseDto> {
    this.logger.debug(`Executing create reaction for user ${userId}`, { dto });

    try {
      // Build context from DTO
      const context = await this.buildContext(dto, userId);

      // Validate context
      await this.validateContext(context);

      // Execute business logic
      const result = await this.executeBusinessLogic(context);

      // Handle side effects
      await this.handleSideEffects(result, context);

      this.logger.debug(`Successfully created/updated reaction`, {
        reactionId: result.reaction.id,
        isNew: result.isNew,
      });

      return this.buildResponse(result, context);
    } catch (error) {
      this.logger.error(`Failed to create reaction for user ${userId}`, {
        error: error.message,
        dto,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Legacy execute method for backward compatibility
   */
  async executeLegacy(
    dto: CreateReactionDto,
    userId: string,
  ): Promise<CreateReactionResponseDto> {
    return this.execute(dto, userId);
  }

  private async buildContext(
    dto: CreateReactionDto,
    userId: string,
  ): Promise<CreateReactionContext> {
    const { postId, commentId, type } = dto;

    // Validate basic input
    if (!postId && !commentId) {
      throw new InvalidReactionTargetException();
    }

    // Build command
    const command = ReactionMapper.toCreateReactionCommand(dto, userId);

    // Get target info
    const targetInfo = await this.getTargetInfo(postId, commentId);

    // Build reactor info
    const reactorInfo = {
      id: userId,
      canReact: true, // Could add more sophisticated logic
    };

    return {
      command,
      targetInfo,
      reactorInfo,
    };
  }

  private async validateContext(context: CreateReactionContext): Promise<void> {
    // Validate target exists
    if (!context.targetInfo.exists) {
      const targetType = context.command.targetType;
      const targetId = context.command.targetId;

      if (targetType === 'post') {
        throw new PostNotFoundException(targetId);
      } else {
        throw new CommentNotFoundException(targetId);
      }
    }

    // Validate reactor can react
    if (!context.reactorInfo.canReact) {
      throw new Error(`User cannot react: ${context.reactorInfo.reason}`);
    }

    // Additional business rule validations could go here
  }

  private async executeBusinessLogic(context: CreateReactionContext) {
    const { command } = context;

    // Use the new operation service
    const reactionType = ReactionType.create(command.reactionType);
    const targetType = TargetType.create(command.targetType);

    const result = await this.reactionOperationService.processReaction(
      reactionType,
      command.reactorId,
      command.targetId,
      targetType,
    );

    return result;
  }

  private async handleSideEffects(
    result: any,
    context: CreateReactionContext,
  ): Promise<void> {
    const { targetInfo, command } = context;

    // Send notification if it's a new reaction and not self-reaction
    if (result.isNew && targetInfo.authorId !== command.reactorId) {
      try {
        await this.notificationService.createReactionNotification({
          reactorId: command.reactorId,
          targetUserId: targetInfo.authorId,
          entityId: targetInfo.id,
          entityType: targetInfo.type,
          content: targetInfo.content,
        });

        this.logger.debug(`Notification sent for new reaction`, {
          reactionId: result.reaction.id,
          targetAuthor: targetInfo.authorId,
        });
      } catch (error) {
        this.logger.warn('Failed to create reaction notification', {
          error: error.message,
          reactionId: result.reaction.id,
        });
        // Don't fail the reaction creation for notification errors
      }
    }

    // Could publish domain events here
    // this.eventBus.publish(new ReactionCreatedEvent(...));
  }

  private buildResponse(
    result: any,
    context: CreateReactionContext,
  ): CreateReactionResponseDto {
    return {
      message: result.isNew
        ? 'Reaction created successfully'
        : 'Reaction updated successfully',
      reacted: true,
      reaction: ReactionMapper.toResponseDto(result.reaction),
      isNew: result.isNew,
    };
  }

  private async getTargetInfo(
    postId?: string,
    commentId?: string,
  ): Promise<CreateReactionContext['targetInfo']> {
    if (postId) {
      const post = await this.postService.findById(postId);
      return {
        id: postId,
        type: 'post',
        authorId: post?.authorId || '',
        content: post?.content || '',
        exists: !!post,
      };
    } else if (commentId) {
      const comment = await this.commentService.findById(commentId);
      return {
        id: commentId,
        type: 'comment',
        authorId: comment?.authorId || '',
        content: comment?.content || '',
        exists: !!comment,
      };
    }

    throw new InvalidReactionTargetException();
  }
}
