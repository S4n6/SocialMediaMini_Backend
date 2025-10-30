import { Injectable, Logger } from '@nestjs/common';
import { IWebSocketHandler, IWebSocketHandlerRegistry } from '../interfaces';

@Injectable()
export class WebSocketHandlerRegistry implements IWebSocketHandlerRegistry {
  private readonly logger = new Logger(WebSocketHandlerRegistry.name);
  private handlers = new Map<string, IWebSocketHandler>();
  private handlerMetadata = new Map<
    string,
    {
      module: string;
      priority: number;
      registeredAt: Date;
      middleware?: string[];
    }
  >();

  register(
    handler: IWebSocketHandler,
    metadata?: {
      module?: string;
      priority?: number;
      middleware?: string[];
    },
  ): void {
    try {
      if (this.handlers.has(handler.eventName)) {
        this.logger.warn(
          `Handler for event '${handler.eventName}' already exists. Overriding...`,
        );
      }

      this.handlers.set(handler.eventName, handler);
      this.handlerMetadata.set(handler.eventName, {
        module: metadata?.module || 'unknown',
        priority: metadata?.priority || 0,
        middleware: metadata?.middleware || [],
        registeredAt: new Date(),
      });

      this.logger.log(
        `Handler registered for event: ${handler.eventName} (module: ${metadata?.module || 'unknown'})`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to register handler for ${handler.eventName}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  unregister(eventName: string): void {
    try {
      const wasRemoved = this.handlers.delete(eventName);
      this.handlerMetadata.delete(eventName);

      if (wasRemoved) {
        this.logger.log(`Handler unregistered for event: ${eventName}`);
      } else {
        this.logger.warn(
          `Attempted to unregister non-existent handler: ${eventName}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to unregister handler for ${eventName}: ${error.message}`,
        error.stack,
      );
    }
  }

  getHandler(eventName: string): IWebSocketHandler | undefined {
    return this.handlers.get(eventName);
  }

  getAllHandlers(): Map<string, IWebSocketHandler> {
    return new Map(this.handlers);
  }

  hasHandler(eventName: string): boolean {
    return this.handlers.has(eventName);
  }

  getEventNames(): string[] {
    return Array.from(this.handlers.keys());
  }

  registerMany(
    handlers: IWebSocketHandler[],
    metadata?: {
      module?: string;
      priority?: number;
      middleware?: string[];
    },
  ): void {
    try {
      for (const handler of handlers) {
        this.register(handler, metadata);
      }

      this.logger.log(
        `Registered ${handlers.length} handlers from module: ${metadata?.module || 'unknown'}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to register multiple handlers: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  clear(): void {
    try {
      const handlerCount = this.handlers.size;
      this.handlers.clear();
      this.handlerMetadata.clear();

      this.logger.log(`Cleared ${handlerCount} handlers from registry`);
    } catch (error) {
      this.logger.error(
        `Failed to clear handlers: ${error.message}`,
        error.stack,
      );
    }
  }

  // Additional utility methods

  getHandlersByModule(moduleName: string): Map<string, IWebSocketHandler> {
    const moduleHandlers = new Map<string, IWebSocketHandler>();

    for (const [eventName, handler] of this.handlers.entries()) {
      const metadata = this.handlerMetadata.get(eventName);
      if (metadata?.module === moduleName) {
        moduleHandlers.set(eventName, handler);
      }
    }

    return moduleHandlers;
  }

  getHandlerMetadata(eventName: string) {
    return this.handlerMetadata.get(eventName);
  }

  getAllHandlerMetadata() {
    const metadata: Array<{
      eventName: string;
      module: string;
      priority: number;
      registeredAt: Date;
      middleware: string[];
    }> = [];

    for (const [eventName, data] of this.handlerMetadata.entries()) {
      metadata.push({
        eventName,
        module: data.module,
        priority: data.priority,
        registeredAt: data.registeredAt,
        middleware: data.middleware || [],
      });
    }

    // Sort by priority (higher priority first)
    return metadata.sort((a, b) => b.priority - a.priority);
  }

  getHandlerStats() {
    const stats = {
      totalHandlers: this.handlers.size,
      moduleBreakdown: new Map<string, number>(),
      registrationOrder: [] as Array<{ eventName: string; registeredAt: Date }>,
    };

    for (const [eventName, metadata] of this.handlerMetadata.entries()) {
      // Module breakdown
      const currentCount = stats.moduleBreakdown.get(metadata.module) || 0;
      stats.moduleBreakdown.set(metadata.module, currentCount + 1);

      // Registration order
      stats.registrationOrder.push({
        eventName,
        registeredAt: metadata.registeredAt,
      });
    }

    // Sort registration order by date
    stats.registrationOrder.sort(
      (a, b) => a.registeredAt.getTime() - b.registeredAt.getTime(),
    );

    return stats;
  }

  // Validation methods

  validateHandler(handler: IWebSocketHandler): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!handler.eventName || typeof handler.eventName !== 'string') {
      errors.push('Handler must have a valid eventName');
    }

    if (!handler.handle || typeof handler.handle !== 'function') {
      errors.push('Handler must have a handle method');
    }

    if (handler.eventName && handler.eventName.length === 0) {
      errors.push('Event name cannot be empty');
    }

    if (handler.eventName && handler.eventName.length > 100) {
      errors.push('Event name is too long (max 100 characters)');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  validateAndRegister(
    handler: IWebSocketHandler,
    metadata?: {
      module?: string;
      priority?: number;
      middleware?: string[];
    },
  ): boolean {
    const validation = this.validateHandler(handler);

    if (!validation.isValid) {
      this.logger.error(
        `Handler validation failed for ${handler.eventName}: ${validation.errors.join(', ')}`,
      );
      return false;
    }

    try {
      this.register(handler, metadata);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to register validated handler: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }

  // Debug and monitoring methods

  logRegistryState(): void {
    const stats = this.getHandlerStats();
    const metadata = this.getAllHandlerMetadata();

    this.logger.log('=== WebSocket Handler Registry State ===');
    this.logger.log(`Total handlers: ${stats.totalHandlers}`);

    this.logger.log('Module breakdown:');
    for (const [module, count] of stats.moduleBreakdown.entries()) {
      this.logger.log(`  ${module}: ${count} handlers`);
    }

    this.logger.log('Registered handlers:');
    for (const handler of metadata) {
      this.logger.log(
        `  ${handler.eventName} (${handler.module}, priority: ${handler.priority})`,
      );
    }
    this.logger.log('=== End Registry State ===');
  }
}
