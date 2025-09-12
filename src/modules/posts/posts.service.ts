import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { CreatePostDto } from './dto/createPost.dto';
import { UpdatePostDto } from './dto/updatePost.dto';
import { RedisCacheService } from '../cache/cache.service';
import { REDIS } from 'src/config/redis.config';
import { PostMediasService } from '../post-medias/postMedias.service';
import { PrismaService } from 'src/database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisCacheService: RedisCacheService,
    private readonly postMediasService: PostMediasService,
  ) {}

  async create(
    createPostDto: CreatePostDto,
    authorId: string,
    media?: Express.Multer.File[],
  ) {
    const author = await this.prisma.user.findUnique({
      where: { id: authorId },
    });
    if (!author) throw new NotFoundException('Author not found');

    return this.prisma.$transaction(async (prisma) => {
      // Create the post
      const post = await prisma.post.create({
        data: {
          content: createPostDto.content,
          privacy: createPostDto.privacy || 'public',
          authorId,
        },
      });

      // If media is provided, upload and create media records
      if (media && media.length > 0) {
        await this.postMediasService.uploadAndCreate(media, post.id, authorId);
      }

      return post;
    });
  }

  async findAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const posts = await this.prisma.post.findMany({
      skip,
      take: limit,
      include: {
        author: { select: { id: true, fullName: true, avatar: true } },
        postMedia: {
          select: {
            id: true,
            url: true,
            type: true,
            order: true,
            createdAt: true,
          },
          orderBy: { order: 'asc' },
        },
        reactions: {
          include: {
            reactor: { select: { id: true, fullName: true, avatar: true } },
          },
        },
        comments: {
          include: {
            author: { select: { id: true, fullName: true, avatar: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
        _count: { select: { reactions: true, comments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const total = await this.prisma.post.count();

    return {
      posts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, fullName: true, avatar: true, bio: true },
        },
        postMedia: {
          select: {
            id: true,
            url: true,
            type: true,
            order: true,
            createdAt: true,
          },
          orderBy: { order: 'asc' },
        },
        reactions: {
          include: {
            reactor: { select: { id: true, fullName: true, avatar: true } },
          },
        },
        comments: {
          include: {
            author: { select: { id: true, fullName: true, avatar: true } },
            replies: {
              include: {
                author: { select: { id: true, fullName: true, avatar: true } },
              },
            },
          },
          where: { parentId: null },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { reactions: true, comments: true } },
      },
    });

    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async update(id: string, updatePostDto: UpdatePostDto, reactorId: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.authorId !== reactorId)
      throw new ForbiddenException('You can only update your own posts');

    const updatedPost = await this.prisma.post.update({
      where: { id },
      data: {
        content: updatePostDto.content,
        // media updates should be handled by post-medias module
        privacy: updatePostDto.privacy,
      },
      include: {
        author: { select: { id: true, fullName: true, avatar: true } },
        postMedia: {
          select: {
            id: true,
            url: true,
            type: true,
            order: true,
            createdAt: true,
          },
          orderBy: { order: 'asc' },
        },
        reactions: {
          include: {
            reactor: { select: { id: true, fullName: true, avatar: true } },
          },
        },
        comments: {
          include: {
            author: { select: { id: true, fullName: true, avatar: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { reactions: true, comments: true } },
      },
    });

    return updatedPost;
  }

  async remove(id: string, reactorId: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.authorId !== reactorId)
      throw new ForbiddenException('You can only delete your own posts');

    // Use transaction to ensure atomicity
    await this.prisma.$transaction(async (prisma) => {
      // Delete related media using PostMediasService
      await this.postMediasService.removeByPost(id, reactorId);

      // Delete the post
      await prisma.post.delete({ where: { id } });
    });

    return { message: 'Post deleted successfully' };
  }

  async findByreactor(reactorId: string, page = 1, limit = 10) {
    const user = await this.prisma.user.findUnique({
      where: { id: reactorId },
    });
    if (!user) throw new NotFoundException('User not found');

    const skip = (page - 1) * limit;

    const posts = await this.prisma.post.findMany({
      where: { authorId: reactorId },
      skip,
      take: limit,
      include: {
        author: { select: { id: true, fullName: true, avatar: true } },
        postMedia: {
          select: {
            id: true,
            url: true,
            type: true,
            order: true,
            createdAt: true,
          },
          orderBy: { order: 'asc' },
        },
        reactions: {
          include: {
            reactor: { select: { id: true, fullName: true, avatar: true } },
          },
        },
        comments: {
          include: {
            author: { select: { id: true, fullName: true, avatar: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
        _count: { select: { reactions: true, comments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const total = await this.prisma.post.count({
      where: { authorId: reactorId },
    });

    return {
      posts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // Alias used by controllers
  async findByUser(userId: string, page = 1, limit = 10) {
    return this.findByreactor(userId, page, limit);
  }

  async searchPosts(query: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    // use a plain object here to avoid generated Prisma type mismatches in some environments
    const where = {
      OR: [{ content: { contains: query, mode: 'insensitive' } }],
    } as any;

    const posts = await this.prisma.post.findMany({
      where,
      skip,
      take: limit,
      include: {
        author: { select: { id: true, fullName: true, avatar: true } },
        postMedia: {
          select: {
            id: true,
            url: true,
            type: true,
            order: true,
            createdAt: true,
          },
          orderBy: { order: 'asc' },
        },
        reactions: {
          include: {
            reactor: { select: { id: true, fullName: true, avatar: true } },
          },
        },
        comments: {
          include: {
            author: { select: { id: true, fullName: true, avatar: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
        _count: { select: { reactions: true, comments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const total = await this.prisma.post.count({ where });

    return {
      posts,
      query,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getPostStats(userId?: string) {
    // avoid relying on generated Prisma.PostWhereInput type to prevent build-time type issues
    const postWhere = (userId ? { authorId: userId } : {}) as any;

    const totalPosts = await this.prisma.post.count({ where: postWhere });
    const totalReactions = await this.prisma.reaction.count({
      where: userId ? { post: { authorId: userId } } : {},
    });
    const totalComments = await this.prisma.comment.count({
      where: userId ? { post: { authorId: userId } } : {},
    });

    return { totalPosts, totalReactions, totalComments };
  }

  async getFeedPosts(reactorId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const cacheKey = `feed:${reactorId}:p:${page}:l:${limit}:v1`;
    const cached = await this.redisCacheService.get(cacheKey);
    console.log('Cached feed posts: ', cached);
    if (cached) return cached as any;

    const following = await this.prisma.follow.findMany({
      where: { followerId: reactorId },
      select: { followingId: true },
    });
    const followingIds = following.map((f) => f.followingId);
    followingIds.push(reactorId);

    const posts = await this.prisma.post.findMany({
      where: {
        authorId: { in: followingIds },
        privacy: { in: ['public', 'followers'] },
      },
      skip,
      take: limit,
      include: {
        author: { select: { id: true, fullName: true, avatar: true } },
        postMedia: {
          select: {
            id: true,
            url: true,
            type: true,
            order: true,
            createdAt: true,
          },
          orderBy: { order: 'asc' },
        },
        reactions: {
          include: {
            reactor: { select: { id: true, fullName: true, avatar: true } },
          },
        },
        comments: {
          include: {
            author: { select: { id: true, fullName: true, avatar: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
        _count: { select: { reactions: true, comments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const total = await this.prisma.post.count({
      where: {
        authorId: { in: followingIds },
        privacy: { in: ['public', 'followers'] },
      },
    });

    const result = {
      posts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };

    await this.redisCacheService.set(cacheKey, result, REDIS.TTL_POSTS);
    return result;
  }
}
