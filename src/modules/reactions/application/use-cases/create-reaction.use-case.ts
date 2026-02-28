import { Injectable, Inject, Logger } from '@nestjs/common';
import {
  ReactionEntity,
  IReactionRepository,
  ReactionType,
  InvalidReactionTargetException,
  PostNotFoundException,
  CommentNotFoundException,
} from '../../domain';
import { CreateReactionDto } from '../dto/reaction.dto';
import { CreateReactionResponseDto } from '../dto/reaction-response.dto';
import { ReactionMapper } from '../mappers/reaction.mapper';
import {
  IExternalPostService,
  IExternalCommentService,
  INotificationService,
} from '../ports/i-external-services';
import {
  REACTION_REPOSITORY_TOKEN,
  EXTERNAL_POST_SERVICE_TOKEN,
  EXTERNAL_COMMENT_SERVICE_TOKEN,
  NOTIFICATION_SERVICE_TOKEN,
} from '../../constants';
import { ReactionTypeValue } from '../../domain/value-objects/reaction-type.value-object';

@Injectable()
export class CreateReactionUseCase {
  private readonly logger = new Logger(CreateReactionUseCase.name);

  constructor(
    @Inject(REACTION_REPOSITORY_TOKEN)
    private readonly reactionRepository: IReactionRepository,
    @Inject(EXTERNAL_POST_SERVICE_TOKEN)
    private readonly postService: IExternalPostService,
    @Inject(EXTERNAL_COMMENT_SERVICE_TOKEN)
    private readonly commentService: IExternalCommentService,
    @Inject(NOTIFICATION_SERVICE_TOKEN)
    private readonly notificationService: INotificationService,
  ) {}

  async execute(
    dto: CreateReactionDto,
    userId: string,
  ): Promise<CreateReactionResponseDto> {
    const { postId, commentId, type } = dto;

    // 1. Determine target
    if (!postId && !commentId) {
      throw new InvalidReactionTargetException();
    }

    const targetId = (postId || commentId)!;
    const targetType = postId ? ('post' as const) : ('comment' as const);

    // 2. Validate target exists
    const targetInfo = await this.validateTargetExists(targetId, targetType);

    // 3. Check for existing reaction (toggle/update behavior)
    const existingReaction = await this.reactionRepository.findByUserAndTarget(
      userId,
      targetId,
      targetType,
    );

    if (existingReaction) {
      return this.handleExistingReaction(existingReaction, type);
    }

    // 4. Create new reaction
    return this.createNewReaction(
      type,
      userId,
      targetId,
      targetType,
      targetInfo,
    );
  }

  private async handleExistingReaction(
    existing: ReactionEntity,
    newType: ReactionTypeValue,
  ): Promise<CreateReactionResponseDto> {
    const reactionType = ReactionType.create(newType);

    if (existing.isSameType(reactionType.getValue())) {
      // Toggle off: same type → remove
      existing.markForRemoval();
      await this.reactionRepository.delete(existing.id);
      return {
        message: 'Reaction removed',
        reacted: false,
        reaction: ReactionMapper.toResponseDto(existing),
        isNew: false,
      };
    }

    // Different type → update
    existing.changeType(reactionType.getValue());
    const updated = await this.reactionRepository.save(existing);
    return {
      message: 'Reaction updated successfully',
      reacted: true,
      reaction: ReactionMapper.toResponseDto(updated),
      isNew: false,
    };
  }

  private async createNewReaction(
    type: ReactionTypeValue,
    userId: string,
    targetId: string,
    targetType: 'post' | 'comment',
    targetInfo: { authorId: string; content: string },
  ): Promise<CreateReactionResponseDto> {
    const reactionType = ReactionType.create(type);
    const reaction = ReactionEntity.create(
      reactionType.getValue(),
      userId,
      targetId,
      targetType,
    );

    const saved = await this.reactionRepository.save(reaction);

    // Side effect: send notification (non-blocking)
    if (targetInfo.authorId !== userId) {
      this.sendNotification(userId, targetInfo, targetId, targetType).catch(
        (err) => this.logger.warn('Notification failed', err.message),
      );
    }

    return {
      message: 'Reaction created successfully',
      reacted: true,
      reaction: ReactionMapper.toResponseDto(saved),
      isNew: true,
    };
  }

  private async validateTargetExists(
    targetId: string,
    targetType: 'post' | 'comment',
  ): Promise<{ authorId: string; content: string }> {
    if (targetType === 'post') {
      const post = await this.postService.findById(targetId);
      if (!post) throw new PostNotFoundException(targetId);
      return { authorId: post.authorId, content: post.content };
    }

    const comment = await this.commentService.findById(targetId);
    if (!comment) throw new CommentNotFoundException(targetId);
    return { authorId: comment.authorId, content: comment.content };
  }

  private async sendNotification(
    reactorId: string,
    targetInfo: { authorId: string; content: string },
    targetId: string,
    targetType: 'post' | 'comment',
  ): Promise<void> {
    await this.notificationService.createReactionNotification({
      reactorId,
      targetUserId: targetInfo.authorId,
      entityId: targetId,
      entityType: targetType,
      content: targetInfo.content,
    });
  }
}
