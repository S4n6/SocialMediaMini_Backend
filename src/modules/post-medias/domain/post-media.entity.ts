import { Entity } from '../../../shared/domain/entity.base';
import { randomUUID } from 'crypto';

import {
  PostMediaCreatedEvent,
  PostMediaDeletedEvent,
  PostMediaUpdatedEvent,
} from './post-media.events';
import {
  InvalidMediaOrderException,
  InvalidMediaTypeException,
  InvalidPostMediaException,
} from './post-media.exceptions';

export enum PostMediaType {
  IMAGE = 'image',
  VIDEO = 'video',
}

export interface PostMediaProps {
  id?: string;
  url: string;
  type: PostMediaType;
  postId: string;
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class PostMediaEntity extends Entity<string> {
  private _url: string;
  private _type: PostMediaType;
  private _postId: string;
  private _order: number;
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(props: PostMediaProps) {
    super(props.id || randomUUID());
    this._url = props.url;
    this._type = props.type;
    this._postId = props.postId;
    this._order = props.order;
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

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // Business methods
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

  public static create(
    props: Omit<PostMediaProps, 'id' | 'createdAt' | 'updatedAt'>,
  ): PostMediaEntity {
    return new PostMediaEntity(props);
  }

  public static fromPersistence(props: PostMediaProps): PostMediaEntity {
    const entity = Object.create(PostMediaEntity.prototype);
    Entity.call(entity, props.id);
    entity._url = props.url;
    entity._type = props.type;
    entity._postId = props.postId;
    entity._order = props.order;
    entity._createdAt = props.createdAt;
    entity._updatedAt = props.updatedAt;
    return entity;
  }

  public toPlainObject(): PostMediaProps {
    return {
      id: this.id,
      url: this._url,
      type: this._type,
      postId: this._postId,
      order: this._order,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
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
  }
}
