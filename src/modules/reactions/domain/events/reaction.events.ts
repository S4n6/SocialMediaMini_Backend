import { DomainEvent } from '../../../../shared/domain';
import { ReactionTypeValue } from '../value-objects/reaction-type.value-object';
import { TargetTypeValue } from '../value-objects/target-type.value-object';

export class ReactionCreatedEvent extends DomainEvent {
  get eventType(): string {
    return 'reaction.created';
  }

  constructor(
    public readonly reactionId: string,
    public readonly reactorId: string,
    public readonly targetId: string,
    public readonly targetType: TargetTypeValue,
    public readonly reactionType: ReactionTypeValue,
  ) {
    super();
  }

  protected getEventData(): Record<string, any> {
    return {
      reactionId: this.reactionId,
      reactorId: this.reactorId,
      targetId: this.targetId,
      targetType: this.targetType,
      reactionType: this.reactionType,
    };
  }
}

export class ReactionTypeChangedEvent extends DomainEvent {
  get eventType(): string {
    return 'reaction.type_changed';
  }

  constructor(
    public readonly reactionId: string,
    public readonly reactorId: string,
    public readonly targetId: string,
    public readonly targetType: TargetTypeValue,
    public readonly previousType: ReactionTypeValue,
    public readonly newType: ReactionTypeValue,
  ) {
    super();
  }

  protected getEventData(): Record<string, any> {
    return {
      reactionId: this.reactionId,
      reactorId: this.reactorId,
      targetId: this.targetId,
      targetType: this.targetType,
      previousType: this.previousType,
      newType: this.newType,
    };
  }
}

export class ReactionRemovedEvent extends DomainEvent {
  get eventType(): string {
    return 'reaction.removed';
  }

  constructor(
    public readonly reactionId: string,
    public readonly reactorId: string,
    public readonly targetId: string,
    public readonly targetType: TargetTypeValue,
    public readonly reactionType: ReactionTypeValue,
  ) {
    super();
  }

  protected getEventData(): Record<string, any> {
    return {
      reactionId: this.reactionId,
      reactorId: this.reactorId,
      targetId: this.targetId,
      targetType: this.targetType,
      reactionType: this.reactionType,
    };
  }
}

// Event types union
export type ReactionEvents =
  | ReactionCreatedEvent
  | ReactionTypeChangedEvent
  | ReactionRemovedEvent;
