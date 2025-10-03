import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { PostService } from '../domain/services/post-media-domain.service';

@Injectable()
export class PostServiceAdapter implements PostService {
  constructor(private readonly prisma: PrismaService) {}

  async exists(postId: string): Promise<boolean> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });

    return post !== null;
  }

  async belongsToUser(postId: string, userId: string): Promise<boolean> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    return post?.authorId === userId;
  }
}
