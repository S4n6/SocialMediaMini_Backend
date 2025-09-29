import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { PostEntity, PostPrivacy, ReactionType } from '../domain/post.entity';
import { PostFactory } from '../domain/factories/post.factory';
import { IPostDomainRepository } from '../domain/repositories/post-domain-repository.interface';

/**
 * Prisma implementation of Post repository
 * Handles persistence operations using Prisma ORM
 */
@Injectable()
export class PostPrismaRepository implements IPostDomainRepository {
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

    // Handle reactions - sync reactions
    const existingReactions = await this.prisma.reaction.findMany({
      where: { postId: post.id },
    });

    const currentReactionIds = post.reactions.map((r) => r.id);
    const existingReactionIds = existingReactions.map((r) => r.id);

    // Delete removed reactions
    const reactionsToDelete = existingReactionIds.filter(
      (id) => !currentReactionIds.includes(id),
    );
    if (reactionsToDelete.length > 0) {
      await this.prisma.reaction.deleteMany({
        where: { id: { in: reactionsToDelete } },
      });
    }

    // Create new reactions
    const newReactions = post.reactions.filter(
      (r) => !existingReactionIds.includes(r.id),
    );
    if (newReactions.length > 0) {
      await this.prisma.reaction.createMany({
        data: newReactions.map((reaction) => ({
          id: reaction.id,
          type: reaction.type,
          postId: post.id,
          reactorId: reaction.userId,
          createdAt: reaction.createdAt,
        })),
      });
    }

    // Handle comments - sync comments
    const existingComments = await this.prisma.comment.findMany({
      where: { postId: post.id },
    });

    const currentCommentIds = post.comments.map((c) => c.id);
    const existingCommentIds = existingComments.map((c) => c.id);

    // Delete removed comments
    const commentsToDelete = existingCommentIds.filter(
      (id) => !currentCommentIds.includes(id),
    );
    if (commentsToDelete.length > 0) {
      await this.prisma.comment.deleteMany({
        where: { id: { in: commentsToDelete } },
      });
    }

    // Upsert comments
    for (const comment of post.comments) {
      await this.prisma.comment.upsert({
        where: { id: comment.id },
        create: {
          id: comment.id,
          content: comment.content,
          postId: post.id,
          authorId: comment.authorId,
          parentId: comment.parentId,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
        },
        update: {
          content: comment.content,
          updatedAt: comment.updatedAt,
        },
      });
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

  async getUserFeed(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ posts: PostEntity[]; total: number }> {
    // Get posts from followed users + user's own posts
    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
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
            },
          ],
          privacy: {
            in: ['public', 'followers'],
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
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.post.count({
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
            },
          ],
          privacy: {
            in: ['public', 'followers'],
          },
        },
      }),
    ]);

    return {
      posts: posts.map((post) => this.mapToEntity(post)),
      total,
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
    };
  }

  private mapToEntity(data: any): PostEntity {
    return this.postFactory.reconstitute({
      id: data.id,
      content: data.content,
      authorId: data.authorId,
      privacy: data.privacy as PostPrivacy,
      hashtags: data.hashtags.map((h: any) => h.hashtag.name),
      media: data.postMedia.map((m: any) => ({
        id: m.id,
        url: m.url,
        type: m.type as 'image' | 'video',
        order: m.order,
      })),
      reactions: data.reactions.map((r: any) => ({
        id: r.id,
        userId: r.reactorId,
        type: r.type as ReactionType,
        createdAt: r.createdAt,
      })),
      comments: data.comments.map((c: any) => ({
        id: c.id,
        content: c.content,
        authorId: c.authorId,
        parentId: c.parentId,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }
}
