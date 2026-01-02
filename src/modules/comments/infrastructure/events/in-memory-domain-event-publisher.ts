/**
 * In-Memory Domain Event Publisher
 *
 * Simple implementation for development and testing
 * In production, this could be replaced by Redis/RabbitMQ/Kafka implementation
 */

import { Injectable, Logger } from '@nestjs/common';
import { IDomainEventPublisher } from './domain-event-publisher.interface';

type EventHandler<T = any> = (event: T) => Promise<void>;

@Injectable()
export class InMemoryDomainEventPublisher implements IDomainEventPublisher {
  private readonly logger = new Logger(InMemoryDomainEventPublisher.name);
  private readonly handlers = new Map<string, EventHandler[]>();

  /**
   * Publish a single domain event
   */
  async publish<T>(event: T): Promise<void> {
    const eventType = this.getEventType(event);
    const handlers = this.handlers.get(eventType) || [];

    this.logger.debug(
      `Publishing event ${eventType} to ${handlers.length} handlers`,
    );

    // Execute all handlers concurrently
    await Promise.allSettled(
      handlers.map(async (handler) => {
        try {
          await handler(event);
        } catch (error) {
          this.logger.error(`Error handling event ${eventType}:`, error);
          // Don't re-throw - we don't want one handler failure to affect others
        }
      }),
    );
  }

  /**
   * Publish multiple domain events
   */
  async publishAll<T>(events: T[]): Promise<void> {
    await Promise.allSettled(events.map((event) => this.publish(event)));
  }

  /**
   * Subscribe to domain events
   */
  subscribe<T>(eventType: string, handler: (event: T) => Promise<void>): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }

    this.handlers.get(eventType)!.push(handler);
    this.logger.log(`Registered handler for event type: ${eventType}`);
  }

  /**
   * Get event type from event object
   */
  private getEventType<T>(event: T): string {
    if (typeof event === 'object' && event !== null) {
      // Try to get type from constructor name
      const constructorName = (event as any).constructor?.name;
      if (constructorName && constructorName !== 'Object') {
        return constructorName;
      }

      // Try to get type from event type property
      const eventType = (event as any).type || (event as any).eventType;
      if (eventType) {
        return eventType;
      }
    }

    // Fallback to generic name
    return 'DomainEvent';
  }

  /**
   * Get statistics about registered handlers
   */
  getStats(): { eventType: string; handlerCount: number }[] {
    return Array.from(this.handlers.entries()).map(([eventType, handlers]) => ({
      eventType,
      handlerCount: handlers.length,
    }));
  }

  /**
   * Clear all handlers (useful for testing)
   */
  clearHandlers(): void {
    this.handlers.clear();
    this.logger.log('Cleared all event handlers');
  }
}
