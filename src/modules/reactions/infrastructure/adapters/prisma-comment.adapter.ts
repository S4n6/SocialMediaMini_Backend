import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { IExternalCommentService } from '../../application/ports/i-external-services';

@Injectable()
export class PrismaCommentAdapter implements IExternalCommentService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(
    commentId: string,
  ): Promise<{ id: string; authorId: string; content: string } | null> {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, authorId: true, content: true },
    });

    return comment ? { ...comment, content: comment.content || '' } : null;
  }
}
