import { randomUUID } from 'crypto';

/**
 * Base class for all domain events
 * Represents something that happened in the domain that domain experts care about
 */
export abstract class DomainEvent {
  public readonly eventId: string;
  public readonly occurredOn: Date;
  public readonly eventVersion: number;
  private _isCommitted: boolean = false;

  constructor(eventVersion: number = 1) {
    this.eventId = randomUUID();
    this.occurredOn = new Date();
    this.eventVersion = eventVersion;
  }

  /**
   * Get the event type name
   */
  abstract get eventType(): string;

  /**
   * Check if event has been committed to event store
   */
  get isCommitted(): boolean {
    return this._isCommitted;
  }

  /**
   * Mark event as committed (called after successful persistence)
   */
  public markAsCommitted(): void {
    this._isCommitted = true;
  }

  /**
   * Get event data for serialization
   */
  public toJSON(): Record<string, any> {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      eventVersion: this.eventVersion,
      occurredOn: this.occurredOn.toISOString(),
      data: this.getEventData(),
    };
  }

  /**
   * Override this method to provide event-specific data
   */
  protected abstract getEventData(): Record<string, any>;
}
