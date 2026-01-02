import { ReactionType, TargetType } from '../../constants';

// Application layer DTOs for use cases - internal data structures
export interface CreateReactionDto {
  postId?: string;
  commentId?: string;
  type: ReactionType;
}

export interface UpdateReactionDto {
  type: ReactionType;
}

export interface LegacyGetReactionsQuery {
  postId?: string;
  commentId?: string;
  reactorId?: string;
  targetType?: TargetType;
  limit?: number;
  offset?: number;
}
