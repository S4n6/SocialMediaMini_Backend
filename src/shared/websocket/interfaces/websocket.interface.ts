import { Socket } from 'socket.io';

// WebSocket namespaces
export enum WebSocketNamespace {
  NOTIFICATIONS = '/notifications',
  MESSAGING = '/messaging',
  SOCIAL = '/social',
  PRESENCE = '/presence',
}

// WebSocket events
export enum WebSocketEvent {
  // Connection events
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  CONNECTION_ESTABLISHED = 'connection_established',
  JOIN_ROOM = 'join_room',
  LEAVE_ROOM = 'leave_room',
  USER_JOINED_ROOM = 'user_joined_room',
  USER_LEFT_ROOM = 'user_left_room',

  // Notification events (existing)
  NOTIFICATION = 'notification',
  NOTIFICATION_READ = 'notification_read',
  UNREAD_COUNT = 'unread_count',

  // Messaging events
  MESSAGE_SENT = 'message_sent',
  MESSAGE_RECEIVED = 'message_received',
  MESSAGE_READ = 'message_read',
  MESSAGE_DELIVERED = 'message_delivered',
  CONVERSATION_CREATED = 'conversation_created',
  CONVERSATION_UPDATED = 'conversation_updated',

  // Typing indicators
  TYPING_START = 'typing_start',
  TYPING_STOP = 'typing_stop',

  // Presence events
  USER_ONLINE = 'user_online',
  USER_OFFLINE = 'user_offline',
  USER_STATUS_CHANGE = 'user_status_change',
  PRESENCE_UPDATED = 'presence_updated',

  // Social real-time events
  POST_CREATED = 'post_created',
  POST_UPDATED = 'post_updated',
  POST_DELETED = 'post_deleted',
  POST_LIKED = 'post_liked',
  POST_UNLIKED = 'post_unliked',
  COMMENT_ADDED = 'comment_added',
  COMMENT_LIKED = 'comment_liked',
  COMMENT_UNLIKED = 'comment_unliked',
  FOLLOW_REQUEST = 'follow_request',
  FOLLOW_ACCEPTED = 'follow_accepted',
  FOLLOW_DECLINED = 'follow_declined',
}

// Room types
export enum WebSocketRoomType {
  USER = 'user',
  CONVERSATION = 'conversation',
  POST = 'post',
  FEED = 'feed',
  TOPIC = 'topic',
}

// User connection interface
export interface UserConnection {
  userId: string;
  socketId: string;
  socket: Socket;
  namespace: WebSocketNamespace;
  connectedAt: Date;
  lastActivity: Date;
  metadata: {
    userAgent?: string;
    device?: string;
    location?: string;
    version?: string;
  };
}

// Room interface
export interface WebSocketRoom {
  id: string;
  type: WebSocketRoomType;
  namespace: WebSocketNamespace;
  participants: Set<string>; // userIds
  sockets: Set<string>; // socketIds
  metadata: {
    createdAt: Date;
    lastActivity: Date;
    totalMessages?: number;
    isPrivate?: boolean;
  };
}

// Event payload structure
export interface WebSocketEventPayload<T = unknown> {
  event: WebSocketEvent;
  data: T;
  metadata: {
    timestamp: Date;
    sender?: string;
    eventId: string;
    version: string;
    retryCount?: number;
  };
  room?: string;
  targetUsers?: string[];
  namespace?: WebSocketNamespace;
}

// Authentication payload
export interface WebSocketAuthPayload {
  userId: string;
  email?: string;
  permissions?: string[];
  sessionId?: string;
  expiresAt?: Date;
}

// Room join/leave payload
export interface RoomPayload {
  roomId: string;
  roomType: WebSocketRoomType;
  action: 'join' | 'leave';
  metadata?: Record<string, any>;
}

// Typing indicator payload
export interface TypingPayload {
  userId: string;
  conversationId?: string;
  postId?: string;
  isTyping: boolean;
  timestamp: Date;
}

// Presence payload
export interface PresencePayload {
  userId: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen?: Date;
  customStatus?: string;
}

// Message delivery status
export interface MessageDeliveryStatus {
  messageId: string;
  userId: string;
  status: 'sent' | 'delivered' | 'read';
  timestamp: Date;
}

// Redis pub/sub channels
export const REDIS_CHANNELS = {
  NOTIFICATIONS: 'websocket:notifications',
  MESSAGING: 'websocket:messaging',
  SOCIAL: 'websocket:social',
  PRESENCE: 'websocket:presence',
  SYSTEM: 'websocket:system',
} as const;

// WebSocket error types
export enum WebSocketErrorType {
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  ROOM_NOT_FOUND = 'ROOM_NOT_FOUND',
  ROOM_ACCESS_DENIED = 'ROOM_ACCESS_DENIED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INVALID_PAYLOAD = 'INVALID_PAYLOAD',
  CONNECTION_LIMIT_EXCEEDED = 'CONNECTION_LIMIT_EXCEEDED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

// WebSocket error payload
export interface WebSocketError {
  type: WebSocketErrorType;
  message: string;
  code?: string;
  details?: any;
  timestamp: Date;
}

// Connection statistics
export interface ConnectionStats {
  totalConnections: number;
  connectionsByNamespace: Record<WebSocketNamespace, number>;
  connectionsByRoom: Record<string, number>;
  activeUsers: number;
  messagesPerSecond: number;
  averageResponseTime: number;
  errorRate: number;
  lastUpdated: Date;
}

// Rate limiting configuration
export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (socket: Socket) => string;
}

// WebSocket middleware configuration
export interface WebSocketMiddlewareConfig {
  authentication: {
    required: boolean;
    jwtSecret: string;
    skipEvents?: WebSocketEvent[];
  };
  rateLimit: RateLimitConfig;
  logging: {
    enabled: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    logEvents?: WebSocketEvent[];
  };
  cors: {
    origin: string | string[] | boolean;
    methods: string[];
    credentials: boolean;
  };
}

// Service interfaces
export interface IConnectionManager {
  addConnection(connection: UserConnection): void;
  removeConnection(socketId: string): void;
  getConnection(socketId: string): UserConnection | undefined;
  getUserConnections(userId: string): UserConnection[];
  getAllConnections(): UserConnection[];
  getConnectionsByNamespace(namespace: WebSocketNamespace): UserConnection[];
  updateLastActivity(socketId: string): void;
  getStats(): ConnectionStats;
}

export interface IRoomManager {
  createRoom(
    room: Omit<WebSocketRoom, 'participants' | 'sockets'>,
  ): WebSocketRoom;
  getRoom(roomId: string): WebSocketRoom | undefined;
  joinRoom(roomId: string, userId: string, socketId: string): boolean;
  leaveRoom(roomId: string, userId: string, socketId: string): boolean;
  deleteRoom(roomId: string): boolean;
  getRoomsByUser(userId: string): WebSocketRoom[];
  getRoomsByNamespace(namespace: WebSocketNamespace): WebSocketRoom[];
  cleanupEmptyRooms(): number;
}

export interface IWebSocketGatewayService {
  emitToUser(
    userId: string,
    event: WebSocketEvent,
    data: any,
    namespace?: WebSocketNamespace,
  ): Promise<boolean>;
  emitToRoom(
    roomId: string,
    event: WebSocketEvent,
    data: any,
  ): Promise<boolean>;
  broadcastToNamespace(
    namespace: WebSocketNamespace,
    event: WebSocketEvent,
    data: any,
  ): Promise<boolean>;
}
