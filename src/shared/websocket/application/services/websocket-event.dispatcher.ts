import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import {
  WebSocketHandlerRegistry,
  ConnectionManagerService,
  WebSocketAuthService,
} from '../services';
import { WebSocketResponseDto, WebSocketEventDto } from '../../dto';
import {
  WEBSOCKET_ERRORS,
  WEBSOCKET_ERROR_MESSAGES,
  WEBSOCKET_CONFIG,
} from '../../constants';

@Injectable()
export class WebSocketEventDispatcher {
  private readonly logger = new Logger(WebSocketEventDispatcher.name);
  private rateLimitMap = new Map<
    string,
    { count: number; resetTime: number }
  >();

  constructor(
    private readonly handlerRegistry: WebSocketHandlerRegistry,
    private readonly connectionManager: ConnectionManagerService,
    private readonly authService: WebSocketAuthService,
  ) {
    this.startRateLimitCleanup();
  }

  /**
   * Dispatch incoming WebSocket event to appropriate handler
   */
  async dispatchEvent(client: Socket, eventData: any): Promise<void> {
    const startTime = Date.now();
    let eventName: string | undefined;
    let requestId: string | undefined;

    try {
      // Validate event structure
      const validationResult = this.validateEventData(eventData);
      if (!validationResult.isValid) {
        await this.sendErrorToClient(
          client,
          WEBSOCKET_ERRORS.INVALID_PAYLOAD,
          validationResult.error || 'Invalid event data',
        );
        return;
      }

      eventName = eventData.event;
      requestId = eventData.requestId;

      // Rate limiting check
      if (!(await this.checkRateLimit(client))) {
        await this.sendErrorToClient(
          client,
          WEBSOCKET_ERRORS.RATE_LIMIT_EXCEEDED,
          'Rate limit exceeded',
          requestId,
        );
        return;
      }

      // Update connection activity
      await this.connectionManager.updateConnectionActivity(client.id);

      // Get handler for event
      const handler = this.handlerRegistry.getHandler(eventName!);
      if (!handler) {
        this.logger.warn(
          `No handler found for event: ${eventName} from socket ${client.id}`,
        );
        await this.sendErrorToClient(
          client,
          WEBSOCKET_ERRORS.HANDLER_NOT_FOUND,
          `No handler found for event: ${eventName}`,
          requestId,
        );
        return;
      }

      this.logger.debug(
        `Dispatching event ${eventName} to handler for socket ${client.id}`,
      );

      // Execute handler
      await handler.handle(client, eventData.payload);

      // Log successful dispatch
      const duration = Date.now() - startTime;
      this.logger.debug(
        `Event ${eventName} dispatched successfully in ${duration}ms`,
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `Error dispatching event ${eventName || 'unknown'} for socket ${client.id} after ${duration}ms: ${error.message}`,
        error.stack,
      );

      await this.sendErrorToClient(
        client,
        WEBSOCKET_ERRORS.INTERNAL_ERROR,
        'Internal server error',
        requestId,
        { errorType: error.name },
      );
    }
  }

  /**
   * Handle client connection
   */
  async handleConnection(client: Socket): Promise<boolean> {
    try {
      this.logger.log(`New connection attempt from socket ${client.id}`);

      // Authenticate user
      const user = await this.authService.validateConnection(client);
      if (!user) {
        this.logger.warn(`Authentication failed for socket ${client.id}`);
        return false;
      }

      // Store user info on socket
      (client as any).user = user;
      (client as any).userId = user.id;
      (client as any).isAuthenticated = true;

      // Add connection to manager
      await this.connectionManager.addConnection(user.id, client.id, {
        userAgent: client.handshake.headers['user-agent'],
        ipAddress: this.getClientIP(client),
        connectedAt: new Date(),
      });

      // Join user-specific room
      await client.join(`user:${user.id}`);

      this.logger.log(
        `User ${user.id} connected successfully with socket ${client.id}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Connection handling failed for socket ${client.id}: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }

  /**
   * Handle client disconnection
   */
  async handleDisconnection(client: Socket): Promise<void> {
    try {
      const userId = (client as any).userId;

      if (userId) {
        // Remove connection
        await this.connectionManager.removeConnection(userId, client.id);
        this.logger.log(`User ${userId} disconnected from socket ${client.id}`);
      }

      // Clean up rate limiting
      this.rateLimitMap.delete(client.id);
    } catch (error) {
      this.logger.error(
        `Disconnection handling failed for socket ${client.id}: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Broadcast event to specific room
   */
  async broadcastToRoom(
    server: any,
    roomId: string,
    eventName: string,
    data: any,
    excludeSocketIds?: string[],
  ): Promise<void> {
    try {
      if (excludeSocketIds && excludeSocketIds.length > 0) {
        // Get all sockets in room and exclude specified ones
        const socketsInRoom = await server.in(roomId).allSockets();
        const targetSockets = Array.from(socketsInRoom).filter(
          (socketId) => !excludeSocketIds.includes(socketId as string),
        );

        for (const socketId of targetSockets) {
          server.to(socketId).emit(eventName, data);
        }
      } else {
        server.to(roomId).emit(eventName, data);
      }

      this.logger.debug(`Broadcasted ${eventName} to room ${roomId}`);
    } catch (error) {
      this.logger.error(
        `Failed to broadcast to room ${roomId}: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Broadcast event to specific user (all their connections)
   */
  async broadcastToUser(
    server: any,
    userId: string,
    eventName: string,
    data: any,
  ): Promise<void> {
    try {
      const socketIds = await this.connectionManager.getSocketsByUserId(userId);

      for (const socketId of socketIds) {
        server.to(socketId).emit(eventName, data);
      }

      this.logger.debug(
        `Broadcasted ${eventName} to user ${userId} (${socketIds.length} connections)`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to broadcast to user ${userId}: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Get dispatcher statistics
   */
  getStats() {
    return {
      rateLimitEntries: this.rateLimitMap.size,
      registeredHandlers: this.handlerRegistry.getEventNames().length,
      lastUpdated: new Date(),
    };
  }

  private validateEventData(eventData: any): {
    isValid: boolean;
    error?: string;
  } {
    if (!eventData || typeof eventData !== 'object') {
      return { isValid: false, error: 'Event data must be an object' };
    }

    if (!eventData.event || typeof eventData.event !== 'string') {
      return {
        isValid: false,
        error: 'Event name is required and must be a string',
      };
    }

    if (eventData.event.length > WEBSOCKET_CONFIG.MAX_EVENT_NAME_LENGTH) {
      return { isValid: false, error: 'Event name is too long' };
    }

    return { isValid: true };
  }

  private async checkRateLimit(client: Socket): Promise<boolean> {
    try {
      const now = Date.now();
      const windowMs = 60 * 1000; // 1 minute
      const maxRequests = WEBSOCKET_CONFIG.MAX_EVENTS_PER_MINUTE;

      const userId = (client as any).userId || client.id;
      const key = `rate_limit:${userId}`;

      let rateLimitData = this.rateLimitMap.get(key);

      if (!rateLimitData || now > rateLimitData.resetTime) {
        // Reset or create new rate limit window
        rateLimitData = {
          count: 1,
          resetTime: now + windowMs,
        };
        this.rateLimitMap.set(key, rateLimitData);
        return true;
      }

      if (rateLimitData.count >= maxRequests) {
        return false;
      }

      rateLimitData.count++;
      return true;
    } catch (error) {
      this.logger.error(
        `Rate limit check failed: ${error.message}`,
        error.stack,
      );
      return true; // Allow on error to avoid blocking legitimate requests
    }
  }

  private async sendErrorToClient(
    client: Socket,
    errorCode: string,
    message: string,
    requestId?: string,
    details?: any,
  ): Promise<void> {
    try {
      const response = WebSocketResponseDto.error(
        errorCode as any,
        message ||
          WEBSOCKET_ERROR_MESSAGES[
            errorCode as keyof typeof WEBSOCKET_ERROR_MESSAGES
          ],
        details,
        requestId,
      );

      client.emit('error', response.toJSON());
    } catch (error) {
      this.logger.error(
        `Failed to send error to client: ${error.message}`,
        error.stack,
      );
    }
  }

  private getClientIP(client: Socket): string {
    return (client.handshake.headers['x-forwarded-for'] ||
      client.handshake.headers['x-real-ip'] ||
      client.handshake.address ||
      'unknown') as string;
  }

  private startRateLimitCleanup(): void {
    setInterval(
      () => {
        const now = Date.now();
        let cleanedCount = 0;

        for (const [key, data] of this.rateLimitMap.entries()) {
          if (now > data.resetTime) {
            this.rateLimitMap.delete(key);
            cleanedCount++;
          }
        }

        if (cleanedCount > 0) {
          this.logger.debug(
            `Cleaned up ${cleanedCount} expired rate limit entries`,
          );
        }
      },
      5 * 60 * 1000,
    ); // Clean up every 5 minutes
  }

  onModuleDestroy() {
    this.rateLimitMap.clear();
    this.logger.log('Event dispatcher cleanup completed');
  }
}
