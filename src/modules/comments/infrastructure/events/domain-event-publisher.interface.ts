/**
 * Domain Event Publisher Interface
 *
 * Defines the contract for publishing domain events
 * This interface is implemented by infrastructure layer
 */

export interface IDomainEventPublisher {
  /**
   * Publish a single domain event
   */
  publish<T>(event: T): Promise<void>;

  /**
   * Publish multiple domain events
   */
  publishAll<T>(events: T[]): Promise<void>;

  /**
   * Subscribe to domain events
   */
  subscribe<T>(eventType: string, handler: (event: T) => Promise<void>): void;
}
