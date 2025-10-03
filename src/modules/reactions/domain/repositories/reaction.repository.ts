import { ReactionEntity } from '../reaction.entity';

export interface FindReactionsOptions {
  postId?: string;
  commentId?: string;
  reactorId?: string;
  targetType?: 'post' | 'comment';
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

export abstract class ReactionRepository {
  abstract save(reaction: ReactionEntity): Promise<ReactionEntity>;
  abstract findById(id: string): Promise<ReactionEntity | null>;
  abstract findByUserAndTarget(
    userId: string,
    targetId: string,
    targetType: 'post' | 'comment',
  ): Promise<ReactionEntity | null>;
  abstract findAll(options?: FindReactionsOptions): Promise<ReactionEntity[]>;
  abstract findAllWithReactor(
    options?: FindReactionsOptions,
  ): Promise<ReactionWithReactor[]>;
  abstract delete(id: string): Promise<void>;
  abstract getPostReactions(postId: string): Promise<PostReactionsResult>;
  abstract getReactionStatus(
    targetId: string,
    userId: string,
    targetType: 'post' | 'comment',
  ): Promise<ReactionStatusResult>;
  abstract countByTarget(
    targetId: string,
    targetType: 'post' | 'comment',
  ): Promise<number>;
}
