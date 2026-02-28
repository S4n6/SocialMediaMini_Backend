export abstract class StoryDomainEvent {
  abstract readonly eventName: string;
  readonly occurredOn: Date;

  constructor() {
    this.occurredOn = new Date();
  }
}

export class StoryCreatedEvent extends StoryDomainEvent {
  readonly eventName = 'story.created';

  constructor(
    public readonly storyId: string,
    public readonly authorId: string,
  ) {
    super();
  }
}

export class StoryViewedEvent extends StoryDomainEvent {
  readonly eventName = 'story.viewed';

  constructor(
    public readonly storyId: string,
    public readonly viewerId: string,
  ) {
    super();
  }
}

export class StoryExpiredEvent extends StoryDomainEvent {
  readonly eventName = 'story.expired';

  constructor(
    public readonly storyId: string,
    public readonly authorId: string,
  ) {
    super();
  }
}

export class StoryDeletedEvent extends StoryDomainEvent {
  readonly eventName = 'story.deleted';

  constructor(
    public readonly storyId: string,
    public readonly authorId: string,
  ) {
    super();
  }
}
