import { SetMetadata } from '@nestjs/common';

/**
 * Decorator metadata keys
 */
export const WEBSOCKET_HANDLER_METADATA = 'websocketHandler';
export const WEBSOCKET_MODULE_METADATA = 'websocketModule';

/**
 * Interface for handler registration metadata
 */
export interface WebSocketHandlerMetadata {
  eventName: string;
  priority?: number;
  middleware?: string[];
  description?: string;
}

/**
 * Interface for module registration metadata
 */
export interface WebSocketModuleMetadata {
  moduleName: string;
  priority?: number;
  autoRegister?: boolean;
}

/**
 * Decorator to mark a class as a WebSocket handler
 *
 * @example
 * ```typescript
 * @WebSocketHandler({
 *   eventName: 'notification:mark_read',
 *   priority: 1,
 *   middleware: ['auth', 'rateLimit']
 * })
 * export class NotificationMarkReadHandler extends BaseWebSocketHandler {
 *   // implementation
 * }
 * ```
 */
export const WebSocketHandler = (metadata: WebSocketHandlerMetadata) => {
  return (target: any) => {
    SetMetadata(WEBSOCKET_HANDLER_METADATA, metadata)(target);

    // Store the event name on the prototype for easy access
    target.prototype.eventName = metadata.eventName;

    return target;
  };
};

/**
 * Decorator to mark a module as providing WebSocket handlers
 *
 * @example
 * ```typescript
 * @WebSocketModule({
 *   moduleName: 'notification',
 *   priority: 1,
 *   autoRegister: true
 * })
 * @Module({
 *   // module configuration
 * })
 * export class NotificationModule implements OnModuleInit {
 *   // implementation
 * }
 * ```
 */
export const WebSocketModule = (metadata: WebSocketModuleMetadata) => {
  return (target: any) => {
    SetMetadata(WEBSOCKET_MODULE_METADATA, metadata)(target);
    return target;
  };
};

/**
 * Decorator to mark a method as a WebSocket event handler
 * Can be used as an alternative to class-based handlers
 *
 * @example
 * ```typescript
 * export class NotificationService {
 *   @WebSocketEvent('notification:mark_read')
 *   async markAsRead(client: Socket, payload: any) {
 *     // implementation
 *   }
 * }
 * ```
 */
export const WebSocketEvent = (
  eventName: string,
  options?: {
    priority?: number;
    middleware?: string[];
  },
) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const metadata = {
      eventName,
      methodName: propertyKey,
      priority: options?.priority || 0,
      middleware: options?.middleware || [],
    };

    // Store metadata on the method
    SetMetadata('websocketEvent', metadata)(target, propertyKey, descriptor);

    return descriptor;
  };
};

/**
 * Decorator for WebSocket middleware
 *
 * @example
 * ```typescript
 * @WebSocketMiddleware('auth')
 * export class AuthMiddleware {
 *   async use(client: Socket, data: any, next: Function) {
 *     // middleware logic
 *   }
 * }
 * ```
 */
export const WebSocketMiddleware = (name: string) => {
  return (target: any) => {
    SetMetadata('websocketMiddleware', { name })(target);
    return target;
  };
};

/**
 * Decorator to inject WebSocket gateway into services
 *
 * @example
 * ```typescript
 * export class NotificationService {
 *   constructor(
 *     @InjectWebSocketGateway()
 *     private readonly webSocketGateway: MainWebSocketGateway
 *   ) {}
 * }
 * ```
 */
export const InjectWebSocketGateway = () => {
  return (
    target: any,
    propertyKey: string | symbol | undefined,
    parameterIndex: number,
  ) => {
    SetMetadata('injectWebSocketGateway', { parameterIndex })(target);
  };
};

/**
 * Decorator to validate WebSocket event payload
 *
 * @example
 * ```typescript
 * @WebSocketHandler({ eventName: 'notification:mark_read' })
 * export class NotificationMarkReadHandler extends BaseWebSocketHandler {
 *   @ValidatePayload(MarkReadDto)
 *   async handleEvent(client: Socket, payload: MarkReadDto) {
 *     // payload is automatically validated
 *   }
 * }
 * ```
 */
export const ValidatePayload = (dtoClass: any) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const metadata = { dtoClass };
    SetMetadata('validatePayload', metadata)(target, propertyKey, descriptor);
    return descriptor;
  };
};

/**
 * Decorator to require authentication for WebSocket handler
 *
 * @example
 * ```typescript
 * @WebSocketHandler({ eventName: 'posts:like' })
 * export class PostLikeHandler extends BaseWebSocketHandler {
 *   @RequireAuth()
 *   async handleEvent(client: Socket, payload: any) {
 *     // user is guaranteed to be authenticated
 *   }
 * }
 * ```
 */
export const RequireAuth = (roles?: string[]) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const metadata = { required: true, roles: roles || [] };
    SetMetadata('requireAuth', metadata)(target, propertyKey, descriptor);
    return descriptor;
  };
};

/**
 * Decorator to add rate limiting to WebSocket handler
 *
 * @example
 * ```typescript
 * @WebSocketHandler({ eventName: 'messaging:send' })
 * export class MessageSendHandler extends BaseWebSocketHandler {
 *   @RateLimit({ max: 10, windowMs: 60000 }) // 10 per minute
 *   async handleEvent(client: Socket, payload: any) {
 *     // rate limited
 *   }
 * }
 * ```
 */
export const RateLimit = (options: { max: number; windowMs: number }) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    SetMetadata('rateLimit', options)(target, propertyKey, descriptor);
    return descriptor;
  };
};

/**
 * Decorator to require room access permission
 *
 * @example
 * ```typescript
 * @WebSocketHandler({ eventName: 'conversation:send_message' })
 * export class ConversationMessageHandler extends BaseWebSocketHandler {
 *   @RequireRoomAccess('conversation')
 *   async handleEvent(client: Socket, payload: { conversationId: string, message: string }) {
 *     // user has access to the conversation
 *   }
 * }
 * ```
 */
export const RequireRoomAccess = (roomType: string) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const metadata = { roomType };
    SetMetadata('requireRoomAccess', metadata)(target, propertyKey, descriptor);
    return descriptor;
  };
};
