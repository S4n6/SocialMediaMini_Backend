import { DomainEvent } from '../../../shared/domain/domain-event.base';

interface CommentEventData {
  id: string;
  content: string;
  authorId: string;
  postId: string;
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class CommentCreatedEvent extends DomainEvent {
  constructor(public readonly comment: CommentEventData) {
    super();
  }

  get eventType(): string {
    return 'CommentCreated';
  }

  protected getEventData(): Record<string, any> {
    return {
      commentId: this.comment.id,
      content: this.comment.content,
      authorId: this.comment.authorId,
      postId: this.comment.postId,
      parentId: this.comment.parentId,
      isReply: !!this.comment.parentId,
    };
  }
}

export class CommentUpdatedEvent extends DomainEvent {
  constructor(
    public readonly comment: CommentEventData,
    public readonly changes: Record<string, any>,
  ) {
    super();
  }

  get eventType(): string {
    return 'CommentUpdated';
  }

  protected getEventData(): Record<string, any> {
    return {
      commentId: this.comment.id,
      authorId: this.comment.authorId,
      postId: this.comment.postId,
      changes: this.changes,
    };
  }
}

export class CommentDeletedEvent extends DomainEvent {
  constructor(public readonly comment: CommentEventData) {
    super();
  }

  get eventType(): string {
    return 'CommentDeleted';
  }

  protected getEventData(): Record<string, any> {
    return {
      commentId: this.comment.id,
      authorId: this.comment.authorId,
      postId: this.comment.postId,
      parentId: this.comment.parentId,
      hadReplies: false, // This should be calculated by domain service
    };
  }
}

export class CommentReactionAddedEvent extends DomainEvent {
  constructor(
    public readonly commentId: string,
    public readonly userId: string,
    public readonly reactionType: string,
  ) {
    super();
  }

  get eventType(): string {
    return 'CommentReactionAdded';
  }

  protected getEventData(): Record<string, any> {
    return {
      commentId: this.commentId,
      userId: this.userId,
      reactionType: this.reactionType,
    };
  }
}

export class CommentReactionRemovedEvent extends DomainEvent {
  constructor(
    public readonly commentId: string,
    public readonly userId: string,
    public readonly reactionType: string,
  ) {
    super();
  }

  get eventType(): string {
    return 'CommentReactionRemoved';
  }

  protected getEventData(): Record<string, any> {
    return {
      commentId: this.commentId,
      userId: this.userId,
      reactionType: this.reactionType,
    };
  }
}
