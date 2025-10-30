// Main WebSocket module index - Re-export everything
export * from './constants';
export * from './dto';
export * from './domain/entities';
export * from './application/interfaces';
export * from './application/services';
export * from './application/handlers';

// Re-export decorators with explicit naming to avoid conflicts
export {
  WebSocketHandler,
  WebSocketEvent as WebSocketEventDecorator,
  WebSocketModule as WebSocketModuleDecorator,
  WebSocketMiddleware as WebSocketMiddlewareDecorator,
  InjectWebSocketGateway,
  ValidatePayload,
  RequireAuth,
  RateLimit as RateLimitDecorator,
  RequireRoomAccess,
  WEBSOCKET_HANDLER_METADATA,
  WEBSOCKET_MODULE_METADATA,
  type WebSocketHandlerMetadata,
  type WebSocketModuleMetadata,
} from './decorators';

// Main module and gateway
export { WebSocketModule } from './websocket.module';
export { MainWebSocketGateway } from './websocket.gateway';

// Re-export types with explicit naming to avoid conflicts
export type {
  AuthenticatedSocket,
  ConnectionMetadata,
  ConnectionStats,
  RoomStats,
  NotificationEventPayload,
  MessagingEventPayload,
  PostsEventPayload,
  WebSocketEventPayload,
  WebSocketModuleConfig,
  HandlerConfig,
  RateLimit,
  WebSocketMiddleware,
  WebSocketError,
  HealthStatus,
} from './types';
