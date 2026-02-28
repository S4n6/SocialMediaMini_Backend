import { ReactionEntity } from '../../domain';
import {
  ReactionResponseDto,
  PostReactionsResponseDto,
  ReactionStatusResponseDto,
} from '../dto/reaction-response.dto';
import {
  ReactionWithReactor,
  PostReactionsResult,
  ReactionStatusResult,
} from '../../domain/repositories/i-reaction.repository';

/**
 * Mapper between domain entities and application DTOs
 */
export class ReactionMapper {
  static toResponseDto(entity: ReactionEntity): ReactionResponseDto {
    return {
      id: entity.id,
      type: entity.type,
      reactorId: entity.reactorId,
      postId: entity.postId,
      commentId: entity.commentId,
      createdAt: entity.createdAt,
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
      reactions: result.reactions.map((r) => ({
        reaction: this.toResponseDto(r.reaction),
        reactor: r.reactor,
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
