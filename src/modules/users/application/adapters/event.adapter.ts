import { IDomainEvent } from '../../domain/entities/entity.base';

/**
 * Event Adapter for backward compatibility
 * Converts domain events to infrastructure event format
 */
export class DomainEventAdapter {
  /**
   * Convert IDomainEvent to legacy DomainEvent format
   */
  static adapt(domainEvent: IDomainEvent): any {
    return {
      eventId: `${domainEvent.aggregateId}-${Date.now()}`,
      aggregateId: domainEvent.aggregateId,
      eventVersion: 1,
      occurredOn: domainEvent.occurredOn,
      eventName: domainEvent.eventName,
      eventType: domainEvent.eventName,
      _isCommitted: false,

      // Additional methods that might be expected
      toJSON() {
        return {
          ...domainEvent,
          occurredOn: domainEvent.occurredOn.toISOString(),
        };
      },

      markAsCommitted() {
        this._isCommitted = true;
      },
    };
  }

  /**
   * Convert array of domain events
   */
  static adaptAll(domainEvents: IDomainEvent[]): any[] {
    return domainEvents.map((event) => this.adapt(event));
  }
}
