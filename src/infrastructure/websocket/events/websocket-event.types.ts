/**
 * WebSocket Event Types
 * Defines all possible WebSocket events in the system
 */
export enum WebSocketEventType {
  // Connection events
  CONNECTION = 'connection',
  DISCONNECTION = 'disconnection',

  // Notification events
  NOTIFICATION_CREATED = 'notification:created',
  NOTIFICATION_READ = 'notification:read',
  NOTIFICATION_READ_ALL = 'notification:read_all',

  // Messaging (Chat) events
  MESSAGE_SENT = 'message:sent',
  MESSAGE_DELIVERED = 'message:delivered',
  MESSAGE_READ = 'message:read',
  TYPING_START = 'typing:start',
  TYPING_STOP = 'typing:stop',
  CONVERSATION_UPDATED = 'conversation:updated',

  // Comment events
  COMMENT_CREATED = 'comment:created',
  COMMENT_UPDATED = 'comment:updated',
  COMMENT_DELETED = 'comment:deleted',
  COMMENT_LIKED = 'comment:liked',

  // Future extensibility
  POST_LIKED = 'post:liked',
  POST_COMMENTED = 'post:commented',
  USER_FOLLOWED = 'user:followed',
  STORY_VIEWED = 'story:viewed',
}

/**
 * Base interface for all WebSocket events
 */
export interface IWebSocketEvent<T = any> {
  type: WebSocketEventType;
  payload: T;
  userId?: string;
  roomId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

/**
 * Room types for organizing WebSocket connections
 */
export enum RoomType {
  USER = 'user', // Personal room: user:{userId}
  CONVERSATION = 'conversation', // Chat room: conversation:{conversationId}
  POST = 'post', // Post room: post:{postId}
  NOTIFICATION = 'notification', // Notification room: notification:{userId}
  GROUP = 'group', // Group room: group:{groupId}
}
