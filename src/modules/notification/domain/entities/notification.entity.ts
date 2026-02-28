import { randomUUID } from 'crypto';
import { Entity } from '../../../../shared/domain/entity.base';
import {
  NotificationType,
  NotificationEntityType,
} from '../enums/notification.enums';
import { NotificationPayload } from '../value-objects/notification-payload.vo';
import {
  NotificationCreatedEvent,
  NotificationReadEvent,
} from '../events/notification-domain.events';
import {
  InvalidNotificationContentException,
  EmptyNotificationTitleException,
  EmptyNotificationContentException,
  InvalidUserIdException,
  NotificationAlreadyReadException,
} from '../exceptions/notification.exceptions';

// ────────────────────────────────────────────────────────────
// Construction props
// ────────────────────────────────────────────────────────────

export interface NotificationProps {
  id?: string;
  type: NotificationType;
  title: string;
  content: string;
  userId: string;
  isRead?: boolean;
  entityId?: string;
  entityType?: NotificationEntityType;
  metadata?: NotificationPayload;
  createdAt?: Date;
}

// ────────────────────────────────────────────────────────────
// Entity
// ────────────────────────────────────────────────────────────

export class NotificationEntity extends Entity<string> {
  private readonly _type: NotificationType;
  private _title: string;
  private _content: string;
  private readonly _userId: string;
  private _isRead: boolean;
  private readonly _entityId?: string;
  private readonly _entityType?: NotificationEntityType;
  private readonly _metadata?: NotificationPayload;
  private readonly _createdAt: Date;

  // ── Title / content caps (pure domain constant) ─────────
  private static readonly TITLE_MAX = 200;
  private static readonly CONTENT_MAX = 1000;

  constructor(props: NotificationProps) {
    super(props.id || randomUUID());

    NotificationEntity.validateTitle(props.title);
    NotificationEntity.validateContent(props.content);
    NotificationEntity.validateUserId(props.userId);

    if (props.entityId && !props.entityType) {
      throw new InvalidNotificationContentException(
        'entityType is required when entityId is provided',
      );
    }

    this._type = props.type;
    this._title = props.title;
    this._content = props.content;
    this._userId = props.userId;
    this._isRead = props.isRead ?? false;
    this._entityId = props.entityId;
    this._entityType = props.entityType;
    this._metadata = props.metadata;
    this._createdAt = props.createdAt ?? new Date();

    // Raise domain event for brand-new notifications only
    if (!props.id) {
      this.addDomainEvent(new NotificationCreatedEvent(this));
    }
  }

  // ── Getters ─────────────────────────────────────────────

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
  get metadata(): NotificationPayload | undefined {
    return this._metadata;
  }
  get createdAt(): Date {
    return this._createdAt;
  }

  // ── Business methods ────────────────────────────────────

  markAsRead(): void {
    if (this._isRead) throw new NotificationAlreadyReadException(this.id);
    this._isRead = true;
    this.addDomainEvent(new NotificationReadEvent(this.id, this._userId));
  }

  /** Idempotent mark-as-read — no throw if already read */
  markAsReadSafe(): boolean {
    if (this._isRead) return false;
    this._isRead = true;
    this.addDomainEvent(new NotificationReadEvent(this.id, this._userId));
    return true;
  }

  isOwnedBy(userId: string): boolean {
    return this._userId === userId;
  }

  isOlderThan(days: number): boolean {
    const ms = days * 24 * 60 * 60 * 1000;
    return Date.now() - this._createdAt.getTime() > ms;
  }

  // ── Validation (static so factory can reuse) ────────────

  private static validateTitle(title: string): void {
    if (!title?.trim()) throw new EmptyNotificationTitleException();
    if (title.length > NotificationEntity.TITLE_MAX) {
      throw new InvalidNotificationContentException(
        `Title must not exceed ${NotificationEntity.TITLE_MAX} characters`,
      );
    }
  }

  private static validateContent(content: string): void {
    if (!content?.trim()) throw new EmptyNotificationContentException();
    if (content.length > NotificationEntity.CONTENT_MAX) {
      throw new InvalidNotificationContentException(
        `Content must not exceed ${NotificationEntity.CONTENT_MAX} characters`,
      );
    }
  }

  private static validateUserId(userId: string): void {
    if (!userId?.trim()) throw new InvalidUserIdException();
  }
}
