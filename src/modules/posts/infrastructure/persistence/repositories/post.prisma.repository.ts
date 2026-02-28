import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../database/prisma.service';
import { PostEntity, PostPrivacy } from '../../../domain/entities/post.entity';
import { IPostRepository } from '../../../domain/repositories/post.repository';
import { PostMapper } from '../mappers/post.mapper';
import {
  PostPrivacy as PrismaPostPrivacy,
  MediaType as PrismaMediaType,
} from '../../../../../generated/prisma/enums';

/**
 * Prisma implementation of Post repository
 * Handles persistence operations using Prisma ORM
 */
@Injectable()
export class PostPrismaRepository implements IPostRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly postMapper: PostMapper,
  ) {}

  /** Standard include clause for Prisma queries */
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

  async save(post: PostEntity): Promise<PostEntity> {
    const data = this.postMapper.toPrismaData(post);

    // Upsert the post
    await this.prisma.post.upsert({
      where: { id: post.id },
      create: data,
      update: {
        content: data.content,
        privacy: data.privacy,
        updatedAt: data.updatedAt,
      },
    });

    // Handle media — delete existing and create new ones
    await this.prisma.postMedia.deleteMany({ where: { postId: post.id } });

    if (post.media.length > 0) {
      await this.prisma.postMedia.createMany({
        data: post.media.map((media) => ({
          id: media.id,
          postId: post.id,
          url: media.url,
          type: media.type.toUpperCase() as PrismaMediaType,
          order: media.order,
        })),
      });
    }

    // Handle hashtags — delete existing relationships and create new ones
    await this.prisma.postHashtag.deleteMany({ where: { postId: post.id } });

    if (post.hashtags.length > 0) {
      for (const hashtagName of post.hashtags) {
        const hashtag = await this.prisma.hashtag.upsert({
          where: { name: hashtagName },
          create: { name: hashtagName },
          update: {},
        });

        await this.prisma.postHashtag.create({
          data: { postId: post.id, hashtagId: hashtag.id },
        });
      }
    }

    // Return reconstructed entity
    const savedEntity = await this.findById(post.id);
    if (!savedEntity) {
      throw new Error('Failed to retrieve saved post');
    }
    return savedEntity;
  }

  async findById(id: string): Promise<PostEntity | null> {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: this.defaultInclude,
    });

    if (!post) return null;
    return this.postMapper.toDomainEntity(post);
  }

  async findAll(filters: {
    authorId?: string;
    privacy?: string;
    hashtag?: string;
    search?: string;
    page: number;
    limit: number;
    sortBy?: 'newest' | 'oldest' | 'most_liked' | 'most_commented';
  }): Promise<{ posts: PostEntity[]; total: number }> {
    const where: any = {};

    if (filters.authorId) where.authorId = filters.authorId;
    if (filters.privacy) where.privacy = filters.privacy;

    if (filters.hashtag) {
      where.hashtags = {
        some: { hashtag: { name: filters.hashtag } },
      };
    }

    if (filters.search) {
      where.content = { contains: filters.search, mode: 'insensitive' };
    }

    let orderBy: any = { createdAt: 'desc' };
    switch (filters.sortBy) {
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'most_liked':
        orderBy = { reactions: { _count: 'desc' } };
        break;
      case 'most_commented':
        orderBy = { comments: { _count: 'desc' } };
        break;
    }

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        include: this.defaultInclude,
        orderBy,
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      posts: posts.map((post) => this.postMapper.toDomainEntity(post)),
      total,
    };
  }

  async findByAuthorId(
    authorId: string,
    page: number,
    limit: number,
  ): Promise<{ posts: PostEntity[]; total: number }> {
    return this.findAll({ authorId, page, limit });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.post.delete({ where: { id } });
  }

  async exists(id: string): Promise<boolean> {
    const post = await this.prisma.post.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!post;
  }

  async findByIds(ids: string[]): Promise<PostEntity[]> {
    const posts = await this.prisma.post.findMany({
      where: { id: { in: ids } },
      include: this.defaultInclude,
    });
    return posts.map((post) => this.postMapper.toDomainEntity(post));
  }

  async getTimelineFeed(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ posts: PostEntity[]; total: number }> {
    const offset = (page - 1) * limit;

    const timelineWhere = {
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
            followers: { some: { followerId: userId } },
          },
          authorId: { not: userId },
          privacy: {
            in: [PrismaPostPrivacy.PUBLIC, PrismaPostPrivacy.FOLLOWERS],
          },
        },
      ],
    };

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: timelineWhere,
        include: this.defaultInclude,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.post.count({ where: timelineWhere }),
    ]);

    return {
      posts: posts.map((post) => this.postMapper.toDomainEntity(post)),
      total,
    };
  }

  async getTrendingPosts(
    page: number,
    limit: number,
  ): Promise<{ posts: PostEntity[]; total: number }> {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const trendingWhere = {
      privacy: PrismaPostPrivacy.PUBLIC,
      createdAt: { gte: oneDayAgo },
    };

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: trendingWhere,
        include: {
          ...this.defaultInclude,
          _count: { select: { reactions: true, comments: true } },
        },
        orderBy: [
          { reactions: { _count: 'desc' } },
          { comments: { _count: 'desc' } },
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.post.count({ where: trendingWhere }),
    ]);

    return {
      posts: posts.map((post) => this.postMapper.toDomainEntity(post)),
      total,
    };
  }

  async getPostStats(postId: string): Promise<{
    likesCount: number;
    commentsCount: number;
    sharesCount: number;
  }> {
    const stats = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { _count: { select: { reactions: true, comments: true } } },
    });

    return {
      likesCount: stats?._count.reactions || 0,
      commentsCount: stats?._count.comments || 0,
      sharesCount: 0,
    };
  }

  async findByHashtag(
    hashtag: string,
    page: number,
    limit: number,
  ): Promise<{ posts: PostEntity[]; total: number }> {
    const hashtagWhere = {
      hashtags: { some: { hashtag: { name: hashtag } } },
      privacy: PrismaPostPrivacy.PUBLIC,
    };

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: hashtagWhere,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: this.defaultInclude,
      }),
      this.prisma.post.count({ where: hashtagWhere }),
    ]);

    return {
      posts: posts.map((post) => this.postMapper.toDomainEntity(post)),
      total,
    };
  }

  async searchPosts(
    query: string,
    filters: {
      authorId?: string;
      hashtag?: string;
      privacy?: string;
      dateFrom?: Date;
      dateTo?: Date;
    },
    page: number,
    limit: number,
  ): Promise<{ posts: PostEntity[]; total: number }> {
    const where: any = {
      OR: [
        { content: { contains: query, mode: 'insensitive' } },
        {
          hashtags: {
            some: {
              hashtag: {
                name: { contains: query, mode: 'insensitive' },
              },
            },
          },
        },
      ],
    };

    if (filters.authorId) where.authorId = filters.authorId;

    if (filters.hashtag) {
      where.hashtags = {
        some: { hashtag: { name: filters.hashtag } },
      };
    }

    if (filters.privacy) where.privacy = filters.privacy;

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) where.createdAt.lte = filters.dateTo;
    }

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: this.defaultInclude,
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      posts: posts.map((post) => this.postMapper.toDomainEntity(post)),
      total,
    };
  }
}
