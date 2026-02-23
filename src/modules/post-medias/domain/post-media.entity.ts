import { Entity } from '../../../shared/domain/entity.base';
import { randomUUID } from 'crypto';

import {
  PostMediaCreatedEvent,
  PostMediaDeletedEvent,
  PostMediaUpdatedEvent,
  MediaProcessingStartedEvent,
  MediaProcessedEvent,
  MediaProcessingFailedEvent,
} from './post-media.events';
import {
  InvalidMediaOrderException,
  InvalidMediaTypeException,
  InvalidPostMediaException,
  InvalidMediaStatusTransitionException,
} from './post-media.exceptions';

export enum PostMediaType {
  IMAGE = 'image',
  VIDEO = 'video',
}

export enum PostMediaStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  READY = 'ready',
  FAILED = 'failed',
}

/**
 * Valid status transitions:
 *   PENDING    → PROCESSING
 *   PROCESSING → READY
 *   PROCESSING → FAILED
 *   FAILED     → PENDING  (retry)
 */
const VALID_STATUS_TRANSITIONS: Record<PostMediaStatus, PostMediaStatus[]> = {
  [PostMediaStatus.PENDING]: [PostMediaStatus.PROCESSING],
  [PostMediaStatus.PROCESSING]: [PostMediaStatus.READY, PostMediaStatus.FAILED],
  [PostMediaStatus.READY]: [],
  [PostMediaStatus.FAILED]: [PostMediaStatus.PENDING],
};

export interface PostMediaProps {
  id?: string;
  url: string;
  type: PostMediaType;
  postId: string;
  order: number;
  status?: PostMediaStatus;
  processedUrl?: string | null;
  thumbnailUrl?: string | null;
  s3Key?: string | null;
  errorMessage?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class PostMediaEntity extends Entity<string> {
  private _url: string;
  private _type: PostMediaType;
  private _postId: string;
  private _order: number;
  private _status: PostMediaStatus;
  private _processedUrl: string | null;
  private _thumbnailUrl: string | null;
  private _s3Key: string | null;
  private _errorMessage: string | null;
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: PostMediaProps) {
    super(props.id || randomUUID());
    this._url = props.url;
    this._type = props.type;
    this._postId = props.postId;
    this._order = props.order;
    this._status = props.status || PostMediaStatus.PENDING;
    this._processedUrl = props.processedUrl ?? null;
    this._thumbnailUrl = props.thumbnailUrl ?? null;
    this._s3Key = props.s3Key ?? null;
    this._errorMessage = props.errorMessage ?? null;
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();

    this.validate();
    this.addDomainEvent(
      new PostMediaCreatedEvent({
        id: this._id,
        postId: this._postId,
        url: this._url,
        type: this._type,
        order: this._order,
      }),
    );
  }

  // Getters - id is inherited from base Entity class

  get url(): string {
    return this._url;
  }

  get type(): PostMediaType {
    return this._type;
  }

  get postId(): string {
    return this._postId;
  }

  get order(): number {
    return this._order;
  }

  get status(): PostMediaStatus {
    return this._status;
  }

  get processedUrl(): string | null {
    return this._processedUrl;
  }

  get thumbnailUrl(): string | null {
    return this._thumbnailUrl;
  }

  get s3Key(): string | null {
    return this._s3Key;
  }

  get errorMessage(): string | null {
    return this._errorMessage;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  /** Whether the media has been fully processed and is ready to serve */
  get isReady(): boolean {
    return this._status === PostMediaStatus.READY;
  }

  /** Returns the best available URL: processedUrl if ready, otherwise the original upload URL */
  get displayUrl(): string {
    return this._processedUrl ?? this._url;
  }

  // ─── Media Processing Status Transitions ──────────────────────────

  /**
   * Mark media as being processed by the worker.
   * Valid from: PENDING
   */
  public markProcessing(): void {
    this.transitionStatus(PostMediaStatus.PROCESSING);
    this._updatedAt = new Date();

    this.addDomainEvent(
      new MediaProcessingStartedEvent(this._id, this._postId),
    );
  }

  /**
   * Mark media as successfully processed.
   * Valid from: PROCESSING
   */
  public markReady(processedUrl: string, thumbnailUrl: string | null): void {
    if (!processedUrl || processedUrl.trim() === '') {
      throw new InvalidPostMediaException(
        'Processed URL is required when marking media as ready',
      );
    }

    this.transitionStatus(PostMediaStatus.READY);
    this._processedUrl = processedUrl;
    this._thumbnailUrl = thumbnailUrl;
    this._errorMessage = null;
    this._updatedAt = new Date();

    this.addDomainEvent(
      new MediaProcessedEvent(
        this._id,
        this._postId,
        processedUrl,
        thumbnailUrl,
      ),
    );
  }

  /**
   * Mark media processing as failed.
   * Valid from: PROCESSING
   */
  public markFailed(errorMessage: string): void {
    this.transitionStatus(PostMediaStatus.FAILED);
    this._errorMessage = errorMessage || 'Unknown processing error';
    this._updatedAt = new Date();

    this.addDomainEvent(
      new MediaProcessingFailedEvent(
        this._id,
        this._postId,
        this._errorMessage,
      ),
    );
  }

  /**
   * Reset failed media back to pending for retry.
   * Valid from: FAILED
   */
  public retryProcessing(): void {
    this.transitionStatus(PostMediaStatus.PENDING);
    this._errorMessage = null;
    this._updatedAt = new Date();
  }

  // ─── Existing Business Methods ────────────────────────────────────

  public updateUrl(newUrl: string, userId: string): void {
    if (!newUrl || newUrl.trim() === '') {
      throw new InvalidPostMediaException('Media URL cannot be empty');
    }

    const oldUrl = this._url;
    this._url = newUrl;
    this._updatedAt = new Date();

    this.addDomainEvent(
      new PostMediaUpdatedEvent(
        {
          id: this.id,
          postId: this._postId,
          url: this._url,
          type: this._type,
          order: this._order,
        },
        { oldUrl, newUrl },
      ),
    );
  }

  public updateOrder(newOrder: number, userId: string): void {
    if (newOrder < 1) {
      throw new InvalidMediaOrderException(
        'Media order must be greater than 0',
      );
    }

    const oldOrder = this._order;
    this._order = newOrder;
    this._updatedAt = new Date();

    this.addDomainEvent(
      new PostMediaUpdatedEvent(
        {
          id: this.id,
          postId: this._postId,
          url: this._url,
          type: this._type,
          order: this._order,
        },
        { oldOrder, newOrder },
      ),
    );
  }

  public delete(userId: string): void {
    this.addDomainEvent(
      new PostMediaDeletedEvent({
        id: this.id,
        postId: this._postId,
        url: this._url,
        type: this._type,
        order: this._order,
      }),
    );
  }

  // ─── Static Factories ─────────────────────────────────────────────

  public static create(
    props: Omit<PostMediaProps, 'id' | 'createdAt' | 'updatedAt'>,
  ): PostMediaEntity {
    return new PostMediaEntity(props);
  }

  public static fromPersistence(props: PostMediaProps): PostMediaEntity {
    const entity = new PostMediaEntity({
      id: props.id,
      url: props.url,
      type: props.type,
      postId: props.postId,
      order: props.order,
      status: props.status,
      processedUrl: props.processedUrl,
      thumbnailUrl: props.thumbnailUrl,
      s3Key: props.s3Key,
      errorMessage: props.errorMessage,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    });

    // Clear domain events since this is from persistence
    entity.clearEvents();
    return entity;
  }

  public toPlainObject(): PostMediaProps {
    return {
      id: this.id,
      url: this._url,
      type: this._type,
      postId: this._postId,
      order: this._order,
      status: this._status,
      processedUrl: this._processedUrl,
      thumbnailUrl: this._thumbnailUrl,
      s3Key: this._s3Key,
      errorMessage: this._errorMessage,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  // ─── Private Helpers ──────────────────────────────────────────────

  private transitionStatus(target: PostMediaStatus): void {
    const allowed = VALID_STATUS_TRANSITIONS[this._status];
    if (!allowed.includes(target)) {
      throw new InvalidMediaStatusTransitionException(this._status, target);
    }
    this._status = target;
  }

  private validate(): void {
    if (!this._url || this._url.trim() === '') {
      throw new InvalidPostMediaException('Media URL is required');
    }

    if (!this._postId || this._postId.trim() === '') {
      throw new InvalidPostMediaException('Post ID is required');
    }

    if (!Object.values(PostMediaType).includes(this._type)) {
      throw new InvalidMediaTypeException(`Invalid media type: ${this._type}`);
    }

    if (this._order < 1) {
      throw new InvalidMediaOrderException(
        'Media order must be greater than 0',
      );
    }

    if (!Object.values(PostMediaStatus).includes(this._status)) {
      throw new InvalidPostMediaException(
        `Invalid media status: ${this._status}`,
      );
    }
  }
}
