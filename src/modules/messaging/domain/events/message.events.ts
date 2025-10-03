import { DomainEvent } from '../../../../shared/domain';
import {
  MessageId,
  ConversationId,
  UserId,
  MessageContent,
} from '../value-objects';
import { MessageType, MessageStatus } from '../enums';

export interface MessageSentEventData {
  messageId: MessageId;
  conversationId: ConversationId;
  senderId: UserId;
  content: MessageContent;
  type: MessageType;
  sentAt: Date;
  participants: UserId[];
}

export class MessageSentEvent extends DomainEvent {
  constructor(public readonly data: MessageSentEventData) {
    super();
  }

  get eventType(): string {
    return 'MessageSent';
  }

  protected getEventData() {
    return this.data;
  }
}

export interface MessageDeliveredEventData {
  messageId: MessageId;
  conversationId: ConversationId;
  senderId: UserId;
  deliveredAt: Date;
  participants: UserId[];
}

export class MessageDeliveredEvent extends DomainEvent {
  constructor(public readonly data: MessageDeliveredEventData) {
    super();
  }

  get eventType(): string {
    return 'MessageDelivered';
  }

  protected getEventData() {
    return this.data;
  }
}

export interface MessageReadEventData {
  messageId: MessageId;
  conversationId: ConversationId;
  readBy: UserId;
  readAt: Date;
  participants: UserId[];
}

export class MessageReadEvent extends DomainEvent {
  constructor(public readonly data: MessageReadEventData) {
    super();
  }

  get eventType(): string {
    return 'MessageRead';
  }

  protected getEventData() {
    return this.data;
  }
}

export interface MessageEditedEventData {
  messageId: MessageId;
  conversationId: ConversationId;
  editedBy: UserId;
  oldContent: MessageContent;
  newContent: MessageContent;
  editedAt: Date;
}

export class MessageEditedEvent extends DomainEvent {
  constructor(public readonly data: MessageEditedEventData) {
    super();
  }

  get eventType(): string {
    return 'MessageEdited';
  }

  protected getEventData() {
    return this.data;
  }
}

export interface MessageDeletedEventData {
  messageId: MessageId;
  conversationId: ConversationId;
  deletedBy: UserId;
  deletedAt: Date;
}

export class MessageDeletedEvent extends DomainEvent {
  constructor(public readonly data: MessageDeletedEventData) {
    super();
  }

  get eventType(): string {
    return 'MessageDeleted';
  }

  protected getEventData() {
    return this.data;
  }
}

export interface MessageReactionAddedEventData {
  messageId: MessageId;
  conversationId: ConversationId;
  userId: UserId;
  reactionType: string;
  addedAt: Date;
}

export class MessageReactionAddedEvent extends DomainEvent {
  constructor(public readonly data: MessageReactionAddedEventData) {
    super();
  }

  get eventType(): string {
    return 'MessageReactionAdded';
  }

  protected getEventData() {
    return this.data;
  }
}

export interface MessageReactionRemovedEventData {
  messageId: MessageId;
  conversationId: ConversationId;
  userId: UserId;
  reactionType: string;
  removedAt: Date;
}

export class MessageReactionRemovedEvent extends DomainEvent {
  constructor(public readonly data: MessageReactionRemovedEventData) {
    super();
  }

  get eventType(): string {
    return 'MessageReactionRemoved';
  }

  protected getEventData() {
    return this.data;
  }
}

export interface MessageFailedEventData {
  messageId: MessageId;
  conversationId: ConversationId;
  senderId: UserId;
  error: string;
  failedAt: Date;
}

export class MessageFailedEvent extends DomainEvent {
  constructor(public readonly data: MessageFailedEventData) {
    super();
  }

  get eventType(): string {
    return 'MessageFailed';
  }

  protected getEventData() {
    return this.data;
  }
}
