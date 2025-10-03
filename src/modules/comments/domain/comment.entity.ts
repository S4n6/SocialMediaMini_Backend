import { Entity } from '../../../shared/domain/entity.base';
import { randomUUID } from 'crypto';
import {
  CommentCreatedEvent,
  CommentUpdatedEvent,
  CommentDeletedEvent,
  CommentReactionAddedEvent,
  CommentReactionRemovedEvent,
} from './comment.events';
import {
  InvalidCommentException,
  CommentContentException,
  CommentDepthLimitException,
} from './comment.exceptions';

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
}

export class CommentEntity extends Entity<string> {
  private _content: string;
  private _authorId: string;
  private _postId: string;
  private _parentId?: string;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _isDeleted: boolean = false;

  constructor(props: CommentProps) {
    super(props.id || randomUUID());
    this._content = props.content;
    this._authorId = props.authorId;
    this._postId = props.postId;
    this._parentId = props.parentId;
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();

    this.validate();
    this.addDomainEvent(
      new CommentCreatedEvent({
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

  // Static factory methods
  public static create(
    props: Omit<CommentProps, 'id' | 'createdAt' | 'updatedAt'>,
  ): CommentEntity {
    return new CommentEntity(props);
  }

  public static createReply(
    props: Omit<CommentProps, 'id' | 'createdAt' | 'updatedAt'>,
    maxDepth: number = 3,
  ): CommentEntity {
    if (!props.parentId) {
      throw new InvalidCommentException('Reply must have a parent comment');
    }

    // Note: Depth validation should be done by domain service with repository access
    return new CommentEntity(props);
  }

  public static update(
    existingComment: CommentEntity,
    updateProps: { content?: string },
  ): CommentEntity {
    const updatedEntity = new CommentEntity({
      id: existingComment.id,
      content: updateProps.content ?? existingComment.content,
      authorId: existingComment.authorId,
      postId: existingComment.postId,
      parentId: existingComment.parentId,
      createdAt: existingComment.createdAt,
      updatedAt: new Date(),
    });

    updatedEntity.addDomainEvent(
      new CommentUpdatedEvent(
        {
          id: updatedEntity.id,
          content: updatedEntity.content,
          authorId: updatedEntity.authorId,
          postId: updatedEntity.postId,
          parentId: updatedEntity.parentId,
          createdAt: updatedEntity.createdAt,
          updatedAt: updatedEntity.updatedAt,
        },
        { content: updateProps.content },
      ),
    );

    return updatedEntity;
  }

  public static fromPersistence(props: CommentProps): CommentEntity {
    const entity = Object.create(CommentEntity.prototype);
    Entity.call(entity, props.id);
    entity._content = props.content;
    entity._authorId = props.authorId;
    entity._postId = props.postId;
    entity._parentId = props.parentId;
    entity._createdAt = props.createdAt;
    entity._updatedAt = props.updatedAt;
    entity._isDeleted = false;
    return entity;
  }

  public toPlainObject(): CommentProps {
    return {
      id: this.id,
      content: this._content,
      authorId: this._authorId,
      postId: this._postId,
      parentId: this._parentId,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
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

    if (content.trim().length < 1) {
      throw new CommentContentException('Comment content is too short');
    }

    if (content.trim().length > 1000) {
      throw new CommentContentException(
        'Comment content is too long (max 1000 characters)',
      );
    }

    // Additional content validation rules can be added here
    const trimmedContent = content.trim();
    if (trimmedContent !== content) {
      // This is just a validation, the actual trimming is done in business methods
    }
  }
}
