import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { PostEntity, PostPrivacy, ReactionType } from '../domain/post.entity';
import { PostFactory } from '../domain/factories/post.factory';
import { IPostRepository } from '../application/interfaces/post-repository.interface';

/**
 * Prisma implementation of Post repository
 * Handles persistence operations using Prisma ORM
 */
@Injectable()
export class PostPrismaRepository implements IPostRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly postFactory: PostFactory,
  ) {}

  async save(post: PostEntity): Promise<PostEntity> {
    const data = {
      id: post.id,
      content: post.content,
      privacy: post.privacy,
      authorId: post.authorId,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };

    // Upsert the post
    const savedPost = await this.prisma.post.upsert({
      where: { id: post.id },
      create: data,
      update: {
        content: data.content,
        privacy: data.privacy,
        updatedAt: data.updatedAt,
      },
      include: {
        author: true,
        reactions: true,
        comments: {
          include: {
            author: true,
          },
        },
        postMedia: true,
        hashtags: {
          include: {
            hashtag: true,
          },
        },
      },
    });

    // Handle media - delete existing and create new ones
    await this.prisma.postMedia.deleteMany({
      where: { postId: post.id },
    });

    if (post.media.length > 0) {
      await this.prisma.postMedia.createMany({
        data: post.media.map((media) => ({
          id: media.id,
          postId: post.id,
          url: media.url,
          type: media.type,
          order: media.order,
        })),
      });
    }

    // Handle hashtags - delete existing relationships and create new ones
    await this.prisma.postHashtag.deleteMany({
      where: { postId: post.id },
    });

    if (post.hashtags.length > 0) {
      for (const hashtagName of post.hashtags) {
        // Ensure hashtag exists
        const hashtag = await this.prisma.hashtag.upsert({
          where: { name: hashtagName },
          create: { name: hashtagName },
          update: {},
        });

        // Create relationship
        await this.prisma.postHashtag.create({
          data: {
            postId: post.id,
            hashtagId: hashtag.id,
          },
        });
      }
    }

    // Reaction mutations moved to the reactions module.

    // Comment mutations moved to the comments module.

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
      include: {
        author: true,
        reactions: {
          include: {
            reactor: true,
          },
        },
        comments: {
          include: {
            author: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        postMedia: {
          orderBy: {
            order: 'asc',
          },
        },
        hashtags: {
          include: {
            hashtag: true,
          },
        },
      },
    });

    if (!post) {
      return null;
    }

    return this.mapToEntity(post);
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

    if (filters.authorId) {
      where.authorId = filters.authorId;
    }

    if (filters.privacy) {
      where.privacy = filters.privacy;
    }

    if (filters.hashtag) {
      where.hashtags = {
        some: {
          hashtag: {
            name: filters.hashtag,
          },
        },
      };
    }

    if (filters.search) {
      where.content = {
        contains: filters.search,
        mode: 'insensitive',
      };
    }

    // Calculate sorting
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
        include: {
          author: true,
          reactions: {
            include: {
              reactor: true,
            },
          },
          comments: {
            include: {
              author: true,
            },
          },
          postMedia: {
            orderBy: {
              order: 'asc',
            },
          },
          hashtags: {
            include: {
              hashtag: true,
            },
          },
        },
        orderBy,
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      posts: posts.map((post) => this.mapToEntity(post)),
      total,
    };
  }

  async findByAuthorId(
    authorId: string,
    page: number,
    limit: number,
  ): Promise<{ posts: PostEntity[]; total: number }> {
    return this.findAll({
      authorId,
      page,
      limit,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.post.delete({
      where: { id },
    });
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
      where: {
        id: { in: ids },
      },
      include: {
        author: true,
        reactions: {
          include: {
            reactor: true,
          },
        },
        comments: {
          include: {
            author: true,
          },
        },
        postMedia: {
          orderBy: {
            order: 'asc',
          },
        },
        hashtags: {
          include: {
            hashtag: true,
          },
        },
      },
    });

    return posts.map((post) => this.mapToEntity(post));
  }

  async getTimelineFeed(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ posts: PostEntity[]; total: number }> {
    // Timeline: User's own posts + posts from followed users
    // Strategy: Get mixed posts with user's posts having higher priority

    // Get user's own posts (first priority)
    const userPosts = await this.prisma.post.findMany({
      where: {
        authorId: userId,
        privacy: {
          in: ['PUBLIC', 'FOLLOWERS', 'PRIVATE'], // User can see all their posts
        },
      },
      include: {
        author: true,
        reactions: { include: { reactor: true } },
        comments: { include: { author: true } },
        postMedia: { orderBy: { order: 'asc' } },
        hashtags: { include: { hashtag: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: Math.ceil(limit * 0.4), // 40% of limit for user's posts
    });

    console.log('User posts count:', userPosts.length, userId);

    // Get followed users' posts (second priority)
    const followedPosts = await this.prisma.post.findMany({
      where: {
        author: {
          followers: {
            some: {
              followerId: userId,
            },
          },
        },
        authorId: { not: userId }, // Exclude user's own posts to avoid duplicates
        privacy: {
          in: ['public', 'followers'],
        },
      },
      include: {
        author: true,
        reactions: { include: { reactor: true } },
        comments: { include: { author: true } },
        postMedia: { orderBy: { order: 'asc' } },
        hashtags: { include: { hashtag: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: Math.ceil(limit * 0.6), // 60% for followed users' posts
    });

    // Mix posts: user's posts get priority, then followed posts
    // Sort by creation time within each group
    const allPosts = [...userPosts, ...followedPosts].sort((a, b) => {
      // User's posts first, then by creation time
      if (a.authorId === userId && b.authorId !== userId) return -1;
      if (a.authorId !== userId && b.authorId === userId) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Apply pagination to mixed results
    const startIndex = (page - 1) * limit;
    const paginatedPosts = allPosts.slice(startIndex, startIndex + limit);

    // Get total count for pagination
    const totalCount = await this.prisma.post.count({
      where: {
        OR: [
          { authorId: userId },
          {
            author: {
              followers: {
                some: {
                  followerId: userId,
                },
              },
            },
            authorId: { not: userId },
          },
        ],
        privacy: {
          in: ['public', 'followers', 'private'],
        },
      },
    });

    return {
      posts: paginatedPosts.map((post) => this.mapToEntity(post)),
      total: totalCount,
    };
  }

  async getTrendingPosts(
    page: number,
    limit: number,
  ): Promise<{ posts: PostEntity[]; total: number }> {
    // Get posts with high engagement in the last 24 hours
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: {
          privacy: 'public',
          createdAt: {
            gte: oneDayAgo,
          },
        },
        include: {
          author: true,
          reactions: {
            include: {
              reactor: true,
            },
          },
          comments: {
            include: {
              author: true,
            },
          },
          postMedia: {
            orderBy: {
              order: 'asc',
            },
          },
          hashtags: {
            include: {
              hashtag: true,
            },
          },
          _count: {
            select: {
              reactions: true,
              comments: true,
            },
          },
        },
        orderBy: [
          { reactions: { _count: 'desc' } },
          { comments: { _count: 'desc' } },
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.post.count({
        where: {
          privacy: 'public',
          createdAt: {
            gte: oneDayAgo,
          },
        },
      }),
    ]);

    return {
      posts: posts.map((post) => this.mapToEntity(post)),
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
      select: {
        _count: {
          select: {
            reactions: true,
            comments: true,
          },
        },
      },
    });

    return {
      likesCount: stats?._count.reactions || 0,
      commentsCount: stats?._count.comments || 0,
      sharesCount: 0, // TODO: Implement shares feature
    };
  }

  private mapToEntity(data: any): PostEntity {
    // Local helpers to coerce unknown prisma results into safe primitives
    const asRecord = (v: unknown): Record<string, unknown> =>
      v && typeof v === 'object' ? (v as Record<string, unknown>) : {};

    const safeString = (v: unknown): string => {
      if (v === null || v === undefined) return '';
      if (typeof v === 'string') return v;
      if (typeof v === 'number' || typeof v === 'boolean') return String(v);
      // For objects/arrays avoid default [object Object] stringification
      try {
        const json = JSON.stringify(v);
        return json === undefined ? Object.prototype.toString.call(v) : json;
      } catch {
        return Object.prototype.toString.call(v);
      }
    };

    const safeDate = (v: unknown): Date => {
      if (v instanceof Date) return v;
      const s = safeString(v);
      const d = new Date(s);
      return isNaN(d.getTime()) ? new Date() : d;
    };

    const row = asRecord(data);

    const hashtags = Array.isArray(row.hashtags)
      ? row.hashtags
          .map((h) => asRecord(h).hashtag)
          .map((hh) => safeString(asRecord(hh).name))
      : [];

    const media = Array.isArray(row.postMedia)
      ? row.postMedia.map((m) => {
          const rr = asRecord(m);
          return {
            id: safeString(rr.id),
            url: safeString(rr.url),
            type: safeString(rr.type) as 'image' | 'video',
            order: Number(rr.order) || 0,
          };
        })
      : [];

    const reactions = Array.isArray(row.reactions)
      ? row.reactions.map((r) => {
          const rr = asRecord(r);
          return {
            id: safeString(rr.id),
            userId: safeString(rr.reactorId),
            type: safeString(rr.type) as ReactionType,
            createdAt: safeDate(rr.createdAt),
          };
        })
      : [];

    const comments = Array.isArray(row.comments)
      ? row.comments.map((c) => {
          const rc = asRecord(c);
          return {
            id: safeString(rc.id),
            content: safeString(rc.content),
            authorId: safeString(rc.authorId),
            parentId: safeString(rc.parentId),
            createdAt: safeDate(rc.createdAt),
            updatedAt: safeDate(rc.updatedAt),
          };
        })
      : [];

    return this.postFactory.reconstitute({
      id: safeString(row.id),
      content: safeString(row.content),
      authorId: safeString(row.authorId),
      privacy: safeString(row.privacy) as PostPrivacy,
      hashtags,
      media,
      reactions,
      comments,
      createdAt: safeDate(row.createdAt),
      updatedAt: safeDate(row.updatedAt),
    });
  }

  // Missing methods implementation
  async findByHashtag(
    hashtag: string,
    page: number,
    limit: number,
  ): Promise<{
    posts: PostEntity[];
    total: number;
  }> {
    const offset = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: {
          hashtags: {
            some: {
              hashtag: {
                name: hashtag,
              },
            },
          },
          privacy: PostPrivacy.PUBLIC,
        },
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: true,
          postMedia: true,
          reactions: {
            include: {
              reactor: true,
            },
          },
          comments: {
            include: {
              author: true,
              replies: {
                include: {
                  author: true,
                },
              },
            },
          },
          hashtags: {
            include: {
              hashtag: true,
            },
          },
        },
      }),
      this.prisma.post.count({
        where: {
          hashtags: {
            some: {
              hashtag: {
                name: hashtag,
              },
            },
          },
          privacy: PostPrivacy.PUBLIC,
        },
      }),
    ]);

    return {
      posts: posts.map((post) => this.mapToEntity(post)),
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
  ): Promise<{
    posts: PostEntity[];
    total: number;
  }> {
    const offset = (page - 1) * limit;
    const where: any = {
      OR: [
        {
          content: {
            contains: query,
            mode: 'insensitive',
          },
        },
        {
          hashtags: {
            hasSome: query.split(' '),
          },
        },
      ],
    };

    if (filters.authorId) {
      where.authorId = filters.authorId;
    }

    if (filters.hashtag) {
      where.hashtags = {
        has: filters.hashtag,
      };
    }

    if (filters.privacy) {
      where.privacy = filters.privacy as PostPrivacy;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.createdAt.lte = filters.dateTo;
      }
    }

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: true,
          postMedia: true,
          reactions: {
            include: {
              reactor: true,
            },
          },
          comments: {
            include: {
              author: true,
              replies: {
                include: {
                  author: true,
                },
              },
            },
          },
          hashtags: {
            include: {
              hashtag: true,
            },
          },
        },
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      posts: posts.map((post) => this.mapToEntity(post)),
      total,
    };
  }
}
