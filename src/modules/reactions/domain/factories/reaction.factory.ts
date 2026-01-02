import { Injectable } from '@nestjs/common';
import { ReactionEntity } from '../entities/reaction.entity';
import { ReactionType, TargetType } from '../value-objects';
import { InvalidReactionTypeException } from '../exceptions/reaction.exceptions';
import {
  VALID_REACTION_TYPES,
  ReactionType as ReactionTypeEnum,
} from '../../constants';

export interface ReactionCreationProps {
  type: string | ReactionTypeEnum;
  reactorId: string;
  targetId: string;
  targetType: string | 'post' | 'comment';
}

export interface ReactionPrimitiveProps {
  id: string;
  type: string;
  reactorId: string;
  postId?: string | null;
  commentId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Factory for creating ReactionEntity instances with proper validation
 * Ensures all created reactions are valid according to domain rules
 */
@Injectable()
export class ReactionFactory {
  /**
   * Creates a new reaction with validation
   */
  createReaction(props: ReactionCreationProps): ReactionEntity {
    const reactionType = ReactionType.create(props.type.toString());
    const targetType = TargetType.create(props.targetType.toString());

    return ReactionEntity.createNew(
      reactionType.getValue(),
      props.reactorId,
      props.targetId,
      targetType.getValue(),
    );
  }

  /**
   * Creates reaction from database/primitive data
   */
  createFromPrimitive(props: ReactionPrimitiveProps): ReactionEntity {
    const reactionType = ReactionType.create(props.type);

    return ReactionEntity.create({
      id: props.id,
      type: reactionType.getValue(),
      reactorId: props.reactorId,
      postId: props.postId,
      commentId: props.commentId,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    });
  }

  /**
   * Creates multiple reactions from primitive data
   */
  createManyFromPrimitive(
    propsArray: ReactionPrimitiveProps[],
  ): ReactionEntity[] {
    return propsArray.map((props) => this.createFromPrimitive(props));
  }

  /**
   * Validates if a type string is a valid reaction type
   */
  isValidReactionType(type: string): boolean {
    try {
      ReactionType.create(type);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validates if a target type string is valid
   */
  isValidTargetType(targetType: string): boolean {
    try {
      TargetType.create(targetType);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Gets all valid reaction types
   */
  getValidReactionTypes(): ReactionTypeEnum[] {
    return [...VALID_REACTION_TYPES];
  }

  /**
   * Gets all valid target types
   */
  getValidTargetTypes(): string[] {
    return ['post', 'comment'];
  }

  /**
   * Factory method for specific reaction types
   */
  static createLikeReaction(
    reactorId: string,
    targetId: string,
    targetType: 'post' | 'comment',
  ): ReactionEntity {
    return ReactionEntity.createNew('LIKE', reactorId, targetId, targetType);
  }

  static createLoveReaction(
    reactorId: string,
    targetId: string,
    targetType: 'post' | 'comment',
  ): ReactionEntity {
    return ReactionEntity.createNew('LOVE', reactorId, targetId, targetType);
  }

  // Add more static factory methods as needed...
}
