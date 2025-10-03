import { Injectable, Logger } from '@nestjs/common';
import {
  WebSocketRoom,
  WebSocketRoomType,
  WebSocketNamespace,
  IRoomManager,
} from '../interfaces/websocket.interface';

@Injectable()
export class RoomManagerService implements IRoomManager {
  private readonly logger = new Logger(RoomManagerService.name);
  private rooms = new Map<string, WebSocketRoom>(); // roomId -> WebSocketRoom
  private userRooms = new Map<string, Set<string>>(); // userId -> Set<roomId>
  private namespaceRooms = new Map<WebSocketNamespace, Set<string>>(); // namespace -> Set<roomId>

  createRoom(
    roomData: Omit<WebSocketRoom, 'participants' | 'sockets'>,
  ): WebSocketRoom {
    const room: WebSocketRoom = {
      ...roomData,
      participants: new Set(),
      sockets: new Set(),
    };

    this.rooms.set(room.id, room);

    // Track namespace rooms
    if (!this.namespaceRooms.has(room.namespace)) {
      this.namespaceRooms.set(room.namespace, new Set());
    }
    this.namespaceRooms.get(room.namespace)!.add(room.id);

    this.logger.debug(`Created room ${room.id} in namespace ${room.namespace}`);
    return room;
  }

  getRoom(roomId: string): WebSocketRoom | undefined {
    return this.rooms.get(roomId);
  }

  joinRoom(roomId: string, userId: string, socketId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) {
      this.logger.warn(`Attempted to join non-existent room: ${roomId}`);
      return false;
    }

    // Add participant and socket to room
    room.participants.add(userId);
    room.sockets.add(socketId);
    room.metadata.lastActivity = new Date();

    // Track user rooms
    if (!this.userRooms.has(userId)) {
      this.userRooms.set(userId, new Set());
    }
    this.userRooms.get(userId)!.add(roomId);

    this.logger.debug(
      `User ${userId} joined room ${roomId} (socket: ${socketId})`,
    );
    return true;
  }

  leaveRoom(roomId: string, userId: string, socketId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) {
      this.logger.warn(`Attempted to leave non-existent room: ${roomId}`);
      return false;
    }

    // Remove socket from room
    room.sockets.delete(socketId);
    room.metadata.lastActivity = new Date();

    // Check if user has other sockets in the room
    const userSocketsInRoom = Array.from(room.sockets).filter((s) => {
      // This would need connection manager to check socket ownership
      // For now, we'll assume the socket belongs to the user
      void s;
      return true;
    });

    // If user has no more sockets in the room, remove them from participants
    if (userSocketsInRoom.length === 0) {
      room.participants.delete(userId);

      // Remove room from user's room list
      const userRooms = this.userRooms.get(userId);
      if (userRooms) {
        userRooms.delete(roomId);
        if (userRooms.size === 0) {
          this.userRooms.delete(userId);
        }
      }
    }

    this.logger.debug(
      `User ${userId} left room ${roomId} (socket: ${socketId})`,
    );
    return true;
  }

  deleteRoom(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) {
      return false;
    }

    // Remove room from all participants' room lists
    for (const userId of room.participants) {
      const userRooms = this.userRooms.get(userId);
      if (userRooms) {
        userRooms.delete(roomId);
        if (userRooms.size === 0) {
          this.userRooms.delete(userId);
        }
      }
    }

    // Remove from namespace rooms
    const namespaceRooms = this.namespaceRooms.get(room.namespace);
    if (namespaceRooms) {
      namespaceRooms.delete(roomId);
    }

    // Remove from rooms map
    this.rooms.delete(roomId);

    this.logger.debug(`Deleted room ${roomId}`);
    return true;
  }

  getRoomsByUser(userId: string): WebSocketRoom[] {
    const roomIds = this.userRooms.get(userId);
    if (!roomIds) {
      return [];
    }

    return Array.from(roomIds)
      .map((roomId) => this.rooms.get(roomId))
      .filter(Boolean) as WebSocketRoom[];
  }

  getRoomsByNamespace(namespace: WebSocketNamespace): WebSocketRoom[] {
    const roomIds = this.namespaceRooms.get(namespace);
    if (!roomIds) {
      return [];
    }

    return Array.from(roomIds)
      .map((roomId) => this.rooms.get(roomId))
      .filter(Boolean) as WebSocketRoom[];
  }

  cleanupEmptyRooms(): number {
    let removedCount = 0;

    for (const [roomId, room] of this.rooms.entries()) {
      if (room.participants.size === 0 && room.sockets.size === 0) {
        this.deleteRoom(roomId);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      this.logger.log(`Cleaned up ${removedCount} empty rooms`);
    }

    return removedCount;
  }

  // Utility methods
  getRoomParticipantCount(roomId: string): number {
    const room = this.rooms.get(roomId);
    return room ? room.participants.size : 0;
  }

  getRoomSocketCount(roomId: string): number {
    const room = this.rooms.get(roomId);
    return room ? room.sockets.size : 0;
  }

  isUserInRoom(roomId: string, userId: string): boolean {
    const room = this.rooms.get(roomId);
    return room ? room.participants.has(userId) : false;
  }

  getRoomsByType(type: WebSocketRoomType): WebSocketRoom[] {
    return Array.from(this.rooms.values()).filter((room) => room.type === type);
  }

  // Create predefined room types
  createUserRoom(userId: string, namespace: WebSocketNamespace): WebSocketRoom {
    const roomId = `user:${userId}`;

    // Check if room already exists
    const existingRoom = this.getRoom(roomId);
    if (existingRoom) {
      return existingRoom;
    }

    return this.createRoom({
      id: roomId,
      type: WebSocketRoomType.USER,
      namespace,
      metadata: {
        createdAt: new Date(),
        lastActivity: new Date(),
        isPrivate: true,
      },
    });
  }

  createConversationRoom(
    conversationId: string,
    namespace: WebSocketNamespace,
  ): WebSocketRoom {
    const roomId = `conversation:${conversationId}`;

    const existingRoom = this.getRoom(roomId);
    if (existingRoom) {
      return existingRoom;
    }

    return this.createRoom({
      id: roomId,
      type: WebSocketRoomType.CONVERSATION,
      namespace,
      metadata: {
        createdAt: new Date(),
        lastActivity: new Date(),
        isPrivate: true,
        totalMessages: 0,
      },
    });
  }

  createPostRoom(postId: string, namespace: WebSocketNamespace): WebSocketRoom {
    const roomId = `post:${postId}`;

    const existingRoom = this.getRoom(roomId);
    if (existingRoom) {
      return existingRoom;
    }

    return this.createRoom({
      id: roomId,
      type: WebSocketRoomType.POST,
      namespace,
      metadata: {
        createdAt: new Date(),
        lastActivity: new Date(),
        isPrivate: false,
      },
    });
  }

  createTopicRoom(topic: string, namespace: WebSocketNamespace): WebSocketRoom {
    const roomId = `topic:${topic}`;

    const existingRoom = this.getRoom(roomId);
    if (existingRoom) {
      return existingRoom;
    }

    return this.createRoom({
      id: roomId,
      type: WebSocketRoomType.TOPIC,
      namespace,
      metadata: {
        createdAt: new Date(),
        lastActivity: new Date(),
        isPrivate: false,
      },
    });
  }

  createFeedRoom(userId: string, namespace: WebSocketNamespace): WebSocketRoom {
    const roomId = `feed:${userId}`;

    const existingRoom = this.getRoom(roomId);
    if (existingRoom) {
      return existingRoom;
    }

    return this.createRoom({
      id: roomId,
      type: WebSocketRoomType.FEED,
      namespace,
      metadata: {
        createdAt: new Date(),
        lastActivity: new Date(),
        isPrivate: true,
      },
    });
  }

  // Bulk operations
  removeUserFromAllRooms(userId: string): number {
    const userRooms = this.userRooms.get(userId);
    if (!userRooms) {
      return 0;
    }

    let removedFromCount = 0;

    for (const roomId of userRooms) {
      const room = this.rooms.get(roomId);
      if (room) {
        room.participants.delete(userId);
        room.metadata.lastActivity = new Date();
        removedFromCount++;
      }
    }

    this.userRooms.delete(userId);

    this.logger.debug(`Removed user ${userId} from ${removedFromCount} rooms`);
    return removedFromCount;
  }

  // Statistics and monitoring
  getRoomStats(): {
    totalRooms: number;
    totalParticipants: number;
    roomsByType: Record<WebSocketRoomType, number>;
    roomsByNamespace: Record<WebSocketNamespace, number>;
    lastUpdated: Date;
  } {
    const totalRooms = this.rooms.size;
    const totalParticipants = this.userRooms.size;

    const roomsByType: Record<WebSocketRoomType, number> = {} as Record<
      WebSocketRoomType,
      number
    >;
    const roomsByNamespace: Record<WebSocketNamespace, number> = {} as Record<
      WebSocketNamespace,
      number
    >;

    for (const room of this.rooms.values()) {
      roomsByType[room.type] = (roomsByType[room.type] || 0) + 1;
      roomsByNamespace[room.namespace] =
        (roomsByNamespace[room.namespace] || 0) + 1;
    }

    return {
      totalRooms,
      totalParticipants,
      roomsByType,
      roomsByNamespace,
      lastUpdated: new Date(),
    };
  }

  // Health check
  healthCheck(): { healthy: boolean; details: any } {
    const stats = this.getRoomStats();

    const healthy = stats.totalRooms >= 0 && stats.totalParticipants >= 0;

    return {
      healthy,
      details: {
        ...stats,
        roomsWithoutParticipants: Array.from(this.rooms.values()).filter(
          (room) => room.participants.size === 0,
        ).length,
        timestamp: new Date(),
      },
    };
  }
}
