// Core
export { MainGateway as MainWebSocketGateway } from './core/websocket.gateway';
export * from './core/connection-manager.service';
export * from './core/room-manager.service';
export * from './core/websocket-auth.service';
export * from './core/presence.service';

// Interfaces & types
export type {
  AuthenticatedSocket,
  AuthenticatedUser,
} from './core/interfaces/websocket-auth.interface';

// Events
export * from './events';

// Constants (excluding WebSocketEventType to avoid conflict with events/websocket-event.types.ts)
export {
  WEBSOCKET_CONFIG,
  WEBSOCKET_NAMESPACES,
  WEBSOCKET_EVENTS,
  WEBSOCKET_ROOMS,
  WEBSOCKET_ERRORS,
  WEBSOCKET_ERROR_MESSAGES,
  ROOM_TYPES,
  type WebSocketRoomType,
  type WebSocketEvent,
  type WebSocketErrorCode,
} from './constants';

// Guards
export * from './guards';

// Adapters
export * from './adapters';

// Module
export * from './websocket.module';
