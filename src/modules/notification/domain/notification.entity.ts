import { randomUUID } from 'crypto';
import {
  NotificationCreatedEvent,
  NotificationReadEvent,
  NotificationUnreadEvent,
  NotificationDeletedEvent,
} from './notification.events';
import {
  InvalidNotificationTypeException,
  InvalidNotificationContentException,
  NotificationAlreadyReadException,
  NotificationAlreadyUnreadException,
  EmptyNotificationTitleException,
  EmptyNotificationContentException,
  InvalidUserIdException,
} from './notification.exceptions';

// Temporary base class until we have the shared domain
class Entity {
  protected domainEvents: any[] = [];

  constructor(protected _id: string) {}

  get id(): string {
    return this._id;
  }

  protected addDomainEvent(event: any): void {
    this.domainEvents.push(event);
  }

  public getUncommittedEvents(): any[] {
    return this.domainEvents;
  }

  public markEventsAsCommitted(): void {
    this.domainEvents = [];
  }
}

export enum NotificationType {
  LIKE = 'like',
  COMMENT = 'comment',
  FOLLOW = 'follow',
  MESSAGE = 'message',
  POST_MENTION = 'post_mention',
  COMMENT_MENTION = 'comment_mention',
  SYSTEM = 'system',
  FRIEND_REQUEST = 'friend_request',
  BIRTHDAY = 'birthday',
  POST_SHARE = 'post_share',
}

export enum NotificationEntityType {
  POST = 'post',
  USER = 'user',
  COMMENT = 'comment',
  MESSAGE = 'message',
}

export interface NotificationProps {
  id?: string;
  type: NotificationType;
  title: string;
  content: string;
  userId: string;
  isRead?: boolean;
  entityId?: string;
  entityType?: NotificationEntityType;
  createdAt?: Date;
}

export class NotificationEntity extends Entity {
  private _type: NotificationType;
  private _title: string;
  private _content: string;
  private _userId: string;
  private _isRead: boolean;
  private _entityId?: string;
  private _entityType?: NotificationEntityType;
  private _createdAt: Date;

  constructor(props: NotificationProps) {
    super(props.id || randomUUID());
    this.validateProps(props);

    this._type = props.type;
    this._title = props.title;
    this._content = props.content;
    this._userId = props.userId;
    this._isRead = props.isRead || false;
    this._entityId = props.entityId;
    this._entityType = props.entityType;
    this._createdAt = props.createdAt || new Date();

    // Add domain event for new notifications
    if (!props.id) {
      this.addDomainEvent(
        new NotificationCreatedEvent(
          this.id,
          this._userId,
          this._type,
          this._title,
          this._content,
          this._entityId,
          this._entityType?.toString(),
        ),
      );
    }
  }

  // Getters
  get type(): NotificationType {
    return this._type;
  }

  get title(): string {
    return this._title;
  }

  get content(): string {
    return this._content;
  }

  get userId(): string {
    return this._userId;
  }

  get isRead(): boolean {
    return this._isRead;
  }

  get entityId(): string | undefined {
    return this._entityId;
  }

  get entityType(): NotificationEntityType | undefined {
    return this._entityType;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  // Business methods
  public markAsRead(): void {
    if (this._isRead) {
      throw new NotificationAlreadyReadException(this.id);
    }

    this._isRead = true;
    this.addDomainEvent(new NotificationReadEvent(this.id, this._userId));
  }

  public markAsUnread(): void {
    if (!this._isRead) {
      throw new NotificationAlreadyUnreadException(this.id);
    }

    this._isRead = false;
    this.addDomainEvent(new NotificationUnreadEvent(this.id, this._userId));
  }

  public delete(): void {
    this.addDomainEvent(new NotificationDeletedEvent(this.id, this._userId));
  }

  public updateContent(title: string, content: string): void {
    this.validateTitle(title);
    this.validateContent(content);

    this._title = title;
    this._content = content;
  }

  public isOwnedBy(userId: string): boolean {
    return this._userId === userId;
  }

  public isRelatedTo(
    entityId: string,
    entityType?: NotificationEntityType,
  ): boolean {
    if (entityType && this._entityType !== entityType) {
      return false;
    }
    return this._entityId === entityId;
  }

  public getAge(): number {
    return Date.now() - this._createdAt.getTime();
  }

  public isOlderThan(days: number): boolean {
    const millisecondsInDay = 24 * 60 * 60 * 1000;
    return this.getAge() > days * millisecondsInDay;
  }

  // Validation methods
  private validateProps(props: NotificationProps): void {
    this.validateType(props.type);
    this.validateTitle(props.title);
    this.validateContent(props.content);
    this.validateUserId(props.userId);

    if (props.entityId && !props.entityType) {
      throw new InvalidNotificationContentException(
        'entityType is required when entityId is provided',
      );
    }
  }

  private validateType(type: NotificationType): void {
    if (!Object.values(NotificationType).includes(type)) {
      throw new InvalidNotificationTypeException(type);
    }
  }

  private validateTitle(title: string): void {
    if (!title || title.trim().length === 0) {
      throw new EmptyNotificationTitleException();
    }

    if (title.length > 200) {
      throw new InvalidNotificationContentException(
        'Title must not exceed 200 characters',
      );
    }
  }

  private validateContent(content: string): void {
    if (!content || content.trim().length === 0) {
      throw new EmptyNotificationContentException();
    }

    if (content.length > 1000) {
      throw new InvalidNotificationContentException(
        'Content must not exceed 1000 characters',
      );
    }
  }

  private validateUserId(userId: string): void {
    if (!userId || userId.trim().length === 0) {
      throw new InvalidUserIdException();
    }
  }

  // Static factory methods
  static create(props: Omit<NotificationProps, 'id'>): NotificationEntity {
    return new NotificationEntity(props);
  }

  static fromPersistence(props: NotificationProps): NotificationEntity {
    return new NotificationEntity(props);
  }

  // Utility method for converting to plain object
  toPlainObject() {
    return {
      id: this.id,
      type: this._type,
      title: this._title,
      content: this._content,
      userId: this._userId,
      isRead: this._isRead,
      entityId: this._entityId,
      entityType: this._entityType,
      createdAt: this._createdAt,
    };
  }
}
