import { Injectable, Inject } from '@nestjs/common';
import { CommentEntity, ReactionType } from '../comment.entity';
import { CommentRepository } from '../repositories/comment.repository';
import {
  CommentNotFoundException,
  InvalidParentCommentException,
  CommentDepthLimitException,
  ParentCommentMismatchException,
  CommentReactionException,
  UnauthorizedCommentActionException,
} from '../comment.exceptions';

export interface UserService {
  exists(userId: string): Promise<boolean>;
  isAdmin(userId: string): Promise<boolean>;
}

export interface PostService {
  exists(postId: string): Promise<boolean>;
}

@Injectable()
export class CommentDomainService {
  constructor(
    @Inject('COMMENT_REPOSITORY')
    private readonly commentRepository: CommentRepository,
    @Inject('USER_SERVICE')
    private readonly userService: UserService,
    @Inject('POST_SERVICE')
    private readonly postService: PostService,
  ) {}

  async createComment(
    content: string,
    authorId: string,
    postId: string,
    parentId?: string,
    maxDepth: number = 3,
  ): Promise<CommentEntity> {
    // Validate user exists
    const userExists = await this.userService.exists(authorId);
    if (!userExists) {
      throw new Error('User not found');
    }

    // Validate post exists
    const postExists = await this.postService.exists(postId);
    if (!postExists) {
      throw new Error('Post not found');
    }

    // If it's a reply, validate parent comment
    if (parentId) {
      const parentComment = await this.commentRepository.findById(parentId);
      if (!parentComment) {
        throw new InvalidParentCommentException('Parent comment not found');
      }

      // Ensure parent comment belongs to the same post
      if (parentComment.postId !== postId) {
        throw new ParentCommentMismatchException();
      }

      // Check depth limit
      const currentDepth =
        await this.commentRepository.getCommentDepth(parentId);
      if (currentDepth >= maxDepth) {
        throw new CommentDepthLimitException(maxDepth);
      }
    }

    // Create comment entity
    const comment = parentId
      ? CommentEntity.createReply(
          { content, authorId, postId, parentId },
          maxDepth,
        )
      : CommentEntity.create({ content, authorId, postId });

    // Save to repository
    return await this.commentRepository.save(comment);
  }

  async updateComment(
    commentId: string,
    newContent: string,
    userId: string,
  ): Promise<CommentEntity> {
    const comment = await this.commentRepository.findById(commentId);
    if (!comment) {
      throw new CommentNotFoundException(commentId);
    }

    // Update content (entity handles authorization)
    comment.updateContent(newContent, userId);

    // Save updated comment
    return await this.commentRepository.save(comment);
  }

  async deleteComment(commentId: string, userId: string): Promise<void> {
    const comment = await this.commentRepository.findById(commentId);
    if (!comment) {
      throw new CommentNotFoundException(commentId);
    }

    // Check if user is admin or comment author
    const isAdmin = await this.userService.isAdmin(userId);
    const isAuthorOrAdmin = isAdmin || comment.authorId === userId;

    if (!isAuthorOrAdmin) {
      throw new UnauthorizedCommentActionException('delete this comment');
    }

    // Check if comment has replies
    const replyCount =
      await this.commentRepository.countRepliesByCommentId(commentId);

    if (replyCount > 0) {
      // Soft delete to preserve thread structure
      comment.delete(userId, isAuthorOrAdmin);
      await this.commentRepository.softDelete(commentId);
    } else {
      // Hard delete if no replies
      comment.delete(userId, isAuthorOrAdmin);
      await this.commentRepository.deleteById(commentId);
    }
  }

  async addReaction(
    commentId: string,
    userId: string,
    reactionType: ReactionType,
  ): Promise<void> {
    const comment = await this.commentRepository.findById(commentId);
    if (!comment) {
      throw new CommentNotFoundException(commentId);
    }

    // Check if user already reacted with this type
    const hasReacted = await this.commentRepository.hasUserReacted(
      commentId,
      userId,
      reactionType,
    );

    if (hasReacted) {
      throw new CommentReactionException(
        `User has already reacted with ${reactionType}`,
      );
    }

    // Add reaction through entity (for domain events)
    comment.addReaction(userId, reactionType);

    // Persist reaction
    await this.commentRepository.addReaction(commentId, userId, reactionType);
  }

  async removeReaction(
    commentId: string,
    userId: string,
    reactionType: ReactionType,
  ): Promise<void> {
    const comment = await this.commentRepository.findById(commentId);
    if (!comment) {
      throw new CommentNotFoundException(commentId);
    }

    // Check if user has this reaction
    const hasReacted = await this.commentRepository.hasUserReacted(
      commentId,
      userId,
      reactionType,
    );

    if (!hasReacted) {
      throw new CommentReactionException(
        `User has not reacted with ${reactionType}`,
      );
    }

    // Remove reaction through entity (for domain events)
    comment.removeReaction(userId, reactionType);

    // Remove reaction from persistence
    await this.commentRepository.removeReaction(
      commentId,
      userId,
      reactionType,
    );
  }

  async toggleReaction(
    commentId: string,
    userId: string,
    reactionType: ReactionType,
  ): Promise<{ added: boolean }> {
    const hasReacted = await this.commentRepository.hasUserReacted(
      commentId,
      userId,
      reactionType,
    );

    if (hasReacted) {
      await this.removeReaction(commentId, userId, reactionType);
      return { added: false };
    } else {
      await this.addReaction(commentId, userId, reactionType);
      return { added: true };
    }
  }

  async getCommentWithReplies(
    commentId: string,
    replyPage: number = 1,
    replyLimit: number = 10,
  ): Promise<{
    comment: CommentEntity;
    replies: {
      items: CommentEntity[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const comment = await this.commentRepository.findById(commentId);
    if (!comment) {
      throw new CommentNotFoundException(commentId);
    }

    const replies = await this.commentRepository.findRepliesByCommentId(
      commentId,
      replyPage,
      replyLimit,
    );

    return {
      comment,
      replies,
    };
  }
}
