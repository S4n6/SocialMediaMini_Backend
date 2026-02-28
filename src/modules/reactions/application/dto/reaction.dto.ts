import { ReactionTypeValue } from '../../domain/value-objects/reaction-type.value-object';
import { TargetTypeValue } from '../../domain/value-objects/target-type.value-object';

/**
 * Application-layer DTOs for use cases
 */
export interface CreateReactionDto {
  postId?: string;
  commentId?: string;
  type: ReactionTypeValue;
}

export interface GetReactionsQuery {
  postId?: string;
  commentId?: string;
  reactorId?: string;
  targetType?: TargetTypeValue;
  limit?: number;
  offset?: number;
}
