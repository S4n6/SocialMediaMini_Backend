/**
 * Base Entity Class for Domain Entities
 *
 * Abstract base class following DDD patterns.
 * Provides common functionality for all domain entities.
 */

/**
 * Domain Event interface
 */
export interface IDomainEvent {
  aggregateId: string;
  eventName: string;
  occurredOn: Date;
  eventData?: Record<string, unknown>;
}

/**
 * Abstract base entity class
 * Provides identity and domain event functionality
 */
export abstract class Entity<TId = string> {
  protected readonly _id: TId;
  private _domainEvents: IDomainEvent[] = [];

  constructor(id: TId) {
    this._id = id;
  }

  /**
   * Get entity identifier
   */
  get id(): TId {
    return this._id;
  }

  /**
   * Add domain event to be published
   */
  protected addDomainEvent(event: IDomainEvent): void {
    this._domainEvents.push(event);
  }

  /**
   * Get all uncommitted domain events
   */
  public getUncommittedEvents(): IDomainEvent[] {
    return [...this._domainEvents];
  }

  /**
   * Mark all domain events as committed (published)
   */
  public markEventsAsCommitted(): void {
    this._domainEvents = [];
  }

  /**
   * Check if this entity has uncommitted events
   */
  public hasUncommittedEvents(): boolean {
    return this._domainEvents.length > 0;
  }

  /**
   * Equality comparison based on ID
   */
  public equals(other: Entity<TId>): boolean {
    if (!other || other.constructor !== this.constructor) {
      return false;
    }
    return this._id === other._id;
  }

  /**
   * Hash code based on ID
   */
  public hashCode(): string {
    return `${this.constructor.name}_${String(this._id)}`;
  }
}
