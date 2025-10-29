import { Injectable, Logger } from '@nestjs/common';
import { DomainEvent } from '../../../../shared/domain';

export interface IEventPublisherAdapter {
  publishEvent(event: DomainEvent): Promise<void>;
  publishEventAsync(event: DomainEvent, delay?: number): Promise<void>;
  publishBatch(events: DomainEvent[]): Promise<void>;
  scheduleEvent(event: DomainEvent, scheduleTime: Date): Promise<void>;
  registerEventHandler(
    eventType: string,
    handler: (event: DomainEvent) => Promise<void>,
  ): void;
}

export interface EventJobData {
  eventType: string;
  eventData: any;
  timestamp: Date;
  retryCount: number;
  metadata?: Record<string, any>;
}

// Simple event storage for demonstration
interface PendingEvent {
  event: DomainEvent;
  scheduleTime?: Date;
  retryCount: number;
}

@Injectable()
export class EventPublisherAdapter implements IEventPublisherAdapter {
  private readonly logger = new Logger(EventPublisherAdapter.name);
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // ms
  private readonly BATCH_SIZE = 100;
  private readonly pendingEvents: PendingEvent[] = [];
  private readonly eventHandlers = new Map<
    string,
    ((event: DomainEvent) => Promise<void>)[]
  >();
  private schedulerInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Initialize periodic processing for scheduled events
    this.startScheduledEventProcessor();
  }

  registerEventHandler(
    eventType: string,
    handler: (event: DomainEvent) => Promise<void>,
  ): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
    this.logger.debug(`Event handler registered for: ${eventType}`);
  }

  private startScheduledEventProcessor(): void {
    // Process scheduled events every 5 seconds
    this.schedulerInterval = setInterval(async () => {
      await this.processScheduledEvents();
    }, 5000);
  }

  private async processScheduledEvents(): Promise<void> {
    const now = new Date();
    const readyEvents = this.pendingEvents.filter(
      (pe) => pe.scheduleTime && pe.scheduleTime <= now,
    );

    for (const pendingEvent of readyEvents) {
      try {
        await this.processEvent(pendingEvent);
        this.removePendingEvent(pendingEvent);
      } catch (error) {
        this.logger.error(
          `Failed to process scheduled event: ${pendingEvent.event.eventType}`,
          error instanceof Error ? error.stack : error,
        );

        if (pendingEvent.retryCount < this.MAX_RETRIES) {
          pendingEvent.retryCount++;
          pendingEvent.scheduleTime = new Date(
            now.getTime() + this.RETRY_DELAY * pendingEvent.retryCount,
          );
        } else {
          this.removePendingEvent(pendingEvent);
          this.logger.error(
            `Event processing failed after max retries: ${pendingEvent.event.eventType}`,
          );
        }
      }
    }
  }

  private async processEvent(pendingEvent: PendingEvent): Promise<void> {
    const handlers = this.eventHandlers.get(pendingEvent.event.eventType) || [];

    await Promise.all(
      handlers.map(async (handler) => {
        try {
          await handler(pendingEvent.event);
        } catch (error) {
          this.logger.error(
            `Event handler failed for ${pendingEvent.event.eventType}`,
            error instanceof Error ? error.stack : error,
          );
          throw error; // Rethrow for retry logic
        }
      }),
    );
  }

  private removePendingEvent(eventToRemove: PendingEvent): void {
    const index = this.pendingEvents.findIndex(
      (pe) => pe.event.eventId === eventToRemove.event.eventId,
    );
    if (index !== -1) {
      this.pendingEvents.splice(index, 1);
    }
  }

  async publishEvent(event: DomainEvent): Promise<void> {
    return this.executeWithRetry(async () => {
      // Get handlers for this event type
      const handlers = this.eventHandlers.get(event.eventType) || [];

      // Execute all handlers
      await Promise.all(
        handlers.map(async (handler) => {
          try {
            await handler(event);
          } catch (error) {
            this.logger.error(
              `Event handler failed for ${event.eventType}`,
              error instanceof Error ? error.stack : error,
            );
            // Don't rethrow - continue with other handlers
          }
        }),
      );

      this.logger.debug(`Event published synchronously: ${event.eventType}`, {
        eventId: event.eventId,
        handlersCount: handlers.length,
      });
    }, `publishEvent ${event.eventType}`);
  }

  async publishEventAsync(event: DomainEvent, delay = 0): Promise<void> {
    return this.executeWithRetry(async () => {
      const pendingEvent: PendingEvent = {
        event,
        scheduleTime: delay > 0 ? new Date(Date.now() + delay) : undefined,
        retryCount: 0,
      };

      this.pendingEvents.push(pendingEvent);

      this.logger.debug(
        `Event queued for async processing: ${event.eventType}`,
        {
          eventId: event.eventId,
          delay: delay > 0 ? `${delay}ms` : 'immediate',
        },
      );

      // If no delay, process immediately
      if (delay === 0) {
        await this.processEvent(pendingEvent);
        this.removePendingEvent(pendingEvent);
      }
    }, `publishEventAsync ${event.eventType}`);
  }

  async publishBatch(events: DomainEvent[]): Promise<void> {
    if (events.length === 0) {
      return;
    }

    return this.executeWithRetry(async () => {
      // Process in batches to avoid overwhelming the system
      const batches = this.chunkArray(events, this.BATCH_SIZE);

      for (const batch of batches) {
        const promises = batch.map((event) => this.publishEvent(event));
        await Promise.all(promises);
      }

      this.logger.debug(`Batch of ${events.length} events processed`, {
        totalEvents: events.length,
        batches: batches.length,
        eventTypes: [...new Set(events.map((e) => e.eventType))],
      });
    }, `publishBatch (${events.length} events)`);
  }

  async scheduleEvent(event: DomainEvent, scheduleTime: Date): Promise<void> {
    return this.executeWithRetry(async () => {
      const pendingEvent: PendingEvent = {
        event,
        scheduleTime,
        retryCount: 0,
      };

      this.pendingEvents.push(pendingEvent);

      this.logger.debug(`Event scheduled for: ${scheduleTime.toISOString()}`, {
        eventType: event.eventType,
        eventId: event.eventId,
        delay: `${scheduleTime.getTime() - Date.now()}ms`,
      });
    }, `scheduleEvent ${event.eventType}`);
  }

  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt === this.MAX_RETRIES) {
          this.logger.error(
            `Event operation failed after ${this.MAX_RETRIES} attempts: ${operationName}`,
            lastError.stack,
          );
          throw lastError;
        }

        this.logger.warn(
          `Event operation failed (attempt ${attempt}/${this.MAX_RETRIES}): ${operationName}. Retrying...`,
          lastError.message,
        );

        await this.delay(this.RETRY_DELAY * attempt);
      }
    }

    throw (
      lastError ||
      new Error(`Unknown error in event operation: ${operationName}`)
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getEventPriority(eventType: string): number {
    // Define priority based on event importance
    const priorityMap: Record<string, number> = {
      ReactionCreated: 1, // High priority - immediate notification
      ReactionRemoved: 1, // High priority - immediate notification
      ReactionStatsUpdated: 2, // Medium priority - analytics
      BulkReactionsCreated: 3, // Low priority - batch operations
      BulkReactionsRemoved: 3, // Low priority - batch operations
    };

    return priorityMap[eventType] || 2; // Default to medium priority
  }

  // Health check method
  async isHealthy(): Promise<boolean> {
    try {
      // Check if scheduler is running
      const schedulerHealthy = this.schedulerInterval !== null;

      // Check handlers registry
      const handlersHealthy = this.eventHandlers.size >= 0;

      return schedulerHealthy && handlersHealthy;
    } catch (error) {
      this.logger.error('Health check failed', error);
      return false;
    }
  }

  // Get statistics
  getStats(): {
    pendingEvents: number;
    registeredHandlers: number;
    handlerTypes: string[];
  } {
    return {
      pendingEvents: this.pendingEvents.length,
      registeredHandlers: Array.from(this.eventHandlers.values()).reduce(
        (sum, handlers) => sum + handlers.length,
        0,
      ),
      handlerTypes: Array.from(this.eventHandlers.keys()),
    };
  }

  // Cleanup method
  async cleanup(): Promise<void> {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.schedulerInterval = null;
    }

    this.pendingEvents.length = 0;
    this.eventHandlers.clear();

    this.logger.debug('Event publisher adapter cleaned up');
  }
}
