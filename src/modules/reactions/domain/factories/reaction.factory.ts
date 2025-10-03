import { Injectable } from '@nestjs/common';
import { ReactionEntity, ReactionType } from '../reaction.entity';
import { InvalidReactionTypeException } from '../reaction.exceptions';

@Injectable()
export class ReactionFactory {
  private readonly validTypes: ReactionType[] = [
    'LIKE',
    'LOVE',
    'HAHA',
    'WOW',
    'SAD',
    'ANGRY',
  ];

  createReaction(
    type: string,
    reactorId: string,
    targetId: string,
    targetType: 'post' | 'comment',
  ): ReactionEntity {
    const normalizedType = type.toUpperCase() as ReactionType;

    if (!this.isValidReactionType(normalizedType)) {
      throw new InvalidReactionTypeException(type);
    }

    return ReactionEntity.createNew(
      normalizedType,
      reactorId,
      targetId,
      targetType,
    );
  }

  createFromPrimitive(props: {
    id: string;
    type: string;
    reactorId: string;
    postId?: string | null;
    commentId?: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): ReactionEntity {
    const normalizedType = props.type.toUpperCase() as ReactionType;

    if (!this.isValidReactionType(normalizedType)) {
      throw new InvalidReactionTypeException(props.type);
    }

    return ReactionEntity.create({
      id: props.id,
      type: normalizedType,
      reactorId: props.reactorId,
      postId: props.postId,
      commentId: props.commentId,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    });
  }

  private isValidReactionType(type: string): type is ReactionType {
    return this.validTypes.includes(type as ReactionType);
  }

  getValidTypes(): ReactionType[] {
    return [...this.validTypes];
  }
}
