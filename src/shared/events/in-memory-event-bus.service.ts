import { Injectable } from '@nestjs/common';
import { IEventBus, IEventHandler } from './event-bus.interface';
import { DomainEvent } from '../domain/domain-event.base';

/**
 * Simple in-memory event bus implementation
 * For production, consider using a more robust solution like CQRS
 */
@Injectable()
export class InMemoryEventBus implements IEventBus {
  private handlers = new Map<string, IEventHandler<any>[]>();

  async publish(event: DomainEvent): Promise<void> {
    const eventType = event.constructor.name;
    const eventHandlers = this.handlers.get(eventType) || [];

    await Promise.all(eventHandlers.map((handler) => handler.handle(event)));
  }

  async publishAll(events: DomainEvent[]): Promise<void> {
    await Promise.all(events.map((event) => this.publish(event)));
  }

  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: IEventHandler<T>,
  ): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }

  unsubscribe<T extends DomainEvent>(
    eventType: string,
    handler: IEventHandler<T>,
  ): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }
}
