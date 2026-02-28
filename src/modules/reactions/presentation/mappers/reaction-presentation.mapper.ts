import { ReactionTypeValue } from '../../domain/value-objects/reaction-type.value-object';
import {
  CreateReactionDto,
  GetReactionsQuery,
} from '../../application/dto/reaction.dto';
import {
  CreateReactionRequestDto,
  GetReactionsQueryDto,
} from '../dto/reaction-request.dto';

/**
 * Maps presentation DTOs to application DTOs
 */
export class ReactionPresentationMapper {
  static toCreateReactionDto(
    request: CreateReactionRequestDto,
  ): CreateReactionDto {
    return {
      postId: request.postId,
      commentId: request.commentId,
      type: request.type as ReactionTypeValue,
    };
  }

  static toGetReactionsQuery(query: GetReactionsQueryDto): GetReactionsQuery {
    return {
      postId: query.postId,
      commentId: query.commentId,
      reactorId: query.reactorId,
      targetType: query.targetType,
    };
  }
}
