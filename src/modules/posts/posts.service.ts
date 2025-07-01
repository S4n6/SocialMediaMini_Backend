import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreatePostDto, UpdatePostDto, PostResponse } from './posts.interfaces';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async create(
    createPostDto: CreatePostDto,
    authorId: string,
  ): Promise<PostResponse> {
    const { content, mediaUrls } = createPostDto;

    if (!content && !Array.isArray(mediaUrls)) {
      throw new BadRequestException('Post must have content or media');
    }

    const post = await this.prisma.post.create({
      data: {
        content,
        authorId,
        postMedia: mediaUrls
          ? {
              create: mediaUrls.map((media) => ({
                mediaUrl: media.url,
                mediaType: media.type,
              })),
            }
          : undefined,
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
                profilePicture: true,
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
          orderBy: { createdAt: 'desc' },
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

  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    posts: PostResponse[];
    total: number;
    hasNext: boolean;
  }> {
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
                  profilePicture: true,
                },
              },
            },
          },
          comments: {
            take: 5, // Only show first 5 comments
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
            orderBy: { createdAt: 'desc' },
          },
          _count: {
            select: {
              reactions: true,
              comments: true,
            },
          },
        },
      }),
      this.prisma.post.count(),
    ]);

    return {
      posts,
      total,
      hasNext: skip + limit < total,
    };
  }

  async findOne(id: string): Promise<PostResponse> {
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
                profilePicture: true,
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
          orderBy: { createdAt: 'desc' },
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

  async findByUser(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    posts: PostResponse[];
    total: number;
    hasNext: boolean;
  }> {
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: { authorId: userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
                  profilePicture: true,
                },
              },
            },
          },
          comments: {
            take: 5,
            include: {
              author: {
                select: {
                  id: true,
                  username: true,
                  fullname: true,
                  profilePicture: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
          _count: {
            select: {
              reactions: true,
              comments: true,
            },
          },
        },
      }),
      this.prisma.post.count({ where: { authorId: userId } }),
    ]);

    return {
      posts,
      total,
      hasNext: skip + limit < total,
    };
  }

  async update(
    id: string,
    updatePostDto: UpdatePostDto,
    userId: string,
  ): Promise<PostResponse> {
    const existingPost = await this.prisma.post.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!existingPost) {
      throw new NotFoundException('Post not found');
    }

    if (existingPost.authorId !== userId) {
      throw new ForbiddenException('You can only update your own posts');
    }

    const { content, mediaUrls } = updatePostDto;

    const post = await this.prisma.post.update({
      where: { id },
      data: {
        content,
        postMedia: mediaUrls
          ? {
              deleteMany: {},
              create: mediaUrls.map((media) => ({
                mediaUrl: media.url,
                mediaType: media.type,
              })),
            }
          : undefined,
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
                profilePicture: true,
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
                profilePicture: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
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

  async remove(id: string, userId: string): Promise<{ message: string }> {
    const existingPost = await this.prisma.post.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!existingPost) {
      throw new NotFoundException('Post not found');
    }

    if (existingPost.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    await this.prisma.post.delete({
      where: { id },
    });

    return { message: 'Post deleted successfully' };
  }

  async addReaction(
    postId: string,
    userId: string,
    reactionType: string,
  ): Promise<{ message: string }> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const existingReaction = await this.prisma.reaction.findUnique({
      where: {
        reactorId_postId: {
          reactorId: userId,
          postId: postId,
        },
      },
    });

    if (existingReaction) {
      if (existingReaction.reactionType === reactionType) {
        // Remove reaction if same type
        await this.prisma.reaction.delete({
          where: { id: existingReaction.id },
        });
        return { message: 'Reaction removed' };
      } else {
        // Update reaction type
        await this.prisma.reaction.update({
          where: { id: existingReaction.id },
          data: { reactionType },
        });
        return { message: 'Reaction updated' };
      }
    }

    // Create new reaction
    await this.prisma.reaction.create({
      data: {
        reactionType,
        reactorId: userId,
        postId: postId,
      },
    });

    return { message: 'Reaction added' };
  }

  async removeReaction(
    postId: string,
    userId: string,
  ): Promise<{ message: string }> {
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

    return { message: 'Reaction removed' };
  }

  async getPostReactions(postId: string): Promise<any[]> {
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
      orderBy: { createdAt: 'desc' },
    });

    return reactions;
  }

  async getFeedForUser(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    posts: PostResponse[];
    total: number;
    hasNext: boolean;
  }> {
    const skip = (page - 1) * limit;

    // Get user's friends
    const friendConnections = await this.prisma.friend.findMany({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
      },
    });

    const friendIds = friendConnections.map((friend) =>
      friend.userAId === userId ? friend.userBId : friend.userAId,
    );

    // Include user's own posts and friends' posts
    const authorIds = [userId, ...friendIds];

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: {
          authorId: { in: authorIds },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
                  profilePicture: true,
                },
              },
            },
          },
          comments: {
            take: 3,
            include: {
              author: {
                select: {
                  id: true,
                  username: true,
                  fullname: true,
                  profilePicture: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
          _count: {
            select: {
              reactions: true,
              comments: true,
            },
          },
        },
      }),
      this.prisma.post.count({
        where: {
          authorId: { in: authorIds },
        },
      }),
    ]);

    return {
      posts,
      total,
      hasNext: skip + limit < total,
    };
  }
}
