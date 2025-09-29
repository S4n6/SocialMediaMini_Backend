import { DomainEvent } from '../../../shared/domain/domain-event.base';

export class SearchHistoryEntryAddedEvent extends DomainEvent {
  constructor(
    public readonly searchHistoryId: string,
    public readonly userId: string,
    public readonly searchedUserId: string,
    public readonly searchedAt: Date,
  ) {
    super();
  }

  get eventType(): string {
    return 'SearchHistoryEntryAdded';
  }

  protected getEventData(): Record<string, any> {
    return {
      searchHistoryId: this.searchHistoryId,
      userId: this.userId,
      searchedUserId: this.searchedUserId,
      searchedAt: this.searchedAt.toISOString(),
    };
  }
}

export class SearchHistoryEntryRemovedEvent extends DomainEvent {
  constructor(
    public readonly searchHistoryId: string,
    public readonly userId: string,
    public readonly searchedUserId: string,
  ) {
    super();
  }

  get eventType(): string {
    return 'SearchHistoryEntryRemoved';
  }

  protected getEventData(): Record<string, any> {
    return {
      searchHistoryId: this.searchHistoryId,
      userId: this.userId,
      searchedUserId: this.searchedUserId,
    };
  }
}

export class SearchHistoryClearedEvent extends DomainEvent {
  constructor(
    public readonly searchHistoryId: string,
    public readonly userId: string,
    public readonly removedCount: number,
  ) {
    super();
  }

  get eventType(): string {
    return 'SearchHistoryCleared';
  }

  protected getEventData(): Record<string, any> {
    return {
      searchHistoryId: this.searchHistoryId,
      userId: this.userId,
      removedCount: this.removedCount,
    };
  }
}
