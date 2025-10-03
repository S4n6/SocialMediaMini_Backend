import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { CommentRepository } from '../../domain/repositories/comment.repository';
import { CommentEntity } from '../../domain/comment.entity';
import { CommentFactory } from '../../domain/factories/comment.factory';

@Injectable()
export class PrismaCommentRepository implements CommentRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapToEntity(prismaComment: any): CommentEntity {
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

  async save(comment: CommentEntity): Promise<CommentEntity> {
    const data = {
      id: comment.id,
      content: comment.content,
      authorId: comment.authorId,
      postId: comment.postId,
      parentId: comment.parentId,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    };

    const savedComment = await this.prisma.comment.upsert({
      where: { id: comment.id },
      update: data,
      create: data,
    });

    return this.mapToEntity(savedComment);
  }

  async update(comment: CommentEntity): Promise<CommentEntity> {
    const updatedComment = await this.prisma.comment.update({
      where: { id: comment.id },
      data: {
        content: comment.content,
        updatedAt: comment.updatedAt,
      },
    });

    return this.mapToEntity(updatedComment);
  }

  async findById(id: string): Promise<CommentEntity | null> {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      return null;
    }

    return this.mapToEntity(comment);
  }

  async findByPostId(
    postId: string,
    page: number,
    limit: number,
  ): Promise<{
    items: CommentEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: {
          postId,
          parentId: null, // Top-level comments only
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.comment.count({
        where: {
          postId,
          parentId: null,
        },
      }),
    ]);

    const entities = comments.map((comment) => this.mapToEntity(comment));

    return {
      items: entities,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findRepliesByCommentId(
    commentId: string,
    page: number,
    limit: number,
  ): Promise<{
    items: CommentEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [replies, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: { parentId: commentId },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.comment.count({
        where: { parentId: commentId },
      }),
    ]);

    const entities = replies.map((comment) => this.mapToEntity(comment));

    return {
      items: entities,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByAuthorId(
    authorId: string,
    page: number,
    limit: number,
  ): Promise<{
    items: CommentEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: { authorId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.comment.count({
        where: { authorId },
      }),
    ]);

    const entities = comments.map((comment) => this.mapToEntity(comment));

    return {
      items: entities,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async deleteById(id: string): Promise<void> {
    await this.prisma.comment.delete({
      where: { id },
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.comment.count({
      where: { id },
    });
    return count > 0;
  }

  async countByPostId(postId: string): Promise<number> {
    return this.prisma.comment.count({
      where: { postId },
    });
  }

  async countRepliesByCommentId(commentId: string): Promise<number> {
    return this.prisma.comment.count({
      where: { parentId: commentId },
    });
  }

  async getCommentDepth(commentId: string): Promise<number> {
    let depth = 0;
    let currentComment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      select: { parentId: true },
    });

    while (currentComment?.parentId) {
      depth++;
      currentComment = await this.prisma.comment.findUnique({
        where: { id: currentComment.parentId },
        select: { parentId: true },
      });
    }

    return depth;
  }

  async findTopLevelCommentsByPostId(
    postId: string,
    page: number,
    limit: number,
    sortBy: 'newest' | 'oldest' | 'popular' = 'newest',
  ): Promise<{
    items: CommentEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'oldest') {
      orderBy = { createdAt: 'asc' };
    } else if (sortBy === 'popular') {
      // This would require reaction counts in a separate table
      orderBy = { createdAt: 'desc' }; // Fallback to newest for now
    }

    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: {
          postId,
          parentId: null,
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.comment.count({
        where: {
          postId,
          parentId: null,
        },
      }),
    ]);

    const entities = comments.map((comment) => this.mapToEntity(comment));

    return {
      items: entities,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findCommentThread(rootCommentId: string): Promise<CommentEntity[]> {
    // This would be a recursive query to get all nested replies
    const comments = await this.prisma.$queryRaw<any[]>`
      WITH RECURSIVE comment_tree AS (
        SELECT id, content, "authorId", "postId", "parentId", "createdAt", "updatedAt", 0 as depth
        FROM "Comment"
        WHERE id = ${rootCommentId}
        
        UNION ALL
        
        SELECT c.id, c.content, c."authorId", c."postId", c."parentId", c."createdAt", c."updatedAt", ct.depth + 1
        FROM "Comment" c
        INNER JOIN comment_tree ct ON c."parentId" = ct.id
      )
      SELECT * FROM comment_tree
      ORDER BY depth, "createdAt" ASC
    `;

    return comments.map((comment) => this.mapToEntity(comment));
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.comment.update({
      where: { id },
      data: {
        content: '[deleted]',
        updatedAt: new Date(),
      },
    });
  }

  async hasUserReacted(
    commentId: string,
    userId: string,
    reactionType: string,
  ): Promise<boolean> {
    // TODO: Implement when CommentReaction table is added to schema
    // For now, always return false
    return false;
  }

  async addReaction(
    commentId: string,
    userId: string,
    reactionType: string,
  ): Promise<void> {
    // TODO: Implement when CommentReaction table is added to schema
    // For now, do nothing
  }

  async removeReaction(
    commentId: string,
    userId: string,
    reactionType: string,
  ): Promise<void> {
    // TODO: Implement when CommentReaction table is added to schema
    // For now, do nothing
  }

  async getReactionCounts(commentId: string): Promise<Record<string, number>> {
    // TODO: Implement when CommentReaction table is added to schema
    // For now, return empty counts
    return {};
  }

  async deleteByPostId(postId: string): Promise<void> {
    await this.prisma.comment.deleteMany({
      where: { postId },
    });
  }
}
