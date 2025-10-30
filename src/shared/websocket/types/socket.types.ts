import { Socket } from 'socket.io';
import { AuthenticatedUser } from '../application/interfaces';

// Extend Socket interface to include user data
export interface AuthenticatedSocket extends Socket {
  user?: AuthenticatedUser;
  userId?: string;
  isAuthenticated?: boolean;
  connectionTime?: Date;
  lastActivity?: Date;
}

// Connection metadata
export interface ConnectionMetadata {
  userAgent?: string;
  ipAddress?: string;
  platform?: string;
  browser?: string;
  version?: string;
  [key: string]: any;
}

// Connection statistics
export interface ConnectionStats {
  totalConnections: number;
  uniqueUsers: number;
  averageConnectionsPerUser: number;
  connectionsByRoom: Record<string, number>;
  lastUpdated: Date;
}

// Room statistics
export interface RoomStats {
  roomId: string;
  roomType: string;
  connectionCount: number;
  userCount: number;
  createdAt: Date;
  lastActivity: Date;
  metadata?: Record<string, any>;
}

// Event payload types for different modules
export interface NotificationEventPayload {
  notificationId?: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  createdAt?: Date;
}

export interface MessagingEventPayload {
  conversationId: string;
  messageId?: string;
  senderId: string;
  receiverId?: string;
  content?: string;
  messageType?: 'text' | 'image' | 'file' | 'voice';
  timestamp?: Date;
  metadata?: Record<string, any>;
}

export interface PostsEventPayload {
  postId: string;
  userId: string;
  action:
    | 'create'
    | 'update'
    | 'delete'
    | 'like'
    | 'unlike'
    | 'comment'
    | 'share';
  content?: any;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

// Generic event payload
export interface WebSocketEventPayload<T = any> {
  event: string;
  payload: T;
  timestamp?: number;
  requestId?: string;
  userId?: string;
}
