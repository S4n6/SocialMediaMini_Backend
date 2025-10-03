import { ReactionEntity } from '../../domain/reaction.entity';
import {
  ReactionResponseDto,
  PostReactionsResponseDto,
  ReactionStatusResponseDto,
} from '../dto/reaction-response.dto';
import {
  ReactionWithReactor,
  PostReactionsResult,
  ReactionStatusResult,
} from '../../domain/repositories/reaction.repository';

export class ReactionMapper {
  static toResponseDto(entity: ReactionEntity): ReactionResponseDto {
    return {
      id: entity.id,
      type: entity.type,
      reactorId: entity.reactorId,
      postId: entity.postId,
      commentId: entity.commentId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  static toResponseDtoWithReactor(
    data: ReactionWithReactor,
  ): ReactionResponseDto {
    return {
      ...this.toResponseDto(data.reaction),
      reactor: data.reactor,
    };
  }

  static toPostReactionsResponseDto(
    result: PostReactionsResult,
  ): PostReactionsResponseDto {
    return {
      postId: result.postId,
      totalReactions: result.totalReactions,
      reactions: result.reactions.map((reactionWithReactor) => ({
        reaction: this.toResponseDto(reactionWithReactor.reaction),
        reactor: reactionWithReactor.reactor,
      })),
    };
  }

  static toReactionStatusResponseDto(
    result: ReactionStatusResult,
  ): ReactionStatusResponseDto {
    return {
      targetId: result.targetId,
      userId: result.userId,
      reacted: result.reacted,
      reactionId: result.reactionId,
      reactionType: result.reactionType,
    };
  }

  static toResponseDtoArray(entities: ReactionEntity[]): ReactionResponseDto[] {
    return entities.map((entity) => this.toResponseDto(entity));
  }
}
