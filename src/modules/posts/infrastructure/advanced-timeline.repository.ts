import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { PostEntity, PostPrivacy } from '../domain/entities/post.entity';
import {
  ITimelineRepository,
  CursorPaginatedPosts,
} from '../domain/repositories/timeline.repository';
import { PostMapper } from './persistence/mappers/post.mapper';
import { PostPrivacy as PrismaPostPrivacy } from '../../../generated/prisma/enums';

/**
 * Advanced Timeline Algorithm
 * Implements intelligent feed ranking similar to Facebook/Instagram
 * Uses cursor-based pagination for stable infinite scroll.
 */
@Injectable()
export class AdvancedTimelineRepository implements ITimelineRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly postMapper: PostMapper,
  ) {}

  /** Shared include clause for rich post objects */
  private readonly defaultInclude = {
    author: true,
    reactions: { include: { reactor: true } },
    comments: {
      include: { author: true },
      orderBy: { createdAt: 'asc' as const },
    },
    postMedia: { orderBy: { order: 'asc' as const } },
    hashtags: { include: { hashtag: true } },
  };

  /** Shared WHERE clause for timeline visibility */
  private getTimelineWhere(userId: string) {
    return {
      OR: [
        {
          authorId: userId,
          privacy: {
            in: [
              PrismaPostPrivacy.PUBLIC,
              PrismaPostPrivacy.FOLLOWERS,
              PrismaPostPrivacy.PRIVATE,
            ],
          },
        },
        {
          author: {
            followers: {
              some: { followerId: userId },
            },
          },
          authorId: { not: userId },
          privacy: {
            in: [PrismaPostPrivacy.PUBLIC, PrismaPostPrivacy.FOLLOWERS],
          },
        },
      ],
    };
  }

  /**
   * Basic chronological timeline using Prisma cursor pagination.
   * We fetch `limit + 1` rows to detect whether a next page exists
   * without running a separate COUNT(*) query.
   */
  async getTimelineFeed(
    userId: string,
    limit: number,
    cursor?: string | null,
  ): Promise<CursorPaginatedPosts> {
    const take = limit + 1; // over-fetch by 1 to detect next page

    const posts = await this.prisma.post.findMany({
      where: this.getTimelineWhere(userId),
      include: this.defaultInclude,
      orderBy: { createdAt: 'desc' },
      take,
      ...(cursor
        ? {
            skip: 1, // skip the cursor row itself
            cursor: { id: cursor },
          }
        : {}),
    });

    const hasNextPage = posts.length > limit;
    const sliced = hasNextPage ? posts.slice(0, limit) : posts;
    const nextCursor =
      hasNextPage && sliced.length > 0 ? sliced[sliced.length - 1].id : null;

    return {
      posts: sliced.map((post) => this.postMapper.toDomainEntity(post)),
      nextCursor,
    };
  }

  /**
   * Smart Timeline Feed with ranking algorithm.
   * For ranked feeds, we use a two-phase approach:
   *   1. Fetch a larger candidate window from DB
   *   2. Rank in application memory
   *   3. Return a cursor-stable page
   *
   * The cursor here is the PostId of the last returned post.
   * We exclude all previously seen post IDs via createdAt < cursor's createdAt
   * to keep the pagination stable even after re-ranking.
   */
  async getSmartTimelineFeed(
    userId: string,
    limit: number,
    cursor?: string | null,
  ): Promise<CursorPaginatedPosts> {
    // Determine the createdAt cutoff from the cursor post
    let cursorCreatedAt: Date | null = null;
    if (cursor) {
      const cursorPost = await this.prisma.post.findUnique({
        where: { id: cursor },
        select: { createdAt: true },
      });
      cursorCreatedAt = cursorPost?.createdAt ?? null;
    }

    // Fetch a larger window for ranking (3x the requested page size)
    const candidateWindow = limit * 3;
    const take = candidateWindow + 1;

    const whereClause: any = {
      ...this.getTimelineWhere(userId),
    };

    // Apply cursor filter: only posts older than the cursor
    if (cursorCreatedAt) {
      whereClause.createdAt = { lt: cursorCreatedAt };
    }

    const candidates = await this.prisma.post.findMany({
      where: whereClause,
      include: {
        ...this.defaultInclude,
        _count: { select: { reactions: true, comments: true } },
      },
      orderBy: { createdAt: 'desc' },
      take,
    });

    // In-memory ranking
    const now = Date.now();
    const scored = candidates.map((post) => {
      const ageHours =
        (now - new Date(post.createdAt).getTime()) / (1000 * 60 * 60);
      const reactionCount = (post as any)._count?.reactions ?? 0;
      const commentCount = (post as any)._count?.comments ?? 0;

      // Engagement score
      const engagementScore = reactionCount * 1.0 + commentCount * 2.0;

      // Recency score (decays over time)
      const recencyScore =
        ageHours < 24 ? 10 : ageHours < 72 ? 5 : ageHours < 168 ? 2 : 1;

      // Own post boost
      const ownershipScore = post.authorId === userId ? 3 : 0;

      // Content richness
      const contentScore =
        (post as any)._count?.postMedia > 0
          ? 2
          : (post.content?.length ?? 0) > 200
            ? 1.5
            : 1;

      const finalScore =
        engagementScore * 0.3 +
        recencyScore * 0.4 +
        ownershipScore * 0.1 +
        contentScore * 0.2;

      return { post, finalScore };
    });

    // Sort by score descending, then by createdAt for tie-breaking
    scored.sort(
      (a, b) =>
        b.finalScore - a.finalScore ||
        new Date(b.post.createdAt).getTime() -
          new Date(a.post.createdAt).getTime(),
    );

    const page = scored.slice(0, limit);
    const hasNextPage = candidates.length > candidateWindow;
    const nextCursor =
      hasNextPage && page.length > 0 ? page[page.length - 1].post.id : null;

    return {
      posts: page.map((s) => this.postMapper.toDomainEntity(s.post)),
      nextCursor,
    };
  }

  /**
   * Diversified Timeline — limits consecutive posts from the same author.
   * Uses cursor-based pagination with createdAt cutoff.
   */
  async getDiversifiedTimelineFeed(
    userId: string,
    limit: number,
    cursor?: string | null,
  ): Promise<CursorPaginatedPosts> {
    let cursorCreatedAt: Date | null = null;
    if (cursor) {
      const cursorPost = await this.prisma.post.findUnique({
        where: { id: cursor },
        select: { createdAt: true },
      });
      cursorCreatedAt = cursorPost?.createdAt ?? null;
    }

    // Fetch extra to allow filtering duplicates from same author
    const fetchSize = limit * 3;
    const take = fetchSize + 1;

    const whereClause: any = {
      ...this.getTimelineWhere(userId),
    };
    if (cursorCreatedAt) {
      whereClause.createdAt = { lt: cursorCreatedAt };
    }

    const candidates = await this.prisma.post.findMany({
      where: whereClause,
      include: this.defaultInclude,
      orderBy: { createdAt: 'desc' },
      take,
    });

    // Diversify: max 2 consecutive posts per author
    const authorCount = new Map<string, number>();
    const diversified: typeof candidates = [];
    for (const post of candidates) {
      const count = authorCount.get(post.authorId) ?? 0;
      if (count < 2) {
        diversified.push(post);
        authorCount.set(post.authorId, count + 1);
      }
      if (diversified.length >= limit + 1) break;
    }

    const hasNextPage = diversified.length > limit;
    const sliced = hasNextPage ? diversified.slice(0, limit) : diversified;
    const nextCursor =
      hasNextPage && sliced.length > 0 ? sliced[sliced.length - 1].id : null;

    return {
      posts: sliced.map((post) => this.postMapper.toDomainEntity(post)),
      nextCursor,
    };
  }
}
