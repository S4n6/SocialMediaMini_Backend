import { Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { IWebSocketHandler } from '../interfaces';
import { WebSocketResponseDto } from '../../dto';
import { WEBSOCKET_ERRORS, WEBSOCKET_ERROR_MESSAGES } from '../../constants';

export abstract class BaseWebSocketHandler implements IWebSocketHandler {
  protected readonly logger: Logger;

  constructor(
    public readonly eventName: string,
    protected readonly moduleName: string = 'unknown',
  ) {
    this.logger = new Logger(`${this.constructor.name} (${moduleName})`);
  }

  /**
   * Main handler method - calls the implemented handleEvent method with error handling
   */
  async handle(client: Socket, payload: any): Promise<void> {
    const startTime = Date.now();
    let requestId: string | undefined;

    try {
      // Extract request ID if available
      requestId = payload?.requestId || this.generateRequestId();

      // Log incoming event
      this.logger.debug(
        `Handling event ${this.eventName} for socket ${client.id} (requestId: ${requestId})`,
      );

      // Validate payload if validation method is implemented
      if (this.validatePayload && !this.validatePayload(payload)) {
        await this.sendErrorResponse(
          client,
          WEBSOCKET_ERRORS.INVALID_PAYLOAD,
          'Payload validation failed',
          requestId,
        );
        return;
      }

      // Check permissions if permission check is implemented
      if (
        this.checkPermission &&
        !(await this.checkPermission(client, payload))
      ) {
        await this.sendErrorResponse(
          client,
          WEBSOCKET_ERRORS.UNAUTHORIZED,
          'Insufficient permissions',
          requestId,
        );
        return;
      }

      // Execute the actual handler logic
      await this.handleEvent(client, payload, requestId);

      // Log successful completion
      const duration = Date.now() - startTime;
      this.logger.debug(
        `Event ${this.eventName} handled successfully in ${duration}ms (requestId: ${requestId})`,
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `Error handling event ${this.eventName} for socket ${client.id} after ${duration}ms (requestId: ${requestId}): ${error.message}`,
        error.stack,
      );

      await this.sendErrorResponse(
        client,
        WEBSOCKET_ERRORS.HANDLER_ERROR,
        error.message || 'Internal handler error',
        requestId,
        { originalError: error.name },
      );
    }
  }

  /**
   * Abstract method that must be implemented by subclasses
   */
  protected abstract handleEvent(
    client: Socket,
    payload: any,
    requestId?: string,
  ): Promise<void>;

  /**
   * Optional payload validation - override in subclasses if needed
   */
  validatePayload?(payload: any): boolean;

  /**
   * Optional permission check - override in subclasses if needed
   */
  checkPermission?(client: Socket, payload: any): Promise<boolean>;

  /**
   * Helper method to send success response to client
   */
  protected async sendSuccessResponse(
    client: Socket,
    data?: any,
    requestId?: string,
  ): Promise<void> {
    try {
      const response = WebSocketResponseDto.success(data, requestId);
      client.emit(`${this.eventName}:response`, response.toJSON());
    } catch (error) {
      this.logger.error(
        `Failed to send success response: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Helper method to send error response to client
   */
  protected async sendErrorResponse(
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
          ] ||
          'Unknown error',
        details,
        requestId,
      );
      client.emit(`${this.eventName}:error`, response.toJSON());
    } catch (error) {
      this.logger.error(
        `Failed to send error response: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Helper method to send acknowledgment
   */
  protected async sendAcknowledgment(
    client: Socket,
    requestId?: string,
  ): Promise<void> {
    try {
      client.emit(`${this.eventName}:ack`, {
        acknowledged: true,
        requestId,
        timestamp: Date.now(),
      });
    } catch (error) {
      this.logger.error(
        `Failed to send acknowledgment: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Helper method to broadcast to room
   */
  protected async broadcastToRoom(
    client: Socket,
    roomId: string,
    event: string,
    data: any,
    excludeSelf: boolean = true,
  ): Promise<void> {
    try {
      if (excludeSelf) {
        client.to(roomId).emit(event, data);
      } else {
        client.nsp.to(roomId).emit(event, data);
      }

      this.logger.debug(`Broadcasted ${event} to room ${roomId}`);
    } catch (error) {
      this.logger.error(
        `Failed to broadcast to room ${roomId}: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Helper method to get user from authenticated socket
   */
  protected getUserFromSocket(client: Socket): any {
    return (client as any).user || null;
  }

  /**
   * Helper method to get user ID from authenticated socket
   */
  protected getUserIdFromSocket(client: Socket): string | null {
    const user = this.getUserFromSocket(client);
    return user?.id || (client as any).userId || null;
  }

  /**
   * Helper method to validate required fields in payload
   */
  protected validateRequiredFields(
    payload: any,
    requiredFields: string[],
  ): boolean {
    if (!payload || typeof payload !== 'object') {
      return false;
    }

    for (const field of requiredFields) {
      if (
        !(field in payload) ||
        payload[field] === undefined ||
        payload[field] === null
      ) {
        this.logger.warn(`Missing required field: ${field}`);
        return false;
      }
    }

    return true;
  }

  /**
   * Helper method to sanitize input data
   */
  protected sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      return input.trim();
    }

    if (Array.isArray(input)) {
      return input.map((item) => this.sanitizeInput(item));
    }

    if (input && typeof input === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[key] = this.sanitizeInput(value);
      }
      return sanitized;
    }

    return input;
  }

  /**
   * Generate a unique request ID
   */
  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get handler metadata for debugging
   */
  getHandlerInfo() {
    return {
      eventName: this.eventName,
      moduleName: this.moduleName,
      className: this.constructor.name,
      hasValidation: !!this.validatePayload,
      hasPermissionCheck: !!this.checkPermission,
    };
  }
}
