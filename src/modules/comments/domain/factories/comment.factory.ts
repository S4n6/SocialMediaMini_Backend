import { CommentEntity, CommentProps, ReactionType } from '../comment.entity';
import {
  InvalidCommentException,
  CommentContentException,
} from '../comment.exceptions';

export interface CreateCommentParams {
  content: string;
  authorId: string;
  postId: string;
  parentId?: string;
}

export interface CommentFromPersistenceParams extends CommentProps {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export class CommentFactory {
  /**
   * Create a new comment entity
   */
  static create(params: CreateCommentParams): CommentEntity {
    // Validate required fields
    if (!params.content?.trim()) {
      throw new CommentContentException('Comment content is required');
    }

    if (!params.authorId?.trim()) {
      throw new InvalidCommentException('Author ID is required');
    }

    if (!params.postId?.trim()) {
      throw new InvalidCommentException('Post ID is required');
    }

    return CommentEntity.create({
      content: params.content.trim(),
      authorId: params.authorId.trim(),
      postId: params.postId.trim(),
      parentId: params.parentId?.trim(),
    });
  }

  /**
   * Create a reply comment
   */
  static createReply(
    params: CreateCommentParams & { parentId: string },
    maxDepth: number = 3,
  ): CommentEntity {
    if (!params.parentId?.trim()) {
      throw new InvalidCommentException('Parent ID is required for reply');
    }

    return CommentEntity.createReply(
      {
        content: params.content.trim(),
        authorId: params.authorId.trim(),
        postId: params.postId.trim(),
        parentId: params.parentId.trim(),
      },
      maxDepth,
    );
  }

  /**
   * Reconstruct entity from database data
   */
  static fromPersistence(data: CommentFromPersistenceParams): CommentEntity {
    return CommentEntity.fromPersistence({
      id: data.id,
      content: data.content,
      authorId: data.authorId,
      postId: data.postId,
      parentId: data.parentId,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  /**
   * Create entities from array of persistence data
   */
  static fromPersistenceArray(
    dataArray: CommentFromPersistenceParams[],
  ): CommentEntity[] {
    return dataArray.map((data) => this.fromPersistence(data));
  }

  /**
   * Validate reaction type
   */
  static validateReactionType(reactionType: string): ReactionType {
    const validTypes = Object.values(ReactionType);

    if (!validTypes.includes(reactionType as ReactionType)) {
      throw new InvalidCommentException(
        `Invalid reaction type: ${reactionType}`,
      );
    }

    return reactionType as ReactionType;
  }

  /**
   * Validate comment content according to business rules
   */
  static validateContent(content: string): void {
    if (!content || typeof content !== 'string') {
      throw new CommentContentException('Comment content must be a string');
    }

    const trimmed = content.trim();

    if (trimmed.length === 0) {
      throw new CommentContentException('Comment content cannot be empty');
    }

    if (trimmed.length < 1) {
      throw new CommentContentException('Comment content is too short');
    }

    if (trimmed.length > 1000) {
      throw new CommentContentException(
        'Comment content is too long (max 1000 characters)',
      );
    }

    // Check for potentially harmful content patterns
    const forbiddenPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    ];

    for (const pattern of forbiddenPatterns) {
      if (pattern.test(content)) {
        throw new CommentContentException('Comment contains forbidden content');
      }
    }
  }

  /**
   * Update an existing comment
   */
  static updateComment(
    existingComment: CommentEntity,
    updateParams: { content?: string },
  ): CommentEntity {
    const content = updateParams.content ?? existingComment.content;

    // Validate the new content if provided
    if (updateParams.content !== undefined) {
      this.validateContent(content);
    }

    return CommentEntity.update(existingComment, {
      content: this.sanitizeContent(content),
    });
  }

  /**
   * Sanitize comment content
   */
  static sanitizeContent(content: string): string {
    if (!content || typeof content !== 'string') {
      return '';
    }

    return content
      .trim()
      .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
      .substring(0, 1000); // Ensure max length
  }
}
