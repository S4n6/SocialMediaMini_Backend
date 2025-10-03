import { DomainEvent } from '../../../shared/domain/domain-event.base';

interface PostMediaEventData {
  id: string;
  postId: string;
  url: string;
  type: string;
  order: number;
}

export class PostMediaCreatedEvent extends DomainEvent {
  constructor(public readonly postMedia: PostMediaEventData) {
    super();
  }

  get eventType(): string {
    return 'PostMediaCreated';
  }

  protected getEventData(): Record<string, any> {
    return {
      postMediaId: this.postMedia.id,
      postId: this.postMedia.postId,
      url: this.postMedia.url,
      type: this.postMedia.type,
      order: this.postMedia.order,
    };
  }
}

export class PostMediaUpdatedEvent extends DomainEvent {
  constructor(
    public readonly postMedia: PostMediaEventData,
    public readonly changes: Record<string, any>,
  ) {
    super();
  }

  get eventType(): string {
    return 'PostMediaUpdated';
  }

  protected getEventData(): Record<string, any> {
    return {
      postMediaId: this.postMedia.id,
      postId: this.postMedia.postId,
      changes: this.changes,
    };
  }
}

export class PostMediaDeletedEvent extends DomainEvent {
  constructor(public readonly postMedia: PostMediaEventData) {
    super();
  }

  get eventType(): string {
    return 'PostMediaDeleted';
  }

  protected getEventData(): Record<string, any> {
    return {
      postMediaId: this.postMedia.id,
      postId: this.postMedia.postId,
      url: this.postMedia.url,
      type: this.postMedia.type,
    };
  }
}

export class PostMediaUploadedEvent extends DomainEvent {
  constructor(
    public readonly postId: string,
    public readonly mediaFiles: Array<{
      url: string;
      type: string;
      order: number;
    }>,
    public readonly userId: string,
  ) {
    super();
  }

  get eventType(): string {
    return 'PostMediaUploaded';
  }

  protected getEventData(): Record<string, any> {
    return {
      postId: this.postId,
      mediaFiles: this.mediaFiles,
      userId: this.userId,
      mediaCount: this.mediaFiles.length,
    };
  }
}
