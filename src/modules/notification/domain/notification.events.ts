// Temporary DomainEvent interface until shared domain is available
export interface DomainEvent {
  getAggregateId(): string;
  getEventName(): string;
}

export class NotificationCreatedEvent implements DomainEvent {
  constructor(
    public readonly notificationId: string,
    public readonly userId: string,
    public readonly type: string,
    public readonly title: string,
    public readonly content: string,
    public readonly entityId?: string,
    public readonly entityType?: string,
    public readonly occurredAt: Date = new Date(),
  ) {}

  getAggregateId(): string {
    return this.notificationId;
  }

  getEventName(): string {
    return 'NotificationCreated';
  }
}

export class NotificationReadEvent implements DomainEvent {
  constructor(
    public readonly notificationId: string,
    public readonly userId: string,
    public readonly occurredAt: Date = new Date(),
  ) {}

  getAggregateId(): string {
    return this.notificationId;
  }

  getEventName(): string {
    return 'NotificationRead';
  }
}

export class NotificationUnreadEvent implements DomainEvent {
  constructor(
    public readonly notificationId: string,
    public readonly userId: string,
    public readonly occurredAt: Date = new Date(),
  ) {}

  getAggregateId(): string {
    return this.notificationId;
  }

  getEventName(): string {
    return 'NotificationUnread';
  }
}

export class NotificationDeletedEvent implements DomainEvent {
  constructor(
    public readonly notificationId: string,
    public readonly userId: string,
    public readonly occurredAt: Date = new Date(),
  ) {}

  getAggregateId(): string {
    return this.notificationId;
  }

  getEventName(): string {
    return 'NotificationDeleted';
  }
}

export class BulkNotificationsReadEvent implements DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly notificationIds: string[],
    public readonly occurredAt: Date = new Date(),
  ) {}

  getAggregateId(): string {
    return this.userId;
  }

  getEventName(): string {
    return 'BulkNotificationsRead';
  }
}
