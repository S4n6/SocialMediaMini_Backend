import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../database/prisma.service';
import {
  IReactionRepository,
  FindReactionsOptions,
  ReactionWithReactor,
  PostReactionsResult,
  ReactionStatusResult,
} from '../../../domain/repositories/i-reaction.repository';
import { ReactionEntity } from '../../../domain/entities/reaction.entity';
import { TargetTypeValue } from '../../../domain/value-objects/target-type.value-object';
import { ReactionPrismaMapper } from '../mappers/reaction-prisma.mapper';

/**
 * Prisma implementation of IReactionRepository
 */
@Injectable()
export class ReactionPrismaRepository implements IReactionRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: ReactionPrismaMapper,
  ) {}

  async save(reaction: ReactionEntity): Promise<ReactionEntity> {
    const data = this.mapper.toPrisma(reaction);

    if (reaction.id) {
      const result = await this.prisma.reaction.update({
        where: { id: reaction.id },
        data,
      });
      return this.mapper.toDomain(result);
    }

    const result = await this.prisma.reaction.create({ data });
    return this.mapper.toDomain(result);
  }

  async findById(id: string): Promise<ReactionEntity | null> {
    const row = await this.prisma.reaction.findUnique({ where: { id } });
    return row ? this.mapper.toDomain(row) : null;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.reaction.delete({ where: { id } });
  }

  async findByUserAndTarget(
    userId: string,
    targetId: string,
    targetType: TargetTypeValue,
  ): Promise<ReactionEntity | null> {
    const where =
      targetType === 'post'
        ? { reactorId: userId, postId: targetId }
        : { reactorId: userId, commentId: targetId };

    const row = await this.prisma.reaction.findFirst({ where });
    return row ? this.mapper.toDomain(row) : null;
  }

  async findAll(options?: FindReactionsOptions): Promise<ReactionEntity[]> {
    const where: Record<string, unknown> = {};

    if (options?.postId) where.postId = options.postId;
    if (options?.commentId) where.commentId = options.commentId;
    if (options?.reactorId) where.reactorId = options.reactorId;

    if (options?.targetType === 'post') {
      where.postId = { not: null };
    } else if (options?.targetType === 'comment') {
      where.commentId = { not: null };
    }

    const rows = await this.prisma.reaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    });

    return rows.map((row) => this.mapper.toDomain(row));
  }

  async getPostReactions(postId: string): Promise<PostReactionsResult> {
    const rows = await this.prisma.reaction.findMany({
      where: { postId },
      include: {
        reactor: { select: { id: true, fullName: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      postId,
      totalReactions: rows.length,
      reactions: rows.map((row) => ({
        reaction: this.mapper.toDomain(row),
        reactor: this.mapper.toReactorDto(row.reactor),
      })),
    };
  }

  async getReactionStatus(
    targetId: string,
    userId: string,
    targetType: TargetTypeValue,
  ): Promise<ReactionStatusResult> {
    const where =
      targetType === 'post'
        ? { reactorId: userId, postId: targetId }
        : { reactorId: userId, commentId: targetId };

    const row = await this.prisma.reaction.findFirst({ where });

    return {
      targetId,
      userId,
      reacted: !!row,
      reactionId: row?.id || null,
      reactionType: row?.type || null,
    };
  }

  async countByTarget(
    targetId: string,
    targetType: TargetTypeValue,
  ): Promise<number> {
    const where =
      targetType === 'post' ? { postId: targetId } : { commentId: targetId };

    return this.prisma.reaction.count({ where });
  }
}
