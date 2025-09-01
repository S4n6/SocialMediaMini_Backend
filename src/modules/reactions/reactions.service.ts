import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateReactionDto } from './dto/createReaction.dto';

@Injectable()
export class ReactionsService {
  constructor(private prisma: PrismaService) {}

  async create(createReactionDto: CreateReactionDto, userId: string) {
    const { postId, commentId, type } = createReactionDto;

    if (!postId && !commentId) {
      throw new BadRequestException('Either postId or commentId is required');
    }

    // validate target exists
    if (postId) {
      const post = await this.prisma.post.findUnique({ where: { id: postId } });
      if (!post) throw new NotFoundException('Post not found');
    }
    if (commentId) {
      const comment = await this.prisma.comment.findUnique({
        where: { id: commentId },
      });
      if (!comment) throw new NotFoundException('Comment not found');
    }

    // check existing reaction by this user on the same target
    const existing = await this.prisma.reaction.findFirst({
      where: { reactorId: userId, postId, commentId },
    });

    if (existing) {
      // update type
      const updated = await this.prisma.reaction.update({
        where: { id: existing.id },
        data: { type },
        include: {
          reactor: { select: { id: true, fullName: true, avatar: true } },
        },
      });
      return { message: 'Reaction updated', reacted: true, reaction: updated };
    }

    const created = await this.prisma.reaction.create({
      data: { type: type || 'LIKE', reactorId: userId, postId, commentId },
      include: {
        reactor: { select: { id: true, fullName: true, avatar: true } },
        post: { select: { id: true, content: true, authorId: true } },
      },
    });

    return { message: 'Reaction created', reacted: true, reaction: created };
  }

  async findAll() {
    return this.prisma.reaction.findMany({
      include: {
        reactor: { select: { id: true, fullName: true, avatar: true } },
        post: { select: { id: true, content: true, authorId: true } },
        comment: { select: { id: true, content: true } },
      },
    });
  }

  async findOne(id: string) {
    const reaction = await this.prisma.reaction.findUnique({
      where: { id },
      include: {
        reactor: { select: { id: true, fullName: true, avatar: true } },
        post: { select: { id: true, content: true, authorId: true } },
        comment: { select: { id: true, content: true } },
      },
    });

    if (!reaction) throw new NotFoundException('Reaction not found');
    return reaction;
  }

  async remove(id: string, userId: string) {
    const reaction = await this.prisma.reaction.findUnique({ where: { id } });
    if (!reaction) throw new NotFoundException('Reaction not found');
    if (reaction.reactorId !== userId)
      throw new ForbiddenException('You can only remove your own reactions');

    await this.prisma.reaction.delete({ where: { id } });
    return { message: 'Reaction removed successfully' };
  }

  // Get likes for a specific post
  async getPostLikes(postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    const reactions = await this.prisma.reaction.findMany({
      where: { postId },
      include: {
        reactor: { select: { id: true, fullName: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { postId, totalReactions: reactions.length, reactions };
  }

  // Check if user liked a post
  async checkUserLiked(postId: string, userId: string) {
    const reaction = await this.prisma.reaction.findFirst({
      where: { postId, reactorId: userId },
    });
    return {
      postId,
      userId,
      reacted: !!reaction,
      reactionId: reaction?.id || null,
    };
  }
}
