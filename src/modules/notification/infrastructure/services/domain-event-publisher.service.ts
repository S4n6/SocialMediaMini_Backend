import { Injectable, Logger } from '@nestjs/common';

import { IDomainEvent } from '../../domain/shared/base-entity';
import { IDomainEventPublisher } from '../../application/interfaces/domain-event-publisher.interface';

/**
 * Simple Domain Event Publisher implementation
 * For now, just logs events - can be extended to use message queues, webhooks etc.
 */
@Injectable()
export class DomainEventPublisher implements IDomainEventPublisher {
  private readonly logger = new Logger(DomainEventPublisher.name);

  async publish(event: IDomainEvent): Promise<void> {
    // For now, just log the event - can be extended later
    this.logger.log(`Publishing domain event: ${event.eventName}`, {
      aggregateId: event.aggregateId,
      eventName: event.eventName,
      occurredOn: event.occurredOn,
      eventData: event.eventData,
    });

    // TODO: Implement actual event publishing (message queue, webhooks, etc.)
  }

  async publishAll(events: IDomainEvent[]): Promise<void> {
    // Publish all events in parallel
    await Promise.all(events.map((event) => this.publish(event)));
  }

  async publishFromAggregate(aggregate: {
    getUncommittedEvents(): IDomainEvent[];
    markEventsAsCommitted(): void;
  }): Promise<void> {
    const events = aggregate.getUncommittedEvents();

    if (events.length === 0) {
      return;
    }

    // Publish all uncommitted events
    await this.publishAll(events);

    // Mark events as committed
    aggregate.markEventsAsCommitted();
  }
}
