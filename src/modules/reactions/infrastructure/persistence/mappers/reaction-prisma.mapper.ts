import { Injectable } from '@nestjs/common';
import { ReactionEntity } from '../../../domain/entities/reaction.entity';
import { ReactionTypeValue } from '../../../domain/value-objects/reaction-type.value-object';
import { TargetTypeValue } from '../../../domain/value-objects/target-type.value-object';
import { ReactionType as PrismaReactionType } from '../../../../../generated/prisma/enums';

interface PrismaReactionRow {
  id: string;
  type: string;
  reactorId: string;
  postId: string | null;
  commentId: string | null;
  createdAt: Date;
}

interface PrismaReactorRow {
  id: string;
  fullName: string;
  avatar: string | null;
}

/**
 * Mapper: Domain Entity ↔ Prisma Model
 */
@Injectable()
export class ReactionPrismaMapper {
  toDomain(row: PrismaReactionRow): ReactionEntity {
    const targetType: TargetTypeValue = row.postId ? 'post' : 'comment';
    const targetId = (row.postId || row.commentId)!;

    return ReactionEntity.reconstitute(row.id, {
      type: row.type as ReactionTypeValue,
      reactorId: row.reactorId,
      targetId,
      targetType,
      createdAt: row.createdAt,
    });
  }

  toPrisma(entity: ReactionEntity): {
    type: PrismaReactionType;
    reactorId: string;
    postId: string | null;
    commentId: string | null;
  } {
    return {
      type: entity.type as PrismaReactionType,
      reactorId: entity.reactorId,
      postId: entity.postId,
      commentId: entity.commentId,
    };
  }

  toReactorDto(row: PrismaReactorRow): {
    id: string;
    fullName: string;
    avatar: string | null;
  } {
    return {
      id: row.id,
      fullName: row.fullName,
      avatar: row.avatar,
    };
  }
}
