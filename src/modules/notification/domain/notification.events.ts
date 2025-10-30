import { IDomainEvent } from './shared/base-entity';

export class NotificationCreatedEvent implements IDomainEvent {
  public readonly aggregateId: string;
  public readonly eventName: string = 'NotificationCreated';
  public readonly occurredOn: Date;
  public readonly eventData: Record<string, unknown>;

  constructor(
    public readonly notificationId: string,
    public readonly userId: string,
    public readonly type: string,
    public readonly title: string,
    public readonly content: string,
    public readonly entityId?: string,
    public readonly entityType?: string,
    occurredAt: Date = new Date(),
  ) {
    this.aggregateId = notificationId;
    this.occurredOn = occurredAt;
    this.eventData = {
      notificationId,
      userId,
      type,
      title,
      content,
      entityId,
      entityType,
    };
  }

  // Backward compatibility methods
  getAggregateId(): string {
    return this.aggregateId;
  }

  getEventName(): string {
    return this.eventName;
  }
}

export class NotificationReadEvent implements IDomainEvent {
  public readonly aggregateId: string;
  public readonly eventName: string = 'NotificationRead';
  public readonly occurredOn: Date;
  public readonly eventData: Record<string, unknown>;

  constructor(
    public readonly notificationId: string,
    public readonly userId: string,
    occurredAt: Date = new Date(),
  ) {
    this.aggregateId = notificationId;
    this.occurredOn = occurredAt;
    this.eventData = { notificationId, userId };
  }

  getAggregateId(): string {
    return this.aggregateId;
  }

  getEventName(): string {
    return this.eventName;
  }
}

export class NotificationUnreadEvent implements IDomainEvent {
  public readonly aggregateId: string;
  public readonly eventName: string = 'NotificationUnread';
  public readonly occurredOn: Date;
  public readonly eventData: Record<string, unknown>;

  constructor(
    public readonly notificationId: string,
    public readonly userId: string,
    occurredAt: Date = new Date(),
  ) {
    this.aggregateId = notificationId;
    this.occurredOn = occurredAt;
    this.eventData = { notificationId, userId };
  }

  getAggregateId(): string {
    return this.aggregateId;
  }

  getEventName(): string {
    return this.eventName;
  }
}

export class NotificationDeletedEvent implements IDomainEvent {
  public readonly aggregateId: string;
  public readonly eventName: string = 'NotificationDeleted';
  public readonly occurredOn: Date;
  public readonly eventData: Record<string, unknown>;

  constructor(
    public readonly notificationId: string,
    public readonly userId: string,
    occurredAt: Date = new Date(),
  ) {
    this.aggregateId = notificationId;
    this.occurredOn = occurredAt;
    this.eventData = { notificationId, userId };
  }

  getAggregateId(): string {
    return this.aggregateId;
  }

  getEventName(): string {
    return this.eventName;
  }
}

export class BulkNotificationsReadEvent implements IDomainEvent {
  public readonly aggregateId: string;
  public readonly eventName: string = 'BulkNotificationsRead';
  public readonly occurredOn: Date;
  public readonly eventData: Record<string, unknown>;

  constructor(
    public readonly userId: string,
    public readonly notificationIds: string[],
    occurredAt: Date = new Date(),
  ) {
    this.aggregateId = userId;
    this.occurredOn = occurredAt;
    this.eventData = { userId, notificationIds };
  }

  getAggregateId(): string {
    return this.aggregateId;
  }

  getEventName(): string {
    return this.eventName;
  }
}
