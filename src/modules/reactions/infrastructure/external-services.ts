import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import {
  ExternalPostService,
  ExternalCommentService,
} from '../application/interfaces/external-services.interface';

@Injectable()
export class PrismaPostService implements ExternalPostService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(
    postId: string,
  ): Promise<{ id: string; authorId: string; content: string } | null> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        authorId: true,
        content: true,
      },
    });

    return post
      ? {
          ...post,
          content: post.content || '',
        }
      : null;
  }
}

@Injectable()
export class PrismaCommentService implements ExternalCommentService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(
    commentId: string,
  ): Promise<{ id: string; authorId: string; content: string } | null> {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      select: {
        id: true,
        authorId: true,
        content: true,
      },
    });

    return comment
      ? {
          ...comment,
          content: comment.content || '',
        }
      : null;
  }
}
