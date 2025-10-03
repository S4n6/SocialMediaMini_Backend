import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import {
  ReactionRepository,
  FindReactionsOptions,
  ReactionWithReactor,
  PostReactionsResult,
  ReactionStatusResult,
} from '../domain/repositories/reaction.repository';
import { ReactionEntity } from '../domain/reaction.entity';
import { ReactionFactory } from '../domain/factories/reaction.factory';

@Injectable()
export class PrismaReactionRepository implements ReactionRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reactionFactory: ReactionFactory,
  ) {}

  // Local helpers to coerce unknown prisma results into safe primitives
  private asRecord(v: unknown): Record<string, unknown> {
    return v && typeof v === 'object' ? (v as Record<string, unknown>) : {};
  }

  private safeString(v: unknown): string {
    if (v === null || v === undefined) return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    try {
      const json = JSON.stringify(v);
      return json === undefined ? Object.prototype.toString.call(v) : json;
    } catch {
      return Object.prototype.toString.call(v);
    }
  }

  private safeDate(v: unknown): Date {
    if (v instanceof Date) return v;
    const s = this.safeString(v);
    const d = new Date(s);
    return isNaN(d.getTime()) ? new Date() : d;
  }

  private mapRowToPrimitive(row: unknown) {
    const r = this.asRecord(row);
    return {
      id: this.safeString(r.id),
      type: this.safeString(r.type),
      reactorId: this.safeString(r.reactorId),
      postId: this.safeString(r.postId) || null,
      commentId: this.safeString(r.commentId) || null,
      createdAt: this.safeDate(r.createdAt),
      updatedAt: this.safeDate(r.createdAt),
    };
  }

  private mapReactor(row: unknown) {
    const r = this.asRecord(row);
    const avatarRaw = this.safeString(r.avatar);
    return {
      id: this.safeString(r.id),
      fullName: this.safeString(r.fullName),
      avatar: avatarRaw === '' ? null : avatarRaw,
    };
  }

  async save(reaction: ReactionEntity): Promise<ReactionEntity> {
    const data = {
      type: reaction.type,
      reactorId: reaction.reactorId,
      postId: reaction.postId,
      commentId: reaction.commentId,
    };

    if (reaction.id) {
      // Update existing
      const updated = await this.prisma.reaction.update({
        where: { id: reaction.id },
        data,
      });

      return this.reactionFactory.createFromPrimitive(
        this.mapRowToPrimitive(updated),
      );
    } else {
      // Create new
      const created = await this.prisma.reaction.create({
        data,
      });

      return this.reactionFactory.createFromPrimitive(
        this.mapRowToPrimitive(created),
      );
    }
  }

  async findById(id: string): Promise<ReactionEntity | null> {
    const reaction = await this.prisma.reaction.findUnique({
      where: { id },
    });

    if (!reaction) return null;
    return this.reactionFactory.createFromPrimitive(
      this.mapRowToPrimitive(reaction),
    );
  }

  async findByUserAndTarget(
    userId: string,
    targetId: string,
    targetType: 'post' | 'comment',
  ): Promise<ReactionEntity | null> {
    const where =
      targetType === 'post'
        ? { reactorId: userId, postId: targetId }
        : { reactorId: userId, commentId: targetId };

    const reaction = await this.prisma.reaction.findFirst({
      where,
    });

    if (!reaction) return null;
    return this.reactionFactory.createFromPrimitive(
      this.mapRowToPrimitive(reaction),
    );
  }

  async findAll(options?: FindReactionsOptions): Promise<ReactionEntity[]> {
    const where: any = {};

    if (options?.postId) where.postId = options.postId;
    if (options?.commentId) where.commentId = options.commentId;
    if (options?.reactorId) where.reactorId = options.reactorId;

    if (options?.targetType === 'post') {
      where.postId = { not: null };
    } else if (options?.targetType === 'comment') {
      where.commentId = { not: null };
    }

    const reactions = await this.prisma.reaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit,
      skip: options?.offset,
    });

    return reactions.map((reaction) =>
      this.reactionFactory.createFromPrimitive(
        this.mapRowToPrimitive(reaction),
      ),
    );
  }

  async findAllWithReactor(
    options?: FindReactionsOptions,
  ): Promise<ReactionWithReactor[]> {
    const where: any = {};

    if (options?.postId) where.postId = options.postId;
    if (options?.commentId) where.commentId = options.commentId;
    if (options?.reactorId) where.reactorId = options.reactorId;

    if (options?.targetType === 'post') {
      where.postId = { not: null };
    } else if (options?.targetType === 'comment') {
      where.commentId = { not: null };
    }

    const reactions = await this.prisma.reaction.findMany({
      where,
      include: {
        reactor: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit,
      skip: options?.offset,
    });

    return reactions.map((reaction) => ({
      reaction: this.reactionFactory.createFromPrimitive(
        this.mapRowToPrimitive(reaction),
      ),
      reactor: this.mapReactor(reaction.reactor),
    }));
  }

  async delete(id: string): Promise<void> {
    await this.prisma.reaction.delete({
      where: { id },
    });
  }

  async getPostReactions(postId: string): Promise<PostReactionsResult> {
    const reactions = await this.prisma.reaction.findMany({
      where: { postId },
      include: {
        reactor: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      postId,
      totalReactions: reactions.length,
      reactions: reactions.map((reaction) => ({
        reaction: this.reactionFactory.createFromPrimitive(
          this.mapRowToPrimitive(reaction),
        ),
        reactor: this.mapReactor(reaction.reactor),
      })),
    };
  }

  async getReactionStatus(
    targetId: string,
    userId: string,
    targetType: 'post' | 'comment',
  ): Promise<ReactionStatusResult> {
    const where =
      targetType === 'post'
        ? { reactorId: userId, postId: targetId }
        : { reactorId: userId, commentId: targetId };

    const reaction = await this.prisma.reaction.findFirst({
      where,
    });

    return {
      targetId,
      userId,
      reacted: !!reaction,
      reactionId: reaction?.id || null,
      reactionType: reaction?.type || null,
    };
  }

  async countByTarget(
    targetId: string,
    targetType: 'post' | 'comment',
  ): Promise<number> {
    const where =
      targetType === 'post' ? { postId: targetId } : { commentId: targetId };

    return this.prisma.reaction.count({
      where,
    });
  }
}
