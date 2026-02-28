import { Entity } from '../../../../shared/domain/entity.base';
import { randomUUID } from 'crypto';
import {
  CommentCreatedEvent,
  CommentUpdatedEvent,
  CommentDeletedEvent,
  CommentReactionAddedEvent,
  CommentReactionRemovedEvent,
} from '../events/comment.events';
import {
  InvalidCommentException,
  CommentContentException,
} from '../exceptions/comment.exceptions';

export enum ReactionType {
  LIKE = 'like',
  LOVE = 'love',
  LAUGH = 'laugh',
  ANGRY = 'angry',
  SAD = 'sad',
}

export interface CommentProps {
  id?: string;
  content: string;
  authorId: string;
  postId: string;
  parentId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  isDeleted?: boolean;
}

export class CommentEntity extends Entity<string> {
  private _content: string;
  private _authorId: string;
  private _postId: string;
  private _parentId?: string;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _isDeleted: boolean;

  /**
   * Private constructor — use `create()`, `createReply()`, or `reconstitute()`.
   * Does NOT emit domain events.
   */
  private constructor(props: CommentProps) {
    super(props.id || randomUUID());
    this._content = props.content;
    this._authorId = props.authorId;
    this._postId = props.postId;
    this._parentId = props.parentId;
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();
    this._isDeleted = props.isDeleted || false;

    this.validate();
  }

  // Getters
  get content(): string {
    return this._content;
  }

  get authorId(): string {
    return this._authorId;
  }

  get postId(): string {
    return this._postId;
  }

  get parentId(): string | undefined {
    return this._parentId;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get isDeleted(): boolean {
    return this._isDeleted;
  }

  get isReply(): boolean {
    return !!this._parentId;
  }

  // Business methods
  public updateContent(newContent: string, userId: string): void {
    if (this._authorId !== userId) {
      throw new InvalidCommentException(
        'Only comment author can update content',
      );
    }

    if (this._isDeleted) {
      throw new InvalidCommentException('Cannot update deleted comment');
    }

    this.validateContent(newContent);

    const oldContent = this._content;
    this._content = newContent.trim();
    this._updatedAt = new Date();

    this.addDomainEvent(
      new CommentUpdatedEvent(
        {
          id: this.id,
          content: this._content,
          authorId: this._authorId,
          postId: this._postId,
          parentId: this._parentId,
          createdAt: this._createdAt,
          updatedAt: this._updatedAt,
        },
        { oldContent, newContent: this._content },
      ),
    );
  }

  public delete(userId: string, isAuthorOrAdmin: boolean = false): void {
    if (!isAuthorOrAdmin && this._authorId !== userId) {
      throw new InvalidCommentException(
        'Only comment author or admin can delete comment',
      );
    }

    if (this._isDeleted) {
      throw new InvalidCommentException('Comment is already deleted');
    }

    this._isDeleted = true;
    this._updatedAt = new Date();

    this.addDomainEvent(
      new CommentDeletedEvent({
        id: this.id,
        content: this._content,
        authorId: this._authorId,
        postId: this._postId,
        parentId: this._parentId,
        createdAt: this._createdAt,
        updatedAt: this._updatedAt,
      }),
    );
  }

  public addReaction(userId: string, reactionType: ReactionType): void {
    if (this._isDeleted) {
      throw new InvalidCommentException(
        'Cannot add reaction to deleted comment',
      );
    }

    this.addDomainEvent(
      new CommentReactionAddedEvent(this.id, userId, reactionType),
    );
  }

  public removeReaction(userId: string, reactionType: ReactionType): void {
    this.addDomainEvent(
      new CommentReactionRemovedEvent(this.id, userId, reactionType),
    );
  }

  // ========== FACTORY METHODS ==========

  /**
   * Create a brand-new comment. Emits `CommentCreatedEvent`.
   */
  public static create(
    props: Omit<CommentProps, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>,
  ): CommentEntity {
    const entity = new CommentEntity(props);

    entity.addDomainEvent(
      new CommentCreatedEvent({
        id: entity.id,
        content: entity._content,
        authorId: entity._authorId,
        postId: entity._postId,
        parentId: entity._parentId,
        createdAt: entity._createdAt,
        updatedAt: entity._updatedAt,
      }),
    );

    return entity;
  }

  /**
   * Create a reply comment. Emits `CommentCreatedEvent`.
   * Depth validation is handled by the domain service.
   */
  public static createReply(
    props: Omit<CommentProps, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>,
  ): CommentEntity {
    if (!props.parentId) {
      throw new InvalidCommentException('Reply must have a parent comment');
    }

    return CommentEntity.create(props);
  }

  /**
   * Reconstitute an entity from persistence data.
   * Does NOT emit domain events — used only by infrastructure mappers.
   */
  public static reconstitute(
    props: Required<
      Pick<
        CommentProps,
        'id' | 'content' | 'authorId' | 'postId' | 'createdAt' | 'updatedAt'
      >
    > &
      Pick<CommentProps, 'parentId' | 'isDeleted'>,
  ): CommentEntity {
    return new CommentEntity(props);
  }

  private validate(): void {
    if (!this._authorId || this._authorId.trim() === '') {
      throw new InvalidCommentException('Author ID is required');
    }

    if (!this._postId || this._postId.trim() === '') {
      throw new InvalidCommentException('Post ID is required');
    }

    this.validateContent(this._content);
  }

  private validateContent(content: string): void {
    if (!content || content.trim() === '') {
      throw new CommentContentException('Comment content cannot be empty');
    }

    if (content.trim().length > 1000) {
      throw new CommentContentException(
        'Comment content is too long (max 1000 characters)',
      );
    }
  }
}
