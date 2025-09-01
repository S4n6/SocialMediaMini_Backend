import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateCommentDto } from './dto/createComment.dto';
import { UpdateCommentDto } from './dto/updateComment.dto';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async create(createCommentDto: CreateCommentDto, authorId: string) {
    const { content, postId, parentId } = createCommentDto;

    const user = await this.prisma.user.findUnique({ where: { id: authorId } });
    if (!user) throw new NotFoundException('User not found');

    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    if (parentId) {
      const parentComment = await this.prisma.comment.findUnique({
        where: { id: parentId },
      });
      if (!parentComment)
        throw new NotFoundException('Parent comment not found');
      if (parentComment.postId !== postId)
        throw new BadRequestException(
          'Parent comment must belong to the same post',
        );
    }

    const comment = await this.prisma.comment.create({
      data: { content, authorId, postId, parentId },
      include: {
        author: {
          select: { id: true, userName: true, fullName: true, avatar: true },
        },
        parent: {
          include: {
            author: {
              select: {
                id: true,
                userName: true,
                fullName: true,
                avatar: true,
              },
            },
          },
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                userName: true,
                fullName: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: { select: { replies: true } },
      },
    });

    return comment;
  }

  async findByPost(postId: string, page = 1, limit = 20) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    const skip = (page - 1) * limit;

    const [comments, totalCount] = await Promise.all([
      this.prisma.comment.findMany({
        where: { postId, parentId: null },
        skip,
        take: limit,
        include: {
          author: {
            select: { id: true, userName: true, fullName: true, avatar: true },
          },
          replies: {
            include: {
              author: {
                select: {
                  id: true,
                  userName: true,
                  fullName: true,
                  avatar: true,
                },
              },
            },
            take: 3,
            orderBy: { createdAt: 'asc' },
          },
          _count: { select: { replies: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.comment.count({ where: { postId, parentId: null } }),
    ]);

    return {
      comments,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1,
      },
    };
  }

  async getReplies(commentId: string, page = 1, limit = 10) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });
    if (!comment) throw new NotFoundException('Comment not found');

    const skip = (page - 1) * limit;

    const [replies, totalCount] = await Promise.all([
      this.prisma.comment.findMany({
        where: { parentId: commentId },
        skip,
        take: limit,
        include: {
          author: {
            select: { id: true, userName: true, fullName: true, avatar: true },
          },
          _count: { select: { replies: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.comment.count({ where: { parentId: commentId } }),
    ]);

    return {
      replies,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1,
      },
    };
  }

  async findOne(id: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, userName: true, fullName: true, avatar: true },
        },
        post: {
          select: {
            id: true,
            content: true,
            author: { select: { id: true, userName: true, fullName: true } },
          },
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                userName: true,
                fullName: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: { select: { replies: true } },
      },
    });

    if (!comment) throw new NotFoundException('Comment not found');
    return comment;
  }

  async findByUser(userId: string, page = 1, limit = 20) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const skip = (page - 1) * limit;

    const [comments, totalCount] = await Promise.all([
      this.prisma.comment.findMany({
        where: { authorId: userId },
        skip,
        take: limit,
        include: {
          author: {
            select: { id: true, userName: true, fullName: true, avatar: true },
          },
          post: {
            select: {
              id: true,
              content: true,
              author: { select: { id: true, userName: true, fullName: true } },
            },
          },
          replies: {
            include: {
              author: {
                select: {
                  id: true,
                  userName: true,
                  fullName: true,
                  avatar: true,
                },
              },
            },
            take: 3,
            orderBy: { createdAt: 'desc' },
          },
          _count: { select: { replies: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.comment.count({ where: { authorId: userId } }),
    ]);

    return {
      comments,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1,
      },
    };
  }

  async update(id: string, updateCommentDto: UpdateCommentDto, userId: string) {
    const existingComment = await this.prisma.comment.findUnique({
      where: { id },
      include: { author: true },
    });
    if (!existingComment) throw new NotFoundException('Comment not found');

    if (existingComment.authorId !== userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user || (user.role !== 'admin' && user.role !== 'super_admin'))
        throw new ForbiddenException('You can only update your own comments');
    }

    const updatedComment = await this.prisma.comment.update({
      where: { id },
      data: updateCommentDto,
      include: {
        author: {
          select: { id: true, userName: true, fullName: true, avatar: true },
        },
        post: {
          select: {
            id: true,
            content: true,
            author: { select: { id: true, userName: true, fullName: true } },
          },
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                userName: true,
                fullName: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { replies: true } },
      },
    });

    return updatedComment;
  }

  async remove(id: string, userId: string) {
    const existingComment = await this.prisma.comment.findUnique({
      where: { id },
      include: { author: true },
    });
    if (!existingComment) throw new NotFoundException('Comment not found');

    if (existingComment.authorId !== userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user || (user.role !== 'admin' && user.role !== 'super_admin'))
        throw new ForbiddenException('You can only delete your own comments');
    }

    await this.prisma.$transaction(async (prisma) => {
      const replies = await prisma.comment.findMany({
        where: { parentId: id },
        select: { id: true },
      });
      const replyIds = replies.map((r) => r.id);
      if (replyIds.length)
        await prisma.comment.deleteMany({ where: { id: { in: replyIds } } });
      await prisma.comment.delete({ where: { id } });
    });

    return { message: 'Comment deleted successfully' };
  }

  async removeAllByPost(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: { author: true },
    });
    if (!post) throw new NotFoundException('Post not found');
    if (post.authorId !== userId) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user || (user.role !== 'admin' && user.role !== 'super_admin'))
        throw new ForbiddenException(
          'You can only delete comments from your own posts',
        );
    }

    await this.prisma.$transaction(async (prisma) => {
      const comments = await prisma.comment.findMany({
        where: { postId },
        select: { id: true },
      });
      const commentIds = comments.map((c) => c.id);
      if (commentIds.length)
        await prisma.comment.deleteMany({ where: { id: { in: commentIds } } });
    });

    return { message: 'All post comments deleted successfully' };
  }

  async getRecentComments(userId: string, limit = 5) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const comments = await this.prisma.comment.findMany({
      where: { authorId: userId },
      take: limit,
      include: {
        post: {
          select: {
            id: true,
            content: true,
            author: { select: { id: true, userName: true, fullName: true } },
          },
        },
        _count: { select: { replies: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return comments;
  }

  async getTrendingComments(limit = 10) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // Use replies count as a proxy for trending since comment reactions don't exist
    const comments = await this.prisma.comment.findMany({
      where: { createdAt: { gte: yesterday } },
      include: {
        author: {
          select: { id: true, userName: true, fullName: true, avatar: true },
        },
        post: {
          select: {
            id: true,
            content: true,
            author: { select: { id: true, userName: true, fullName: true } },
          },
        },
        _count: { select: { replies: true } },
      },
    });

    // sort by replies count descending and take top 'limit' comments
    const trending = comments
      .sort((a, b) => (b._count?.replies ?? 0) - (a._count?.replies ?? 0))
      .slice(0, limit);

    return trending;
  }

  // Simple findAll to satisfy controller usage (paginated comments)
  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [comments, totalCount] = await Promise.all([
      this.prisma.comment.findMany({
        skip,
        take: limit,
        include: {
          author: {
            select: { id: true, userName: true, fullName: true, avatar: true },
          },
          post: { select: { id: true, content: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.comment.count(),
    ]);

    return {
      comments,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  // Comment reactions are not supported by the current Prisma schema.
  async addReaction(
    _commentId: string,
    _userId: string,
    _reactionType: string,
  ) {
    throw new BadRequestException(
      'Comment reactions are not supported by the current schema',
    );
  }

  async removeReaction(_commentId: string, _userId: string) {
    throw new BadRequestException(
      'Comment reactions are not supported by the current schema',
    );
  }

  async getCommentReactions(_commentId: string) {
    throw new BadRequestException(
      'Comment reactions are not supported by the current schema',
    );
  }

  async searchComments(query: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [comments, totalCount] = await Promise.all([
      this.prisma.comment.findMany({
        where: { content: { contains: query, mode: 'insensitive' } },
        skip,
        take: limit,
        include: {
          author: {
            select: { id: true, userName: true, fullName: true, avatar: true },
          },
          post: {
            select: {
              id: true,
              content: true,
              author: { select: { id: true, userName: true, fullName: true } },
            },
          },
          _count: { select: { replies: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.comment.count({
        where: { content: { contains: query, mode: 'insensitive' } },
      }),
    ]);

    return {
      comments,
      query,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1,
      },
    };
  }

  async getCommentStats(userId?: string, postId?: string) {
    const whereClause: any = {};
    if (userId) whereClause.authorId = userId;
    if (postId) whereClause.postId = postId;

    const totalComments = await this.prisma.comment.count({
      where: whereClause,
    });

    return { totalComments, totalReactions: 0 };
  }
}
