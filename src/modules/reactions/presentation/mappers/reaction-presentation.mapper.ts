import { ReactionType } from '../../constants';
import {
  CreateReactionDto,
  LegacyGetReactionsQuery,
} from '../../application/dto/reaction.dto';
import {
  CreateReactionRequestDto,
  GetReactionsQueryDto,
} from '../dto/reaction-request.dto';

export class ReactionPresentationMapper {
  static toCreateReactionDto(
    request: CreateReactionRequestDto,
  ): CreateReactionDto {
    return {
      postId: request.postId,
      commentId: request.commentId,
      type: request.type as ReactionType,
    };
  }

  static toGetReactionsQuery(
    query: GetReactionsQueryDto,
  ): LegacyGetReactionsQuery {
    return {
      postId: query.postId,
      commentId: query.commentId,
      reactorId: query.reactorId,
      targetType: query.targetType,
    };
  }
}
