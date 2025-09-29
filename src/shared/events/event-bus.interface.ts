import { DomainEvent } from '../domain/domain-event.base';

/**
 * Event handler interface for domain events
 */
export interface IEventHandler<T extends DomainEvent> {
  handle(event: T): Promise<void>;
}

/**
 * Event bus interface for publishing and subscribing to domain events
 */
export interface IEventBus {
  /**
   * Publish a domain event
   */
  publish(event: DomainEvent): Promise<void>;

  /**
   * Publish multiple domain events
   */
  publishAll(events: DomainEvent[]): Promise<void>;

  /**
   * Subscribe to a specific event type
   */
  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: IEventHandler<T>,
  ): void;

  /**
   * Unsubscribe from an event type
   */
  unsubscribe<T extends DomainEvent>(
    eventType: string,
    handler: IEventHandler<T>,
  ): void;
}

/**
 * Event store interface for persisting domain events
 */
export interface IEventStore {
  /**
   * Append events to the event stream
   */
  appendEvents(streamId: string, events: DomainEvent[]): Promise<void>;

  /**
   * Get events from a stream
   */
  getEvents(streamId: string, fromVersion?: number): Promise<DomainEvent[]>;

  /**
   * Get all events of a specific type
   */
  getEventsByType(eventType: string): Promise<DomainEvent[]>;
}
