import { ReactionEntity } from '../entities/reaction.entity';
import { TargetTypeValue } from '../value-objects/target-type.value-object';

export interface FindReactionsOptions {
  postId?: string;
  commentId?: string;
  reactorId?: string;
  targetType?: TargetTypeValue;
  limit?: number;
  offset?: number;
}

export interface ReactionWithReactor {
  reaction: ReactionEntity;
  reactor: {
    id: string;
    fullName: string;
    avatar: string | null;
  };
}

export interface PostReactionsResult {
  postId: string;
  totalReactions: number;
  reactions: ReactionWithReactor[];
}

export interface ReactionStatusResult {
  targetId: string;
  userId: string;
  reacted: boolean;
  reactionId: string | null;
  reactionType: string | null;
}

/**
 * Repository interface for Reaction aggregate
 * Domain layer - pure interface, no framework dependencies
 */
export interface IReactionRepository {
  save(reaction: ReactionEntity): Promise<ReactionEntity>;
  findById(id: string): Promise<ReactionEntity | null>;
  delete(id: string): Promise<void>;
  findByUserAndTarget(
    userId: string,
    targetId: string,
    targetType: TargetTypeValue,
  ): Promise<ReactionEntity | null>;
  findAll(options?: FindReactionsOptions): Promise<ReactionEntity[]>;
  getPostReactions(postId: string): Promise<PostReactionsResult>;
  getReactionStatus(
    targetId: string,
    userId: string,
    targetType: TargetTypeValue,
  ): Promise<ReactionStatusResult>;
  countByTarget(targetId: string, targetType: TargetTypeValue): Promise<number>;
}
