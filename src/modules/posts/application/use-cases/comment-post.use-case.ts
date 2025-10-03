import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PostDomainService } from '../../domain/services/post-domain.service';
import { IPostRepository } from '../interfaces/post-repository.interface';
import {
  CreateCommentDto,
  UpdateCommentDto,
  PostCommentResponseDto,
} from '../dto/post.dto';
import { POST_REPOSITORY_TOKEN } from './create-post.use-case';

/**
 * Use case for adding comment to a post
 */
@Injectable()
export class AddCommentUseCase {
  constructor(
    private readonly postDomainService: PostDomainService,
    @Inject(POST_REPOSITORY_TOKEN)
    private readonly postRepository: IPostRepository,
  ) {}

  async execute(
    postId: string,
    authorId: string,
    dto: CreateCommentDto,
  ): Promise<PostCommentResponseDto> {
    // Find post
    const post = await this.postRepository.findById(postId);
    if (!post) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    // Check if user can view this post (required to comment)
    if (!this.postDomainService.canViewPost(post, authorId)) {
      throw new ForbiddenException(
        'You are not authorized to comment on this post',
      );
    }

    // Validate parent comment if provided
    if (dto.parentId) {
      const parentComment = post.comments.find((c) => c.id === dto.parentId);
      if (!parentComment) {
        throw new NotFoundException(
          `Parent comment with ID ${dto.parentId} not found`,
        );
      }
    }

    // Add comment to post
    const commentId = randomUUID();
    post.addComment(commentId, dto.content, authorId, dto.parentId);

    // Save updated post
    const updatedPost = await this.postRepository.save(post);

    // Find and return the created comment
    const createdComment = updatedPost.comments.find((c) => c.id === commentId);
    if (!createdComment) {
      throw new Error('Failed to create comment');
    }

    return {
      id: createdComment.id,
      content: createdComment.content,
      authorId: createdComment.authorId,
      authorFullName: '', // Will be populated by application service
      authorAvatar: undefined,
      parentId: createdComment.parentId,
      repliesCount: 0, // Will be calculated by application service
      likesCount: 0, // Will be calculated by application service
      createdAt: createdComment.createdAt,
      updatedAt: createdComment.updatedAt,
    };
  }
}

/**
 * Use case for updating a comment
 */
@Injectable()
export class UpdateCommentUseCase {
  constructor(
    private readonly postDomainService: PostDomainService,
    @Inject(POST_REPOSITORY_TOKEN)
    private readonly postRepository: IPostRepository,
  ) {}

  async execute(
    postId: string,
    commentId: string,
    userId: string,
    dto: UpdateCommentDto,
  ): Promise<PostCommentResponseDto> {
    // Find post
    const post = await this.postRepository.findById(postId);
    if (!post) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    // Find comment
    const comment = post.comments.find((c) => c.id === commentId);
    if (!comment) {
      throw new NotFoundException(`Comment with ID ${commentId} not found`);
    }

    // Check if user can edit this comment
    if (comment.authorId !== userId) {
      throw new ForbiddenException(
        'You are not authorized to edit this comment',
      );
    }

    // Update comment
    post.updateComment(commentId, dto.content);

    // Save updated post
    const updatedPost = await this.postRepository.save(post);

    // Find and return the updated comment
    const updatedComment = updatedPost.comments.find((c) => c.id === commentId);
    if (!updatedComment) {
      throw new Error('Failed to update comment');
    }

    return {
      id: updatedComment.id,
      content: updatedComment.content,
      authorId: updatedComment.authorId,
      authorFullName: '', // Will be populated by application service
      authorAvatar: undefined,
      parentId: updatedComment.parentId,
      repliesCount: 0, // Will be calculated by application service
      likesCount: 0, // Will be calculated by application service
      createdAt: updatedComment.createdAt,
      updatedAt: updatedComment.updatedAt,
    };
  }
}

/**
 * Use case for deleting a comment
 */
@Injectable()
export class DeleteCommentUseCase {
  constructor(
    private readonly postDomainService: PostDomainService,
    @Inject(POST_REPOSITORY_TOKEN)
    private readonly postRepository: IPostRepository,
  ) {}

  async execute(
    postId: string,
    commentId: string,
    userId: string,
    userRole?: string,
  ): Promise<void> {
    // Find post
    const post = await this.postRepository.findById(postId);
    if (!post) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    // Find comment
    const comment = post.comments.find((c) => c.id === commentId);
    if (!comment) {
      throw new NotFoundException(`Comment with ID ${commentId} not found`);
    }

    // Check if user can delete this comment
    const canDelete =
      comment.authorId === userId ||
      post.authorId === userId || // Post author can delete comments on their post
      userRole === 'ADMIN' ||
      userRole === 'MODERATOR';

    if (!canDelete) {
      throw new ForbiddenException(
        'You are not authorized to delete this comment',
      );
    }

    // Remove comment
    post.removeComment(commentId);

    // Save updated post
    await this.postRepository.save(post);
  }
}
