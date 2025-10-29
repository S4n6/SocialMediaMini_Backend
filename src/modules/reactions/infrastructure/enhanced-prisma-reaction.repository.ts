import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import {
  IReactionBaseRepository,
  IReactionFinderRepository,
  IReactionStatsRepository,
  FindReactionsOptions,
  ReactionWithReactor,
  PostReactionsResult,
  ReactionStatusResult,
} from '../domain/repositories/reaction.repository';
import { ReactionEntity } from '../domain/entities/reaction.entity';
import { ReactionFactory } from '../domain/factories/reaction.factory';
import { TargetType } from '../constants';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  key?: string; // Custom cache key
  enabled?: boolean;
}

export interface DatabaseMetrics {
  queryCount: number;
  cacheHits: number;
  cacheMisses: number;
  totalQueryTime: number;
}

/**
 * Enhanced Prisma Repository with caching, metrics, and optimized queries
 */
@Injectable()
export class EnhancedPrismaReactionRepository
  implements
    IReactionBaseRepository,
    IReactionFinderRepository,
    IReactionStatsRepository
{
  private readonly logger = new Logger(EnhancedPrismaReactionRepository.name);
  private readonly metrics: DatabaseMetrics = {
    queryCount: 0,
    cacheHits: 0,
    cacheMisses: 0,
    totalQueryTime: 0,
  };

  // Simple in-memory cache (in production, use Redis)
  private readonly cache = new Map<string, { data: any; expiry: number }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly reactionFactory: ReactionFactory,
  ) {}

  // Base Repository Implementation
  async save(reaction: ReactionEntity): Promise<ReactionEntity> {
    const startTime = Date.now();
    this.metrics.queryCount++;

    try {
      const data = {
        type: reaction.type,
        reactorId: reaction.reactorId,
        postId: reaction.postId,
        commentId: reaction.commentId,
      };

      let result;
      if (reaction.id) {
        // Update existing
        result = await this.prisma.reaction.update({
          where: { id: reaction.id },
          data,
        });
        this.logger.debug(`Updated reaction ${reaction.id}`);
      } else {
        // Create new
        result = await this.prisma.reaction.create({
          data,
        });
        this.logger.debug(`Created new reaction ${result.id}`);
      }

      // Clear related cache entries
      this.clearRelatedCache(reaction);

      const entity = this.reactionFactory.createFromPrimitive(
        this.mapRowToPrimitive(result),
      );

      this.metrics.totalQueryTime += Date.now() - startTime;
      return entity;
    } catch (error) {
      this.logger.error('Failed to save reaction', {
        error: error.message,
        reactionId: reaction.id,
        stack: error.stack,
      });
      throw error;
    }
  }

  async findById(
    id: string,
    options: CacheOptions = { enabled: true, ttl: 300 },
  ): Promise<ReactionEntity | null> {
    const cacheKey = `reaction:${id}`;

    // Check cache first
    if (options.enabled) {
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        this.metrics.cacheHits++;
        return cached;
      }
      this.metrics.cacheMisses++;
    }

    const startTime = Date.now();
    this.metrics.queryCount++;

    try {
      const reaction = await this.prisma.reaction.findUnique({
        where: { id },
      });

      this.metrics.totalQueryTime += Date.now() - startTime;

      if (!reaction) {
        return null;
      }

      const entity = this.reactionFactory.createFromPrimitive(
        this.mapRowToPrimitive(reaction),
      );

      // Cache the result
      if (options.enabled) {
        this.setCache(cacheKey, entity, options.ttl || 300);
      }

      return entity;
    } catch (error) {
      this.logger.error('Failed to find reaction by id', {
        error: error.message,
        id,
        stack: error.stack,
      });
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const startTime = Date.now();
    this.metrics.queryCount++;

    try {
      await this.prisma.reaction.delete({
        where: { id },
      });

      // Clear cache
      this.clearCache(`reaction:${id}`);

      this.metrics.totalQueryTime += Date.now() - startTime;
      this.logger.debug(`Deleted reaction ${id}`);
    } catch (error) {
      this.logger.error('Failed to delete reaction', {
        error: error.message,
        id,
        stack: error.stack,
      });
      throw error;
    }
  }

  // Finder Repository Implementation
  async findByUserAndTarget(
    userId: string,
    targetId: string,
    targetType: TargetType,
  ): Promise<ReactionEntity | null> {
    const cacheKey = `user-reaction:${userId}:${targetType}:${targetId}`;

    // Check cache
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      this.metrics.cacheHits++;
      return cached;
    }
    this.metrics.cacheMisses++;

    const startTime = Date.now();
    this.metrics.queryCount++;

    try {
      const where =
        targetType === 'post'
          ? { reactorId: userId, postId: targetId }
          : { reactorId: userId, commentId: targetId };

      const reaction = await this.prisma.reaction.findFirst({
        where,
      });

      this.metrics.totalQueryTime += Date.now() - startTime;

      if (!reaction) {
        return null;
      }

      const entity = this.reactionFactory.createFromPrimitive(
        this.mapRowToPrimitive(reaction),
      );

      // Cache for 5 minutes
      this.setCache(cacheKey, entity, 300);

      return entity;
    } catch (error) {
      this.logger.error('Failed to find reaction by user and target', {
        error: error.message,
        userId,
        targetId,
        targetType,
        stack: error.stack,
      });
      throw error;
    }
  }

  async findAll(options?: FindReactionsOptions): Promise<ReactionEntity[]> {
    const startTime = Date.now();
    this.metrics.queryCount++;

    try {
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
        take: options?.limit || 50, // Default limit
        skip: options?.offset || 0,
      });

      this.metrics.totalQueryTime += Date.now() - startTime;

      return reactions.map((reaction) =>
        this.reactionFactory.createFromPrimitive(
          this.mapRowToPrimitive(reaction),
        ),
      );
    } catch (error) {
      this.logger.error('Failed to find reactions', {
        error: error.message,
        options,
        stack: error.stack,
      });
      throw error;
    }
  }

  async findAllWithReactor(
    options?: FindReactionsOptions,
  ): Promise<ReactionWithReactor[]> {
    const startTime = Date.now();
    this.metrics.queryCount++;

    try {
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
        take: options?.limit || 50,
        skip: options?.offset || 0,
      });

      this.metrics.totalQueryTime += Date.now() - startTime;

      return reactions.map((reaction) => ({
        reaction: this.reactionFactory.createFromPrimitive(
          this.mapRowToPrimitive(reaction),
        ),
        reactor: this.mapReactor(reaction.reactor),
      }));
    } catch (error) {
      this.logger.error('Failed to find reactions with reactor', {
        error: error.message,
        options,
        stack: error.stack,
      });
      throw error;
    }
  }

  // Stats Repository Implementation
  async getPostReactions(postId: string): Promise<PostReactionsResult> {
    const cacheKey = `post-reactions:${postId}`;

    // Check cache
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      this.metrics.cacheHits++;
      return cached;
    }
    this.metrics.cacheMisses++;

    const startTime = Date.now();
    this.metrics.queryCount++;

    try {
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

      this.metrics.totalQueryTime += Date.now() - startTime;

      const result: PostReactionsResult = {
        postId,
        totalReactions: reactions.length,
        reactions: reactions.map((reaction) => ({
          reaction: this.reactionFactory.createFromPrimitive(
            this.mapRowToPrimitive(reaction),
          ),
          reactor: this.mapReactor(reaction.reactor),
        })),
      };

      // Cache for 2 minutes
      this.setCache(cacheKey, result, 120);

      return result;
    } catch (error) {
      this.logger.error('Failed to get post reactions', {
        error: error.message,
        postId,
        stack: error.stack,
      });
      throw error;
    }
  }

  async getReactionStatus(
    targetId: string,
    userId: string,
    targetType: TargetType,
  ): Promise<ReactionStatusResult> {
    const cacheKey = `reaction-status:${userId}:${targetType}:${targetId}`;

    // Check cache
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      this.metrics.cacheHits++;
      return cached;
    }
    this.metrics.cacheMisses++;

    const startTime = Date.now();
    this.metrics.queryCount++;

    try {
      const where =
        targetType === 'post'
          ? { reactorId: userId, postId: targetId }
          : { reactorId: userId, commentId: targetId };

      const reaction = await this.prisma.reaction.findFirst({
        where,
      });

      this.metrics.totalQueryTime += Date.now() - startTime;

      const result: ReactionStatusResult = {
        targetId,
        userId,
        reacted: !!reaction,
        reactionId: reaction?.id || null,
        reactionType: reaction?.type || null,
      };

      // Cache for 1 minute
      this.setCache(cacheKey, result, 60);

      return result;
    } catch (error) {
      this.logger.error('Failed to get reaction status', {
        error: error.message,
        targetId,
        userId,
        targetType,
        stack: error.stack,
      });
      throw error;
    }
  }

  async countByTarget(
    targetId: string,
    targetType: TargetType,
  ): Promise<number> {
    const cacheKey = `reaction-count:${targetType}:${targetId}`;

    // Check cache
    const cached = this.getFromCache(cacheKey);
    if (cached !== null && cached !== undefined) {
      this.metrics.cacheHits++;
      return cached;
    }
    this.metrics.cacheMisses++;

    const startTime = Date.now();
    this.metrics.queryCount++;

    try {
      const where =
        targetType === 'post' ? { postId: targetId } : { commentId: targetId };

      const count = await this.prisma.reaction.count({
        where,
      });

      this.metrics.totalQueryTime += Date.now() - startTime;

      // Cache for 5 minutes
      this.setCache(cacheKey, count, 300);

      return count;
    } catch (error) {
      this.logger.error('Failed to count reactions by target', {
        error: error.message,
        targetId,
        targetType,
        stack: error.stack,
      });
      throw error;
    }
  }

  // Utility Methods
  getMetrics(): DatabaseMetrics {
    return { ...this.metrics };
  }

  clearAllCache(): void {
    this.cache.clear();
    this.logger.debug('Cleared all cache entries');
  }

  // Private helper methods
  private mapRowToPrimitive(row: unknown) {
    const r = this.asRecord(row);
    return {
      id: this.safeString(r.id),
      type: this.safeString(r.type),
      reactorId: this.safeString(r.reactorId),
      postId: this.safeString(r.postId) || null,
      commentId: this.safeString(r.commentId) || null,
      createdAt: this.safeDate(r.createdAt),
      updatedAt: this.safeDate(r.updatedAt),
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

  private getFromCache(key: string): any {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  private setCache(key: string, data: any, ttlSeconds: number): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttlSeconds * 1000,
    });
  }

  private clearCache(key: string): void {
    this.cache.delete(key);
  }

  private clearRelatedCache(reaction: ReactionEntity): void {
    // Clear specific caches related to this reaction
    this.clearCache(`reaction:${reaction.id}`);
    this.clearCache(
      `user-reaction:${reaction.reactorId}:${reaction.targetType}:${reaction.targetId}`,
    );
    this.clearCache(`post-reactions:${reaction.postId}`);
    this.clearCache(
      `reaction-count:${reaction.targetType}:${reaction.targetId}`,
    );
    this.clearCache(
      `reaction-status:${reaction.reactorId}:${reaction.targetType}:${reaction.targetId}`,
    );
  }
}
