import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { IExternalPostService } from '../../application/ports/i-external-services';

@Injectable()
export class PrismaPostAdapter implements IExternalPostService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(
    postId: string,
  ): Promise<{ id: string; authorId: string; content: string } | null> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true, content: true },
    });

    return post ? { ...post, content: post.content || '' } : null;
  }
}
