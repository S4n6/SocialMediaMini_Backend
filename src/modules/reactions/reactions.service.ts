import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateReactionDto } from './dto/createReaction.dto';
import { UpdateReactionDto } from './dto/updateReaction.dto';

@Injectable()
export class ReactionsService {
  constructor(private prisma: PrismaService) {}

  async create(createReactionDto: CreateReactionDto, userId: string) {
    const { reactionType, postId, commentId } = createReactionDto;

    // Validate that either postId or commentId is provided, but not both
    if (!postId && !commentId) {
      throw new BadRequestException(
        'Either postId or commentId must be provided',
      );
    }

    if (postId && commentId) {
      throw new BadRequestException(
        'Cannot react to both post and comment simultaneously',
      );
    }

    // Check if target exists (post or comment)
    if (postId) {
      const post = await this.prisma.post.findUnique({
        where: { id: postId },
      });
      if (!post) {
        throw new NotFoundException('Post not found');
      }
    }

    if (commentId) {
      const comment = await this.prisma.comment.findUnique({
        where: { id: commentId },
      });
      if (!comment) {
        throw new NotFoundException('Comment not found');
      }
    }

    // Check if user already reacted
    const existingReaction = await this.prisma.reaction.findFirst({
      where: {
        reactorId: userId,
        ...(postId && { postId }),
        ...(commentId && { commentId }),
      },
    });

    if (existingReaction) {
      // Update existing reaction
      const updatedReaction = await this.prisma.reaction.update({
        where: { id: existingReaction.id },
        data: { reactionType },
        include: {
          reactor: {
            select: {
              id: true,
              username: true,
              fullname: true,
              profilePicture: true,
            },
          },
          post: postId
            ? {
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
              }
            : undefined,
          comment: commentId
            ? {
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
              }
            : undefined,
        },
      });

      return updatedReaction;
    } else {
      // Create new reaction
      const newReaction = await this.prisma.reaction.create({
        data: {
          reactionType,
          reactorId: userId,
          ...(postId && { postId }),
          ...(commentId && { commentId }),
        },
        include: {
          reactor: {
            select: {
              id: true,
              username: true,
              fullname: true,
              profilePicture: true,
            },
          },
          post: postId
            ? {
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
              }
            : undefined,
          comment: commentId
            ? {
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
              }
            : undefined,
        },
      });

      return newReaction;
    }
  }

  async findAll(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [reactions, totalCount] = await Promise.all([
      this.prisma.reaction.findMany({
        skip,
        take: limit,
        include: {
          reactor: {
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
          comment: {
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
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.reaction.count(),
    ]);

    return {
      reactions,
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
    const reaction = await this.prisma.reaction.findUnique({
      where: { id },
      include: {
        reactor: {
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
        comment: {
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
      },
    });

    if (!reaction) {
      throw new NotFoundException('Reaction not found');
    }

    return reaction;
  }

  async findByPost(postId: string, page: number = 1, limit: number = 20) {
    // Check if post exists
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const skip = (page - 1) * limit;

    const [reactions, totalCount] = await Promise.all([
      this.prisma.reaction.findMany({
        where: { postId },
        skip,
        take: limit,
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
      }),
      this.prisma.reaction.count({
        where: { postId },
      }),
    ]);

    return {
      reactions,
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

  async findByComment(commentId: string, page: number = 1, limit: number = 20) {
    // Check if comment exists
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const skip = (page - 1) * limit;

    const [reactions, totalCount] = await Promise.all([
      this.prisma.reaction.findMany({
        where: { commentId },
        skip,
        take: limit,
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
      }),
      this.prisma.reaction.count({
        where: { commentId },
      }),
    ]);

    return {
      reactions,
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

    const [reactions, totalCount] = await Promise.all([
      this.prisma.reaction.findMany({
        where: { reactorId: userId },
        skip,
        take: limit,
        include: {
          reactor: {
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
          comment: {
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
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.reaction.count({
        where: { reactorId: userId },
      }),
    ]);

    return {
      reactions,
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

  async update(
    id: string,
    updateReactionDto: UpdateReactionDto,
    userId: string,
  ) {
    const reaction = await this.prisma.reaction.findUnique({
      where: { id },
    });

    if (!reaction) {
      throw new NotFoundException('Reaction not found');
    }

    // Check if user owns this reaction
    if (reaction.reactorId !== userId) {
      throw new ForbiddenException('You can only update your own reactions');
    }

    const updatedReaction = await this.prisma.reaction.update({
      where: { id },
      data: updateReactionDto,
      include: {
        reactor: {
          select: {
            id: true,
            username: true,
            fullname: true,
            profilePicture: true,
          },
        },
        post: reaction.postId
          ? {
              select: {
                id: true,
                content: true,
              },
            }
          : undefined,
        comment: reaction.commentId
          ? {
              select: {
                id: true,
                content: true,
              },
            }
          : undefined,
      },
    });

    return updatedReaction;
  }

  async remove(id: string, userId: string) {
    const reaction = await this.prisma.reaction.findUnique({
      where: { id },
    });

    if (!reaction) {
      throw new NotFoundException('Reaction not found');
    }

    // Check if user owns this reaction or has admin role
    if (reaction.reactorId !== userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        throw new ForbiddenException('You can only delete your own reactions');
      }
    }

    await this.prisma.reaction.delete({
      where: { id },
    });

    return { message: 'Reaction deleted successfully' };
  }

  async removeByTarget(postId?: string, commentId?: string, userId?: string) {
    if (!postId && !commentId) {
      throw new BadRequestException(
        'Either postId or commentId must be provided',
      );
    }

    const whereClause: any = {};

    if (postId) whereClause.postId = postId;
    if (commentId) whereClause.commentId = commentId;
    if (userId) whereClause.reactorId = userId;

    const reaction = await this.prisma.reaction.findFirst({
      where: whereClause,
    });

    if (!reaction) {
      throw new NotFoundException('Reaction not found');
    }

    await this.prisma.reaction.delete({
      where: { id: reaction.id },
    });

    return { message: 'Reaction removed successfully' };
  }

  // Get reaction statistics
  async getReactionStats(postId?: string, commentId?: string) {
    const whereClause: any = {};

    if (postId) whereClause.postId = postId;
    if (commentId) whereClause.commentId = commentId;

    const reactions = await this.prisma.reaction.findMany({
      where: whereClause,
      select: {
        reactionType: true,
      },
    });

    // Count reactions by type
    const reactionCounts = reactions.reduce(
      (acc, reaction) => {
        acc[reaction.reactionType] = (acc[reaction.reactionType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const totalReactions = reactions.length;

    return {
      totalReactions,
      reactionCounts,
      breakdown: Object.entries(reactionCounts).map(([type, count]) => ({
        type,
        count,
        percentage:
          totalReactions > 0 ? ((count / totalReactions) * 100).toFixed(2) : 0,
      })),
    };
  }

  // Get user's reaction to a specific post/comment
  async getUserReaction(userId: string, postId?: string, commentId?: string) {
    if (!postId && !commentId) {
      throw new BadRequestException(
        'Either postId or commentId must be provided',
      );
    }

    const whereClause: any = { reactorId: userId };

    if (postId) whereClause.postId = postId;
    if (commentId) whereClause.commentId = commentId;

    const reaction = await this.prisma.reaction.findFirst({
      where: whereClause,
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

    return reaction;
  }
}
