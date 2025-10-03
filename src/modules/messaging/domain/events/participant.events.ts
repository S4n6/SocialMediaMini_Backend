import { DomainEvent } from '../../../../shared/domain';
import { ConversationId, UserId } from '../value-objects';

export interface ParticipantJoinedEventData {
  conversationId: ConversationId;
  participantId: UserId;
  addedBy?: UserId;
  joinedAt: Date;
}

export class ParticipantJoinedEvent extends DomainEvent {
  constructor(public readonly data: ParticipantJoinedEventData) {
    super();
  }

  get eventType(): string {
    return 'ParticipantJoined';
  }

  protected getEventData() {
    return this.data;
  }
}

export interface ParticipantLeftEventData {
  conversationId: ConversationId;
  participantId: UserId;
  removedBy?: UserId;
  leftAt: Date;
}

export class ParticipantLeftEvent extends DomainEvent {
  constructor(public readonly data: ParticipantLeftEventData) {
    super();
  }

  get eventType(): string {
    return 'ParticipantLeft';
  }

  protected getEventData() {
    return this.data;
  }
}

export interface ParticipantRoleChangedEventData {
  conversationId: ConversationId;
  participantId: UserId;
  oldRole: string;
  newRole: string;
  changedBy: UserId;
  changedAt: Date;
}

export class ParticipantRoleChangedEvent extends DomainEvent {
  constructor(public readonly data: ParticipantRoleChangedEventData) {
    super();
  }

  get eventType(): string {
    return 'ParticipantRoleChanged';
  }

  protected getEventData() {
    return this.data;
  }
}

export interface ParticipantTypingStartedEventData {
  conversationId: ConversationId;
  participantId: UserId;
  startedAt: Date;
}

export class ParticipantTypingStartedEvent extends DomainEvent {
  constructor(public readonly data: ParticipantTypingStartedEventData) {
    super();
  }

  get eventType(): string {
    return 'ParticipantTypingStarted';
  }

  protected getEventData() {
    return this.data;
  }
}

export interface ParticipantTypingStoppedEventData {
  conversationId: ConversationId;
  participantId: UserId;
  stoppedAt: Date;
}

export class ParticipantTypingStoppedEvent extends DomainEvent {
  constructor(public readonly data: ParticipantTypingStoppedEventData) {
    super();
  }

  get eventType(): string {
    return 'ParticipantTypingStopped';
  }

  protected getEventData() {
    return this.data;
  }
}
