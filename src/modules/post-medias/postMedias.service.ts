import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreatePostMediaDto } from './dto/createPostMedia.dto';
import { UpdatePostMediaDto } from './dto/updatePostMedia.dto';

@Injectable()
export class PostMediasService {
  constructor(private prisma: PrismaService) {}

  async create(createPostMediaDto: CreatePostMediaDto) {
    const { postId, mediaUrl, mediaType } = createPostMediaDto;

    // Check if post exists
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const postMedia = await this.prisma.postMedia.create({
      data: {
        mediaUrl,
        mediaType,
        postId,
      },
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
      },
    });

    return postMedia;
  }

  async findAll() {
    return await this.prisma.postMedia.findMany({
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
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const postMedia = await this.prisma.postMedia.findUnique({
      where: { id },
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
      },
    });

    if (!postMedia) {
      throw new NotFoundException('Post media not found');
    }

    return postMedia;
  }

  async findByPost(postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return await this.prisma.postMedia.findMany({
      where: { postId },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async update(id: string, updatePostMediaDto: UpdatePostMediaDto) {
    const existingMedia = await this.prisma.postMedia.findUnique({
      where: { id },
    });

    if (!existingMedia) {
      throw new NotFoundException('Post media not found');
    }

    const updatedMedia = await this.prisma.postMedia.update({
      where: { id },
      data: updatePostMediaDto,
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
      },
    });

    return updatedMedia;
  }

  async remove(id: string) {
    const existingMedia = await this.prisma.postMedia.findUnique({
      where: { id },
    });

    if (!existingMedia) {
      throw new NotFoundException('Post media not found');
    }

    await this.prisma.postMedia.delete({
      where: { id },
    });

    return { message: 'Post media deleted successfully' };
  }

  async removeByPost(postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const deleteResult = await this.prisma.postMedia.deleteMany({
      where: { postId },
    });

    return {
      message: 'Post media deleted successfully',
      deletedCount: deleteResult.count,
    };
  }
}
