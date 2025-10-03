import { DomainEvent } from '../../../../shared/domain';
import { ConversationId, UserId, ConversationTitle } from '../value-objects';
import { ConversationType, ConversationStatus } from '../enums';

export interface ConversationCreatedEventData {
  conversationId: ConversationId;
  type: ConversationType;
  createdBy: UserId;
  participants: UserId[];
  title?: ConversationTitle;
  createdAt: Date;
}

export class ConversationCreatedEvent extends DomainEvent {
  constructor(public readonly data: ConversationCreatedEventData) {
    super();
  }

  get eventType(): string {
    return 'ConversationCreated';
  }

  protected getEventData() {
    return this.data;
  }
}

export interface ConversationUpdatedEventData {
  conversationId: ConversationId;
  updatedBy: UserId;
  participants: UserId[];
  changes: {
    title?: ConversationTitle;
    description?: string;
    avatarUrl?: string;
    settings?: any;
  };
  updatedAt: Date;
}

export class ConversationUpdatedEvent extends DomainEvent {
  constructor(public readonly data: ConversationUpdatedEventData) {
    super();
  }

  get eventType(): string {
    return 'ConversationUpdated';
  }

  protected getEventData() {
    return this.data;
  }
}

export interface ConversationDeletedEventData {
  conversationId: ConversationId;
  deletedBy: UserId;
  participants: UserId[];
  deletedAt: Date;
}

export class ConversationDeletedEvent extends DomainEvent {
  constructor(public readonly data: ConversationDeletedEventData) {
    super();
  }

  get eventType(): string {
    return 'ConversationDeleted';
  }

  protected getEventData() {
    return this.data;
  }
}

export interface ConversationArchivedEventData {
  conversationId: ConversationId;
  archivedBy: UserId;
  participants: UserId[];
  archivedAt: Date;
}

export class ConversationArchivedEvent extends DomainEvent {
  constructor(public readonly data: ConversationArchivedEventData) {
    super();
  }

  get eventType(): string {
    return 'ConversationArchived';
  }

  protected getEventData() {
    return this.data;
  }
}

export interface ConversationUnarchivedEventData {
  conversationId: ConversationId;
  unarchivedBy: UserId;
  participants: UserId[];
  unarchivedAt: Date;
}

export class ConversationUnarchivedEvent extends DomainEvent {
  constructor(public readonly data: ConversationUnarchivedEventData) {
    super();
  }

  get eventType(): string {
    return 'ConversationUnarchived';
  }

  protected getEventData() {
    return this.data;
  }
}

export interface ConversationMutedEventData {
  conversationId: ConversationId;
  mutedBy: UserId;
  muteUntil?: Date;
  mutedAt: Date;
}

export class ConversationMutedEvent extends DomainEvent {
  constructor(public readonly data: ConversationMutedEventData) {
    super();
  }

  get eventType(): string {
    return 'ConversationMuted';
  }

  protected getEventData() {
    return this.data;
  }
}

export interface ConversationUnmutedEventData {
  conversationId: ConversationId;
  unmutedBy: UserId;
  unmutedAt: Date;
}

export class ConversationUnmutedEvent extends DomainEvent {
  constructor(public readonly data: ConversationUnmutedEventData) {
    super();
  }

  get eventType(): string {
    return 'ConversationUnmuted';
  }

  protected getEventData() {
    return this.data;
  }
}
