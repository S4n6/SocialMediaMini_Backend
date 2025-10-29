import { ReactionEntity } from './entities/reaction.entity';
import { ReactionType, TargetType } from './value-objects';
import { ReactionType as ReactionTypeEnum } from '../constants';

export abstract class BaseDomainEvent {
  abstract readonly eventName: string;
  readonly occurredOn: Date;
  readonly aggregateId: string;
  readonly aggregateVersion: number;

  constructor(aggregateId: string, aggregateVersion: number = 1) {
    this.aggregateId = aggregateId;
    this.aggregateVersion = aggregateVersion;
    this.occurredOn = new Date();
  }
}

export abstract class ReactionDomainEvent extends BaseDomainEvent {
  constructor(
    public readonly reaction: ReactionEntity,
    aggregateVersion: number = 1,
  ) {
    super(reaction.id, aggregateVersion);
  }
}

export class ReactionCreatedEvent extends ReactionDomainEvent {
  readonly eventName = 'reaction.created' as const;

  constructor(
    reaction: ReactionEntity,
    public readonly targetAuthorId: string,
    public readonly targetContent: string,
    public readonly metadata: {
      targetType: TargetType;
      reactionType: ReactionType;
      reactorId: string;
      targetId: string;
    },
  ) {
    super(reaction);
  }

  static create(
    reaction: ReactionEntity,
    targetAuthorId: string,
    targetContent: string,
  ): ReactionCreatedEvent {
    return new ReactionCreatedEvent(reaction, targetAuthorId, targetContent, {
      targetType: TargetType.create(reaction.targetType),
      reactionType: ReactionType.create(reaction.type),
      reactorId: reaction.reactorId,
      targetId: reaction.targetId,
    });
  }
}

export class ReactionUpdatedEvent extends ReactionDomainEvent {
  readonly eventName = 'reaction.updated' as const;

  constructor(
    reaction: ReactionEntity,
    public readonly previousType: ReactionType,
    public readonly newType: ReactionType,
    public readonly metadata: {
      targetType: TargetType;
      reactorId: string;
      targetId: string;
    },
  ) {
    super(reaction);
  }

  static create(
    reaction: ReactionEntity,
    previousType: ReactionTypeEnum,
  ): ReactionUpdatedEvent {
    return new ReactionUpdatedEvent(
      reaction,
      ReactionType.create(previousType),
      ReactionType.create(reaction.type),
      {
        targetType: TargetType.create(reaction.targetType),
        reactorId: reaction.reactorId,
        targetId: reaction.targetId,
      },
    );
  }
}

export class ReactionRemovedEvent extends ReactionDomainEvent {
  readonly eventName = 'reaction.removed' as const;

  constructor(
    reaction: ReactionEntity,
    public readonly targetAuthorId: string,
    public readonly metadata: {
      targetType: TargetType;
      reactionType: ReactionType;
      reactorId: string;
      targetId: string;
      removedAt: Date;
    },
  ) {
    super(reaction);
  }

  static create(
    reaction: ReactionEntity,
    targetAuthorId: string,
  ): ReactionRemovedEvent {
    return new ReactionRemovedEvent(reaction, targetAuthorId, {
      targetType: TargetType.create(reaction.targetType),
      reactionType: ReactionType.create(reaction.type),
      reactorId: reaction.reactorId,
      targetId: reaction.targetId,
      removedAt: new Date(),
    });
  }
}

// Event types union for type safety
export type ReactionEvents =
  | ReactionCreatedEvent
  | ReactionUpdatedEvent
  | ReactionRemovedEvent;

// Event names union for type safety
export type ReactionEventNames = ReactionEvents['eventName'];
