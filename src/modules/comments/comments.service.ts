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

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: authorId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if post exists
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // If it's a reply, check if parent comment exists and belongs to the same post
    if (parentId) {
      const parentComment = await this.prisma.comment.findUnique({
        where: { id: parentId },
      });

      if (!parentComment) {
        throw new NotFoundException('Parent comment not found');
      }

      if (parentComment.postId !== postId) {
        throw new BadRequestException(
          'Parent comment must belong to the same post',
        );
      }
    }

    const comment = await this.prisma.comment.create({
      data: {
        content,
        authorId,
        postId,
        parentId,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            fullname: true,
            profilePicture: true,
          },
        },
        parent: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                fullname: true,
              },
            },
          },
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                fullname: true,
                profilePicture: true,
              },
            },
            _count: {
              select: {
                reactions: true,
                replies: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        _count: {
          select: {
            reactions: true,
            replies: true,
          },
        },
      },
    });

    return comment;
  }

  async findAll(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [comments, totalCount] = await Promise.all([
      this.prisma.comment.findMany({
        skip,
        take: limit,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              fullname: true,
              profilePicture: true,
            },
          },
          post: {
            select: {
              id: true,
              content: true,
              author: {
                select: {
                  id: true,
                  username: true,
                  fullname: true,
                },
              },
            },
          },
          reactions: {
            include: {
              reactor: {
                select: {
                  id: true,
                  username: true,
                  fullname: true,
                },
              },
            },
          },
          _count: {
            select: {
              reactions: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
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
          select: {
            id: true,
            username: true,
            fullname: true,
            profilePicture: true,
          },
        },
        post: {
          select: {
            id: true,
            content: true,
            author: {
              select: {
                id: true,
                username: true,
                fullname: true,
              },
            },
          },
        },
        reactions: {
          include: {
            reactor: {
              select: {
                id: true,
                username: true,
                fullname: true,
              },
            },
          },
        },
        _count: {
          select: {
            reactions: true,
          },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return comment;
  }

  async findByPost(postId: string, page: number = 1, limit: number = 20) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const skip = (page - 1) * limit;

    // Get only top-level comments (no parent)
    const [comments, totalCount] = await Promise.all([
      this.prisma.comment.findMany({
        where: {
          postId,
          parentId: null, // ← Only top-level comments
        },
        skip,
        take: limit,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              fullname: true,
              profilePicture: true,
            },
          },
          replies: {
            include: {
              author: {
                select: {
                  id: true,
                  username: true,
                  fullname: true,
                  profilePicture: true,
                },
              },
              replies: {
                include: {
                  author: {
                    select: {
                      id: true,
                      username: true,
                      fullname: true,
                      profilePicture: true,
                    },
                  },
                  _count: {
                    select: {
                      reactions: true,
                    },
                  },
                },
                orderBy: {
                  createdAt: 'asc',
                },
              },
              _count: {
                select: {
                  reactions: true,
                  replies: true,
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
          _count: {
            select: {
              reactions: true,
              replies: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
      this.prisma.comment.count({
        where: {
          postId,
          parentId: null,
        },
      }),
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

  async getReplies(commentId: string, page: number = 1, limit: number = 10) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const skip = (page - 1) * limit;

    const [replies, totalCount] = await Promise.all([
      this.prisma.comment.findMany({
        where: { parentId: commentId },
        skip,
        take: limit,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              fullname: true,
              profilePicture: true,
            },
          },
          _count: {
            select: {
              reactions: true,
              replies: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
      this.prisma.comment.count({
        where: { parentId: commentId },
      }),
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

  async findByUser(userId: string, page: number = 1, limit: number = 20) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const skip = (page - 1) * limit;

    const [comments, totalCount] = await Promise.all([
      this.prisma.comment.findMany({
        where: { authorId: userId },
        skip,
        take: limit,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              fullname: true,
              profilePicture: true,
            },
          },
          post: {
            select: {
              id: true,
              content: true,
              author: {
                select: {
                  id: true,
                  username: true,
                  fullname: true,
                },
              },
            },
          },
          reactions: {
            include: {
              reactor: {
                select: {
                  id: true,
                  username: true,
                  fullname: true,
                },
              },
            },
          },
          _count: {
            select: {
              reactions: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.comment.count({
        where: { authorId: userId },
      }),
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
      include: {
        author: true,
      },
    });

    if (!existingComment) {
      throw new NotFoundException('Comment not found');
    }

    // Check if user is the author or has admin role
    if (existingComment.authorId !== userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        throw new ForbiddenException('You can only update your own comments');
      }
    }

    const updatedComment = await this.prisma.comment.update({
      where: { id },
      data: updateCommentDto,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            fullname: true,
            profilePicture: true,
          },
        },
        post: {
          select: {
            id: true,
            content: true,
            author: {
              select: {
                id: true,
                username: true,
                fullname: true,
              },
            },
          },
        },
        reactions: {
          include: {
            reactor: {
              select: {
                id: true,
                username: true,
                fullname: true,
              },
            },
          },
        },
        _count: {
          select: {
            reactions: true,
          },
        },
      },
    });

    return updatedComment;
  }

  async remove(id: string, userId: string) {
    const existingComment = await this.prisma.comment.findUnique({
      where: { id },
      include: {
        author: true,
      },
    });

    if (!existingComment) {
      throw new NotFoundException('Comment not found');
    }

    // Check if user is the author or has admin role
    if (existingComment.authorId !== userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        throw new ForbiddenException('You can only delete your own comments');
      }
    }

    // Delete comment and its reactions in transaction
    await this.prisma.$transaction(async (prisma) => {
      // Delete reactions to this comment
      await prisma.reaction.deleteMany({
        where: { commentId: id },
      });

      // Delete the comment
      await prisma.comment.delete({
        where: { id },
      });
    });

    return { message: 'Comment deleted successfully' };
  }

  async addReaction(commentId: string, userId: string, reactionType: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Check if user already reacted to this comment
    const existingReaction = await this.prisma.reaction.findUnique({
      where: {
        reactorId_commentId: {
          reactorId: userId,
          commentId: commentId,
        },
      },
    });

    if (existingReaction) {
      const updatedReaction = await this.prisma.reaction.update({
        where: { id: existingReaction.id },
        data: { reactionType },
        include: {
          reactor: {
            select: {
              id: true,
              username: true,
              fullname: true,
            },
          },
        },
      });
      return updatedReaction;
    } else {
      const newReaction = await this.prisma.reaction.create({
        data: {
          reactionType,
          reactorId: userId,
          commentId: commentId,
        },
        include: {
          reactor: {
            select: {
              id: true,
              username: true,
              fullname: true,
            },
          },
        },
      });
      return newReaction;
    }
  }

  async removeReaction(commentId: string, userId: string) {
    const reaction = await this.prisma.reaction.findUnique({
      where: {
        reactorId_commentId: {
          reactorId: userId,
          commentId: commentId,
        },
      },
    });

    if (!reaction) {
      throw new NotFoundException('Reaction not found');
    }

    await this.prisma.reaction.delete({
      where: { id: reaction.id },
    });

    return { message: 'Reaction removed successfully' };
  }

  async getCommentReactions(commentId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const reactions = await this.prisma.reaction.findMany({
      where: { commentId },
      include: {
        reactor: {
          select: {
            id: true,
            username: true,
            fullname: true,
            profilePicture: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return reactions;
  }

  async searchComments(query: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [comments, totalCount] = await Promise.all([
      this.prisma.comment.findMany({
        where: {
          content: {
            contains: query,
            mode: 'insensitive',
          },
        },
        skip,
        take: limit,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              fullname: true,
              profilePicture: true,
            },
          },
          post: {
            select: {
              id: true,
              content: true,
              author: {
                select: {
                  id: true,
                  username: true,
                  fullname: true,
                },
              },
            },
          },
          _count: {
            select: {
              reactions: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.comment.count({
        where: {
          content: {
            contains: query,
            mode: 'insensitive',
          },
        },
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

    const [totalComments, totalReactions] = await Promise.all([
      this.prisma.comment.count({ where: whereClause }),
      this.prisma.reaction.count({
        where: {
          comment: whereClause,
        },
      }),
    ]);

    return {
      totalComments,
      totalReactions,
    };
  }

  async removeAllByPost(postId: string, userId: string) {
    // Check if post exists and user has permission
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: { author: true },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Check if user is post author or has admin role
    if (post.authorId !== userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        throw new ForbiddenException(
          'You can only delete comments from your own posts',
        );
      }
    }

    // Delete all comments and their reactions in transaction
    await this.prisma.$transaction(async (prisma) => {
      // Get all comments for this post
      const comments = await prisma.comment.findMany({
        where: { postId },
        select: { id: true },
      });

      // Delete all reactions to these comments
      for (const comment of comments) {
        await prisma.reaction.deleteMany({
          where: { commentId: comment.id },
        });
      }

      // Delete all comments
      await prisma.comment.deleteMany({
        where: { postId },
      });
    });

    return { message: 'All post comments deleted successfully' };
  }

  async getRecentComments(userId: string, limit: number = 5) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const comments = await this.prisma.comment.findMany({
      where: { authorId: userId },
      take: limit,
      include: {
        post: {
          select: {
            id: true,
            content: true,
            author: {
              select: {
                id: true,
                username: true,
                fullname: true,
              },
            },
          },
        },
        _count: {
          select: {
            reactions: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return comments;
  }

  async getTrendingComments(limit: number = 10) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const comments = await this.prisma.comment.findMany({
      where: {
        createdAt: {
          gte: yesterday,
        },
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            fullname: true,
            profilePicture: true,
          },
        },
        post: {
          select: {
            id: true,
            content: true,
            author: {
              select: {
                id: true,
                username: true,
                fullname: true,
              },
            },
          },
        },
        _count: {
          select: {
            reactions: true,
          },
        },
      },
      orderBy: {
        reactions: {
          _count: 'desc',
        },
      },
      take: limit,
    });

    return comments;
  }
}
