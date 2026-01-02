import { IWebSocketEvent, WebSocketEventType } from './websocket-event.types';

// Re-export for convenience
export { IWebSocketEvent, WebSocketEventType } from './websocket-event.types';

/**
 * WebSocket Event Handler Interface
 * All feature modules should implement this to handle WebSocket events
 */
export interface IWebSocketEventHandler {
  /**
   * The event type this handler is interested in
   */
  readonly eventType: WebSocketEventType;

  /**
   * Handle the WebSocket event
   */
  handle(event: IWebSocketEvent): Promise<void>;
}

/**
 * WebSocket Event Emitter Interface
 * Service for emitting events to connected clients
 */
export interface IWebSocketEventEmitter {
  /**
   * Emit event to specific user
   */
  emitToUser(userId: string, event: IWebSocketEvent): Promise<void>;

  /**
   * Emit event to specific room
   */
  emitToRoom(roomId: string, event: IWebSocketEvent): Promise<void>;

  /**
   * Emit event to multiple users
   */
  emitToUsers(userIds: string[], event: IWebSocketEvent): Promise<void>;

  /**
   * Broadcast event to all connected clients
   */
  broadcast(event: IWebSocketEvent): Promise<void>;
}
