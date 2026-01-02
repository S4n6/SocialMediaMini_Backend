import { Socket } from 'socket.io';

export interface IWebSocketHandler {
  /**
   * The event name this handler responds to
   */
  readonly eventName: string;

  /**
   * Handle the WebSocket event
   */
  handle(client: Socket, payload: any): Promise<void> | void;

  /**
   * Optional: Validate the payload before handling
   */
  validatePayload?(payload: any): boolean;

  /**
   * Optional: Check if user has permission to execute this handler
   */
  checkPermission?(client: Socket, payload: any): Promise<boolean>;
}

export interface IWebSocketHandlerRegistry {
  /**
   * Register a new handler
   */
  register(handler: IWebSocketHandler): void;

  /**
   * Unregister a handler by event name
   */
  unregister(eventName: string): void;

  /**
   * Get handler by event name
   */
  getHandler(eventName: string): IWebSocketHandler | undefined;

  /**
   * Get all registered handlers
   */
  getAllHandlers(): Map<string, IWebSocketHandler>;

  /**
   * Check if handler exists
   */
  hasHandler(eventName: string): boolean;

  /**
   * Get all event names
   */
  getEventNames(): string[];

  /**
   * Register multiple handlers at once
   */
  registerMany(handlers: IWebSocketHandler[]): void;

  /**
   * Clear all handlers
   */
  clear(): void;
}

export interface HandlerExecutionContext {
  client: Socket;
  payload: any;
  eventName: string;
  timestamp: Date;
  requestId?: string;
}
