import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreatePostDto } from './dto/createPost.dto';
import { UpdatePostDto } from './dto/updatePost.dto';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async create(createPostDto: CreatePostDto, authorId: string) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: authorId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Create post
    const post = await this.prisma.post.create({
      data: {
        content: createPostDto.content,
        authorId,
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
        postMedia: true,
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
        comments: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                fullname: true,
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
            comments: true,
          },
        },
      },
    });

    return post;
  }

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [posts, totalCount] = await Promise.all([
      this.prisma.post.findMany({
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
          postMedia: true,
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
          comments: {
            include: {
              author: {
                select: {
                  id: true,
                  username: true,
                  fullname: true,
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
            take: 3, // Show only first 3 comments
          },
          _count: {
            select: {
              reactions: true,
              comments: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.post.count(),
    ]);

    return {
      posts,
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
    const post = await this.prisma.post.findUnique({
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
        postMedia: true,
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
        comments: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                fullname: true,
              },
            },
            reactions: {
              include: {
                reactor: {
                  select: {
                    id: true,
                    username: true,
                  },
                },
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
            comments: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return post;
  }

  async findByUser(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [posts, totalCount] = await Promise.all([
      this.prisma.post.findMany({
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
          postMedia: true,
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
          comments: {
            include: {
              author: {
                select: {
                  id: true,
                  username: true,
                  fullname: true,
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
            take: 3,
          },
          _count: {
            select: {
              reactions: true,
              comments: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.post.count({
        where: { authorId: userId },
      }),
    ]);

    return {
      posts,
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

  async update(id: string, updatePostDto: UpdatePostDto, userId: string) {
    const existingPost = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: true,
      },
    });

    if (!existingPost) {
      throw new NotFoundException('Post not found');
    }

    // Check if user is the author or has admin role
    if (existingPost.authorId !== userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        throw new ForbiddenException('You can only update your own posts');
      }
    }

    const updatedPost = await this.prisma.post.update({
      where: { id },
      data: updatePostDto,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            fullname: true,
            profilePicture: true,
          },
        },
        postMedia: true,
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
        comments: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                fullname: true,
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
            comments: true,
          },
        },
      },
    });

    return updatedPost;
  }

  async remove(id: string, userId: string) {
    const existingPost = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: true,
        postMedia: true,
      },
    });

    if (!existingPost) {
      throw new NotFoundException('Post not found');
    }

    // Check if user is the author or has admin role
    if (existingPost.authorId !== userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
        throw new ForbiddenException('You can only delete your own posts');
      }
    }

    // Delete post and related data in transaction
    await this.prisma.$transaction(async (prisma) => {
      // Delete reactions
      await prisma.reaction.deleteMany({
        where: { postId: id },
      });

      // Delete comments and their reactions
      const comments = await prisma.comment.findMany({
        where: { postId: id },
      });

      for (const comment of comments) {
        await prisma.reaction.deleteMany({
          where: { commentId: comment.id },
        });
      }

      await prisma.comment.deleteMany({
        where: { postId: id },
      });

      // Delete post media
      await prisma.postMedia.deleteMany({
        where: { postId: id },
      });

      // Delete the post
      await prisma.post.delete({
        where: { id },
      });
    });

    return { message: 'Post deleted successfully' };
  }

  async addReaction(postId: string, userId: string, reactionType: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Check if user already reacted to this post
    const existingReaction = await this.prisma.reaction.findUnique({
      where: {
        reactorId_postId: {
          reactorId: userId,
          postId: postId,
        },
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
            },
          },
        },
      });
      return updatedReaction;
    } else {
      // Create new reaction
      const newReaction = await this.prisma.reaction.create({
        data: {
          reactionType,
          reactorId: userId,
          postId: postId,
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

  async removeReaction(postId: string, userId: string) {
    const reaction = await this.prisma.reaction.findUnique({
      where: {
        reactorId_postId: {
          reactorId: userId,
          postId: postId,
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

  async getPostReactions(postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const reactions = await this.prisma.reaction.findMany({
      where: { postId },
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

  async searchPosts(query: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [posts, totalCount] = await Promise.all([
      this.prisma.post.findMany({
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
          postMedia: true,
          _count: {
            select: {
              reactions: true,
              comments: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.post.count({
        where: {
          content: {
            contains: query,
            mode: 'insensitive',
          },
        },
      }),
    ]);

    return {
      posts,
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

  async addComment(postId: string, userId: string, content: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const comment = await this.prisma.comment.create({
      data: {
        content,
        authorId: userId,
        postId: postId,
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
        reactions: {
          include: {
            reactor: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
    });

    return comment;
  }

  async getPostComments(postId: string, page: number = 1, limit: number = 10) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const skip = (page - 1) * limit;

    const [comments, totalCount] = await Promise.all([
      this.prisma.comment.findMany({
        where: { postId },
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
          reactions: {
            include: {
              reactor: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
      this.prisma.comment.count({
        where: { postId },
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

  // Get posts statistics
  async getPostStats(userId?: string) {
    const whereClause = userId ? { authorId: userId } : {};

    const [totalPosts, totalReactions, totalComments] = await Promise.all([
      this.prisma.post.count({ where: whereClause }),
      this.prisma.reaction.count({ 
        where: { post: whereClause } 
      }),
      this.prisma.comment.count({ 
        where: { post: whereClause } 
      }),
    ]);

    return {
      totalPosts,
      totalReactions,
      totalComments,
    };
  }
}