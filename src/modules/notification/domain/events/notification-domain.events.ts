import { DomainEvent } from '../../../../shared/domain/domain-event.base';
import { NotificationEntity } from '../entities/notification.entity';

/**
 * Raised when a new notification is persisted for the first time.
 * Subscribers use this to push to SSE streams and trigger side-effects.
 */
export class NotificationCreatedEvent extends DomainEvent {
  constructor(public readonly notification: NotificationEntity) {
    super();
  }

  get eventType(): string {
    return 'notification.created';
  }

  protected getEventData(): Record<string, any> {
    return {
      notificationId: this.notification.id,
      userId: this.notification.userId,
      type: this.notification.type,
      title: this.notification.title,
      entityId: this.notification.entityId,
      entityType: this.notification.entityType,
      metadata: this.notification.metadata,
    };
  }
}

/**
 * Raised when a user reads a notification.
 */
export class NotificationReadEvent extends DomainEvent {
  constructor(
    public readonly notificationId: string,
    public readonly userId: string,
  ) {
    super();
  }

  get eventType(): string {
    return 'notification.read';
  }

  protected getEventData(): Record<string, any> {
    return {
      notificationId: this.notificationId,
      userId: this.userId,
    };
  }
}
