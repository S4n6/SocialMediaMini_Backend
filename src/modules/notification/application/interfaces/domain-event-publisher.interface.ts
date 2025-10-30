import { IDomainEvent } from '../../domain/shared/base-entity';

/**
 * Domain Event Publisher Interface
 * Used by application layer to publish domain events
 */
export interface IDomainEventPublisher {
  /**
   * Publish a single domain event
   */
  publish(event: IDomainEvent): Promise<void>;

  /**
   * Publish multiple domain events
   */
  publishAll(events: IDomainEvent[]): Promise<void>;

  /**
   * Publish events from an aggregate
   */
  publishFromAggregate(aggregate: {
    getUncommittedEvents(): IDomainEvent[];
    markEventsAsCommitted(): void;
  }): Promise<void>;
}
