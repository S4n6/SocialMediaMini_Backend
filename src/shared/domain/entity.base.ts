import { DomainEvent } from './domain-event.base';

/**
 * Base Entity class for all domain entities
 * Provides common functionality for entity lifecycle and domain events
 */
export abstract class Entity<T> {
  protected readonly _id: T;
  private _domainEvents: DomainEvent[] = [];

  constructor(id: T) {
    this._id = id;
  }

  get id(): T {
    return this._id;
  }

  get domainEvents(): DomainEvent[] {
    return this._domainEvents;
  }

  /**
   * Add a domain event to be published later
   */
  protected addDomainEvent(domainEvent: DomainEvent): void {
    this._domainEvents.push(domainEvent);
  }

  /**
   * Clear all domain events
   */
  public clearEvents(): void {
    this._domainEvents = [];
  }

  /**
   * Mark events as committed (called after successful persistence)
   */
  public markEventsAsCommitted(): void {
    this._domainEvents.forEach((event) => event.markAsCommitted());
  }

  /**
   * Check if entity is equal to another entity
   */
  public equals(object?: Entity<T>): boolean {
    if (object === null || object === undefined) {
      return false;
    }

    if (this === object) {
      return true;
    }

    return this._id === object._id;
  }

  /**
   * Get string representation of entity
   */
  public toString(): string {
    return `${this.constructor.name}(${this._id})`;
  }
}
