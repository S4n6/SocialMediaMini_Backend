import { DomainEvent } from '../../../shared/domain/domain-event.base';
import { PostPrivacy, ReactionType } from './post.entity';

export class PostCreatedEvent extends DomainEvent {
  constructor(
    public readonly postId: string,
    public readonly authorId: string,
    public readonly content?: string,
    public readonly privacy: PostPrivacy = PostPrivacy.PUBLIC,
  ) {
    super();
  }

  get eventType(): string {
    return 'PostCreated';
  }

  protected getEventData(): Record<string, any> {
    return {
      postId: this.postId,
      authorId: this.authorId,
      content: this.content,
      privacy: this.privacy,
    };
  }
}

export class PostUpdatedEvent extends DomainEvent {
  constructor(
    public readonly postId: string,
    public readonly authorId: string,
    public readonly oldContent?: string,
    public readonly newContent?: string,
  ) {
    super();
  }

  get eventType(): string {
    return 'PostUpdated';
  }

  protected getEventData(): Record<string, any> {
    return {
      postId: this.postId,
      authorId: this.authorId,
      oldContent: this.oldContent,
      newContent: this.newContent,
    };
  }
}

export class PostDeletedEvent extends DomainEvent {
  constructor(
    public readonly postId: string,
    public readonly authorId: string,
  ) {
    super();
  }

  get eventType(): string {
    return 'PostDeleted';
  }

  protected getEventData(): Record<string, any> {
    return {
      postId: this.postId,
      authorId: this.authorId,
    };
  }
}

export class PostLikedEvent extends DomainEvent {
  constructor(
    public readonly postId: string,
    public readonly userId: string,
    public readonly reactionType: ReactionType,
  ) {
    super();
  }

  get eventType(): string {
    return 'PostLiked';
  }

  protected getEventData(): Record<string, any> {
    return {
      postId: this.postId,
      userId: this.userId,
      reactionType: this.reactionType,
    };
  }
}

export class PostUnlikedEvent extends DomainEvent {
  constructor(
    public readonly postId: string,
    public readonly userId: string,
    public readonly reactionType: ReactionType,
  ) {
    super();
  }

  get eventType(): string {
    return 'PostUnliked';
  }

  protected getEventData(): Record<string, any> {
    return {
      postId: this.postId,
      userId: this.userId,
      reactionType: this.reactionType,
    };
  }
}

export class PostCommentedEvent extends DomainEvent {
  constructor(
    public readonly postId: string,
    public readonly commentId: string,
    public readonly authorId: string,
    public readonly content: string,
  ) {
    super();
  }

  get eventType(): string {
    return 'PostCommented';
  }

  protected getEventData(): Record<string, any> {
    return {
      postId: this.postId,
      commentId: this.commentId,
      authorId: this.authorId,
      content: this.content,
    };
  }
}

export class PostPrivacyChangedEvent extends DomainEvent {
  constructor(
    public readonly postId: string,
    public readonly authorId: string,
    public readonly oldPrivacy: PostPrivacy,
    public readonly newPrivacy: PostPrivacy,
  ) {
    super();
  }

  get eventType(): string {
    return 'PostPrivacyChanged';
  }

  protected getEventData(): Record<string, any> {
    return {
      postId: this.postId,
      authorId: this.authorId,
      oldPrivacy: this.oldPrivacy,
      newPrivacy: this.newPrivacy,
    };
  }
}

export class PostMediaAddedEvent extends DomainEvent {
  constructor(
    public readonly postId: string,
    public readonly authorId: string,
    public readonly mediaId: string,
    public readonly mediaUrl: string,
    public readonly mediaType: 'image' | 'video',
  ) {
    super();
  }

  get eventType(): string {
    return 'PostMediaAdded';
  }

  protected getEventData(): Record<string, any> {
    return {
      postId: this.postId,
      authorId: this.authorId,
      mediaId: this.mediaId,
      mediaUrl: this.mediaUrl,
      mediaType: this.mediaType,
    };
  }
}

export class PostMediaRemovedEvent extends DomainEvent {
  constructor(
    public readonly postId: string,
    public readonly authorId: string,
    public readonly mediaId: string,
  ) {
    super();
  }

  get eventType(): string {
    return 'PostMediaRemoved';
  }

  protected getEventData(): Record<string, any> {
    return {
      postId: this.postId,
      authorId: this.authorId,
      mediaId: this.mediaId,
    };
  }
}
