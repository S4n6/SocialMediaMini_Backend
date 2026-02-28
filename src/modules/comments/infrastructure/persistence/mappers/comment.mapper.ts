import { Injectable } from '@nestjs/common';
import { CommentEntity } from '../../../domain/entities/comment.entity';
import { CommentFactory } from '../../../domain/factories/comment.factory';

/**
 * Persistence mapper — converts between Prisma database records
 * and domain `CommentEntity` instances.
 */
@Injectable()
export class CommentPersistenceMapper {
  /**
   * Map a Prisma Comment record to a domain entity.
   * Uses `CommentEntity.reconstitute()` (no domain events emitted).
   */
  toDomain(prismaComment: {
    id: string;
    content: string;
    authorId: string;
    postId: string;
    parentId?: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): CommentEntity {
    return CommentFactory.fromPersistence({
      id: prismaComment.id,
      content: prismaComment.content,
      authorId: prismaComment.authorId,
      postId: prismaComment.postId,
      parentId: prismaComment.parentId || undefined,
      createdAt: prismaComment.createdAt,
      updatedAt: prismaComment.updatedAt,
    });
  }

  /**
   * Map a domain entity to a Prisma-compatible data object.
   */
  toPrisma(entity: CommentEntity): {
    id: string;
    content: string;
    authorId: string;
    postId: string;
    parentId: string | undefined;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: entity.id,
      content: entity.content,
      authorId: entity.authorId,
      postId: entity.postId,
      parentId: entity.parentId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  /**
   * Map an array of Prisma records to domain entities.
   */
  toDomainArray(
    prismaComments: Array<{
      id: string;
      content: string;
      authorId: string;
      postId: string;
      parentId?: string | null;
      createdAt: Date;
      updatedAt: Date;
    }>,
  ): CommentEntity[] {
    return prismaComments.map((c) => this.toDomain(c));
  }
}
