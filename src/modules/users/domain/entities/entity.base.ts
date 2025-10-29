/**
 * Base Entity class for Domain Layer
 * Pure domain - no infrastructure dependencies
 */
export interface IDomainEvent {
  readonly aggregateId: string;
  readonly occurredOn: Date;
  readonly eventName: string;
}

export abstract class Entity<T> {
  protected readonly _id: T;
  private _domainEvents: IDomainEvent[] = [];

  constructor(id: T) {
    this._id = id;
  }

  get id(): T {
    return this._id;
  }

  /**
   * Add domain event to the entity
   */
  protected addDomainEvent(event: IDomainEvent): void {
    this._domainEvents.push(event);
  }

  /**
   * Get all domain events
   */
  public getDomainEvents(): IDomainEvent[] {
    return [...this._domainEvents];
  }

  /**
   * Clear all domain events
   */
  public clearDomainEvents(): void {
    this._domainEvents = [];
  }

  /**
   * Check if this entity has domain events
   */
  public hasDomainEvents(): boolean {
    return this._domainEvents.length > 0;
  }

  /**
   * Entity equality based on ID
   */
  public equals(entity: Entity<T>): boolean {
    if (!(entity instanceof Entity)) {
      return false;
    }

    return this._id === entity._id;
  }

  /**
   * Abstract method for domain invariant validation
   */
  public abstract validate(): void;
}
