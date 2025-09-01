import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from 'generated/prisma';
import { CreatePostDto } from './dto/createPost.dto';
import { UpdatePostDto } from './dto/updatePost.dto';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async create(createPostDto: CreatePostDto, authorId: string) {
    const author = await this.prisma.user.findUnique({
      where: { id: authorId },
    });
    if (!author) throw new NotFoundException('Author not found');

    const post = await this.prisma.post.create({
      data: {
        content: createPostDto.content,
        privacy: createPostDto.privacy || 'public',
        authorId,
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

    return post;
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

    await this.prisma.post.delete({ where: { id } });
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

    const where: Prisma.PostWhereInput = {
      OR: [
        { content: { contains: query, mode: Prisma.QueryMode.insensitive } },
      ],
    };

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
    const postWhere: Prisma.PostWhereInput = userId ? { authorId: userId } : {};

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

    return {
      posts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
