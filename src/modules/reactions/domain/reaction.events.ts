import { ReactionEntity, ReactionType } from './reaction.entity';

export abstract class ReactionDomainEvent {
  abstract readonly eventName: string;
  readonly occurredOn: Date;

  constructor(public readonly reaction: ReactionEntity) {
    this.occurredOn = new Date();
  }
}

export class ReactionCreatedEvent extends ReactionDomainEvent {
  readonly eventName = 'reaction.created';

  constructor(
    reaction: ReactionEntity,
    public readonly targetAuthorId: string,
    public readonly targetContent: string,
  ) {
    super(reaction);
  }
}

export class ReactionUpdatedEvent extends ReactionDomainEvent {
  readonly eventName = 'reaction.updated';

  constructor(
    reaction: ReactionEntity,
    public readonly oldType: ReactionType,
    public readonly newType: ReactionType,
  ) {
    super(reaction);
  }
}

export class ReactionDeletedEvent extends ReactionDomainEvent {
  readonly eventName = 'reaction.deleted';

  constructor(
    reaction: ReactionEntity,
    public readonly targetAuthorId: string,
  ) {
    super(reaction);
  }
}
