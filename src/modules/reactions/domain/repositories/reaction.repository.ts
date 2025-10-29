import { ReactionEntity } from '../entities/reaction.entity';
import { TargetType } from '../../constants';

export interface FindReactionsOptions {
  postId?: string;
  commentId?: string;
  reactorId?: string;
  targetType?: TargetType;
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

// Base repository for basic CRUD operations
export interface IReactionBaseRepository {
  save(reaction: ReactionEntity): Promise<ReactionEntity>;
  findById(id: string): Promise<ReactionEntity | null>;
  delete(id: string): Promise<void>;
}

// Repository for finding reactions
export interface IReactionFinderRepository {
  findByUserAndTarget(
    userId: string,
    targetId: string,
    targetType: TargetType,
  ): Promise<ReactionEntity | null>;
  findAll(options?: FindReactionsOptions): Promise<ReactionEntity[]>;
  findAllWithReactor(
    options?: FindReactionsOptions,
  ): Promise<ReactionWithReactor[]>;
}

// Repository for statistics and aggregations
export interface IReactionStatsRepository {
  getPostReactions(postId: string): Promise<PostReactionsResult>;
  getReactionStatus(
    targetId: string,
    userId: string,
    targetType: TargetType,
  ): Promise<ReactionStatusResult>;
  countByTarget(targetId: string, targetType: TargetType): Promise<number>;
}

// Main repository interface combining all capabilities
export interface IReactionRepository
  extends IReactionBaseRepository,
    IReactionFinderRepository,
    IReactionStatsRepository {}

// Keep the abstract class for backward compatibility
export abstract class ReactionRepository implements IReactionRepository {
  abstract save(reaction: ReactionEntity): Promise<ReactionEntity>;
  abstract findById(id: string): Promise<ReactionEntity | null>;
  abstract findByUserAndTarget(
    userId: string,
    targetId: string,
    targetType: TargetType,
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
    targetType: TargetType,
  ): Promise<ReactionStatusResult>;
  abstract countByTarget(
    targetId: string,
    targetType: TargetType,
  ): Promise<number>;
}
