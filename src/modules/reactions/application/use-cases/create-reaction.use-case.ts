import { Injectable, Inject } from '@nestjs/common';
import { ReactionRepository } from '../../domain/repositories/reaction.repository';
import { ReactionFactory } from '../../domain/factories/reaction.factory';
import { ReactionDomainService } from '../../domain/services/reaction-domain.service';
import { CreateReactionDto } from '../dto/reaction.dto';
import { CreateReactionResponseDto } from '../dto/reaction-response.dto';
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
} from '../interfaces/tokens';
import {
  InvalidReactionTargetException,
  PostNotFoundException,
  CommentNotFoundException,
} from '../../domain/reaction.exceptions';

@Injectable()
export class CreateReactionUseCase {
  constructor(
    private readonly reactionRepository: ReactionRepository,
    private readonly reactionFactory: ReactionFactory,
    private readonly reactionDomainService: ReactionDomainService,
    @Inject(EXTERNAL_POST_SERVICE)
    private readonly postService: ExternalPostService,
    @Inject(EXTERNAL_COMMENT_SERVICE)
    private readonly commentService: ExternalCommentService,
    @Inject(NOTIFICATION_SERVICE)
    private readonly notificationService: NotificationService,
  ) {}

  async execute(
    dto: CreateReactionDto,
    userId: string,
  ): Promise<CreateReactionResponseDto> {
    const { postId, commentId, type } = dto;

    // Validate target
    if (!postId && !commentId) {
      throw new InvalidReactionTargetException();
    }

    let targetId: string;
    let targetType: 'post' | 'comment';
    let targetAuthorId: string;
    let targetContent: string;

    if (postId) {
      const post = await this.postService.findById(postId);
      if (!post) {
        throw new PostNotFoundException(postId);
      }
      targetId = postId;
      targetType = 'post';
      targetAuthorId = post.authorId;
      targetContent = post.content;
    } else {
      const comment = await this.commentService.findById(commentId!);
      if (!comment) {
        throw new CommentNotFoundException(commentId!);
      }
      targetId = commentId!;
      targetType = 'comment';
      targetAuthorId = comment.authorId;
      targetContent = comment.content;
    }

    // Create or update reaction
    const { reaction, isNew } =
      await this.reactionDomainService.createOrUpdateReaction(
        type.toUpperCase() as any,
        userId,
        targetId,
        targetType,
      );

    // Send notification if it's a new reaction and not self-reaction
    if (isNew && targetAuthorId !== userId) {
      try {
        await this.notificationService.createReactionNotification({
          reactorId: userId,
          targetUserId: targetAuthorId,
          entityId: targetId,
          entityType: targetType,
          content: targetContent,
        });
      } catch (error) {
        // Log error but don't fail the reaction creation
        console.error('Failed to create reaction notification:', error);
      }
    }

    return {
      message: isNew
        ? 'Reaction created successfully'
        : 'Reaction updated successfully',
      reacted: true,
      reaction: ReactionMapper.toResponseDto(reaction),
      isNew,
    };
  }
}
