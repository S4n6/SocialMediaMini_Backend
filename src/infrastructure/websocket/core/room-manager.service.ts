import { Injectable, Logger } from '@nestjs/common';
import { IRoomManager } from './interfaces';
import { RoomEntity } from '../domain/entities';
import { RedisCacheService } from '../../../modules/cache';
import { WEBSOCKET_CONFIG, WebSocketRoomType } from '../constants';

@Injectable()
export class RoomManagerService implements IRoomManager {
  private readonly logger = new Logger(RoomManagerService.name);
  private rooms = new Map<string, RoomEntity>(); // roomId -> RoomEntity
  private socketRooms = new Map<string, Set<string>>(); // socketId -> Set<roomId>
  private cleanupInterval?: NodeJS.Timeout;

  constructor(private readonly cacheService: RedisCacheService) {
    this.startCleanupProcess();
  }

  async joinRoom(
    roomId: string,
    socketId: string,
    userId?: string,
  ): Promise<void> {
    try {
      // Get or create room
      let room = await this.getRoom(roomId);
      if (!room) {
        // Auto-determine room type based on roomId pattern
        const roomType = this.determineRoomType(roomId);
        room = await this.createRoom(roomId, roomType);
      }

      // Add connection to room
      room.addConnection(socketId, userId);
      this.rooms.set(roomId, room);

      // Update socket rooms mapping
      if (!this.socketRooms.has(socketId)) {
        this.socketRooms.set(socketId, new Set());
      }
      this.socketRooms.get(socketId)!.add(roomId);

      // Persist to Redis
      await this.persistRoomToCache(room);
      await this.updateSocketRoomsInCache(socketId);

      this.logger.log(`Socket ${socketId} joined room ${roomId}`);
    } catch (error) {
      this.logger.error(`Failed to join room: ${error.message}`, error.stack);
      throw error;
    }
  }

  async leaveRoom(
    roomId: string,
    socketId: string,
    userId?: string,
  ): Promise<void> {
    try {
      const room = this.rooms.get(roomId);
      if (!room) {
        this.logger.warn(`Room ${roomId} not found when leaving`);
        return;
      }

      // Remove connection from room
      room.removeConnection(socketId, userId);

      // Update socket rooms mapping
      const socketRoomSet = this.socketRooms.get(socketId);
      if (socketRoomSet) {
        socketRoomSet.delete(roomId);
        if (socketRoomSet.size === 0) {
          this.socketRooms.delete(socketId);
        }
      }

      // If room is empty, remove it
      if (room.isEmpty()) {
        this.rooms.delete(roomId);
        await this.cacheService.del(
          `${WEBSOCKET_CONFIG.REDIS_KEY_PREFIX}room:${roomId}`,
        );
      } else {
        await this.persistRoomToCache(room);
      }

      await this.updateSocketRoomsInCache(socketId);

      this.logger.log(`Socket ${socketId} left room ${roomId}`);
    } catch (error) {
      this.logger.error(`Failed to leave room: ${error.message}`, error.stack);
      throw error;
    }
  }

  async leaveAllRooms(socketId: string): Promise<void> {
    try {
      const roomIds = await this.getSocketRooms(socketId);

      for (const roomId of roomIds) {
        await this.leaveRoom(roomId, socketId);
      }

      // Clean up socket rooms mapping
      this.socketRooms.delete(socketId);
      await this.cacheService.del(
        `${WEBSOCKET_CONFIG.REDIS_KEY_PREFIX}socket_rooms:${socketId}`,
      );

      this.logger.log(`Socket ${socketId} left all rooms`);
    } catch (error) {
      this.logger.error(
        `Failed to leave all rooms: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async createRoom(
    roomId: string,
    roomType: WebSocketRoomType,
    metadata?: Record<string, any>,
  ): Promise<RoomEntity> {
    try {
      const room = new RoomEntity(roomId, roomType, new Date(), metadata);
      this.rooms.set(roomId, room);
      await this.persistRoomToCache(room);

      this.logger.log(`Room ${roomId} created with type ${roomType}`);
      return room;
    } catch (error) {
      this.logger.error(`Failed to create room: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getRoom(roomId: string): Promise<RoomEntity | null> {
    try {
      // Check memory first
      const room = this.rooms.get(roomId);
      if (room) {
        return room;
      }

      // Check Redis
      const roomData = await this.cacheService.get<any>(
        `${WEBSOCKET_CONFIG.REDIS_KEY_PREFIX}room:${roomId}`,
      );
      if (roomData) {
        const room = new RoomEntity(
          roomData.roomId,
          roomData.roomType,
          new Date(roomData.createdAt),
          roomData.metadata,
        );

        // Restore connections (simplified - in production you might want more sophisticated state restoration)
        this.rooms.set(roomId, room);
        return room;
      }

      return null;
    } catch (error) {
      this.logger.error(`Failed to get room: ${error.message}`, error.stack);
      return null;
    }
  }

  async getSocketRooms(socketId: string): Promise<string[]> {
    try {
      // Check memory first
      const socketRoomSet = this.socketRooms.get(socketId);
      if (socketRoomSet) {
        return Array.from(socketRoomSet);
      }

      // Check Redis
      const socketRooms = await this.cacheService.get<string[]>(
        `${WEBSOCKET_CONFIG.REDIS_KEY_PREFIX}socket_rooms:${socketId}`,
      );

      return socketRooms || [];
    } catch (error) {
      this.logger.error(
        `Failed to get socket rooms: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  async getRoomConnections(roomId: string): Promise<string[]> {
    try {
      const room = await this.getRoom(roomId);
      return room ? room.getConnections() : [];
    } catch (error) {
      this.logger.error(
        `Failed to get room connections: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  async getRoomUsers(roomId: string): Promise<string[]> {
    try {
      const room = await this.getRoom(roomId);
      return room ? room.getUsers() : [];
    } catch (error) {
      this.logger.error(
        `Failed to get room users: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  async getUserConnectionsInRoom(
    roomId: string,
    userId: string,
  ): Promise<string[]> {
    try {
      const room = await this.getRoom(roomId);
      return room ? room.getUserConnections(userId) : [];
    } catch (error) {
      this.logger.error(
        `Failed to get user connections in room: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  async isSocketInRoom(roomId: string, socketId: string): Promise<boolean> {
    try {
      const room = await this.getRoom(roomId);
      return room ? room.hasConnection(socketId) : false;
    } catch (error) {
      this.logger.error(
        `Failed to check socket in room: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }

  async isUserInRoom(roomId: string, userId: string): Promise<boolean> {
    try {
      const room = await this.getRoom(roomId);
      return room ? room.hasUser(userId) : false;
    } catch (error) {
      this.logger.error(
        `Failed to check user in room: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }

  async removeUserFromRoom(roomId: string, userId: string): Promise<string[]> {
    try {
      const room = this.rooms.get(roomId);
      if (!room) {
        return [];
      }

      const removedSockets = room.removeAllUserConnections(userId);

      // Update socket rooms mapping for removed sockets
      for (const socketId of removedSockets) {
        const socketRoomSet = this.socketRooms.get(socketId);
        if (socketRoomSet) {
          socketRoomSet.delete(roomId);
          if (socketRoomSet.size === 0) {
            this.socketRooms.delete(socketId);
          }
          await this.updateSocketRoomsInCache(socketId);
        }
      }

      // If room is empty, remove it
      if (room.isEmpty()) {
        this.rooms.delete(roomId);
        await this.cacheService.del(
          `${WEBSOCKET_CONFIG.REDIS_KEY_PREFIX}room:${roomId}`,
        );
      } else {
        await this.persistRoomToCache(room);
      }

      this.logger.log(`User ${userId} removed from room ${roomId}`);
      return removedSockets;
    } catch (error) {
      this.logger.error(
        `Failed to remove user from room: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  async getRoomCount(): Promise<number> {
    return this.rooms.size;
  }

  async getRoomConnectionCount(roomId: string): Promise<number> {
    try {
      const room = await this.getRoom(roomId);
      return room ? room.getConnectionCount() : 0;
    } catch (error) {
      this.logger.error(
        `Failed to get room connection count: ${error.message}`,
        error.stack,
      );
      return 0;
    }
  }

  async getRoomUserCount(roomId: string): Promise<number> {
    try {
      const room = await this.getRoom(roomId);
      return room ? room.getUserCount() : 0;
    } catch (error) {
      this.logger.error(
        `Failed to get room user count: ${error.message}`,
        error.stack,
      );
      return 0;
    }
  }

  async cleanupEmptyRooms(): Promise<number> {
    try {
      let cleanedCount = 0;
      const roomsToRemove: string[] = [];

      for (const [roomId, room] of this.rooms.entries()) {
        if (room.isEmpty()) {
          roomsToRemove.push(roomId);
        }
      }

      for (const roomId of roomsToRemove) {
        this.rooms.delete(roomId);
        await this.cacheService.del(
          `${WEBSOCKET_CONFIG.REDIS_KEY_PREFIX}room:${roomId}`,
        );
        cleanedCount++;
      }

      if (cleanedCount > 0) {
        this.logger.log(`Cleaned up ${cleanedCount} empty rooms`);
      }

      return cleanedCount;
    } catch (error) {
      this.logger.error(
        `Failed to cleanup empty rooms: ${error.message}`,
        error.stack,
      );
      return 0;
    }
  }

  async getAllRoomIds(): Promise<string[]> {
    return Array.from(this.rooms.keys());
  }

  async getRoomsByType(roomType: WebSocketRoomType): Promise<string[]> {
    try {
      const roomIds: string[] = [];

      for (const [roomId, room] of this.rooms.entries()) {
        if (room.roomType === roomType) {
          roomIds.push(roomId);
        }
      }

      return roomIds;
    } catch (error) {
      this.logger.error(
        `Failed to get rooms by type: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  private async persistRoomToCache(room: RoomEntity): Promise<void> {
    try {
      await this.cacheService.set(
        `${WEBSOCKET_CONFIG.REDIS_KEY_PREFIX}room:${room.roomId}`,
        room.toJSON(),
        WEBSOCKET_CONFIG.REDIS_CONNECTION_TTL,
      );
    } catch (error) {
      this.logger.error(
        `Failed to persist room to cache: ${error.message}`,
        error.stack,
      );
    }
  }

  private async updateSocketRoomsInCache(socketId: string): Promise<void> {
    try {
      const rooms = this.socketRooms.get(socketId);
      if (rooms && rooms.size > 0) {
        await this.cacheService.set(
          `${WEBSOCKET_CONFIG.REDIS_KEY_PREFIX}socket_rooms:${socketId}`,
          Array.from(rooms),
          WEBSOCKET_CONFIG.REDIS_CONNECTION_TTL,
        );
      } else {
        await this.cacheService.del(
          `${WEBSOCKET_CONFIG.REDIS_KEY_PREFIX}socket_rooms:${socketId}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to update socket rooms in cache: ${error.message}`,
        error.stack,
      );
    }
  }

  private determineRoomType(roomId: string): WebSocketRoomType {
    if (roomId.startsWith('user:')) return 'user';
    if (roomId.startsWith('conversation:')) return 'conversation';
    if (roomId.startsWith('followers:')) return 'followers';
    if (roomId.startsWith('post:')) return 'post';
    if (
      roomId === 'global_feed' ||
      roomId === 'online_users' ||
      roomId === 'admin'
    )
      return 'system';
    return 'global'; // default
  }

  private startCleanupProcess(): void {
    this.cleanupInterval = setInterval(async () => {
      await this.cleanupEmptyRooms();
    }, WEBSOCKET_CONFIG.ROOM_CLEANUP_INTERVAL);

    this.logger.log('Room cleanup process started');
  }

  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.logger.log('Room cleanup process stopped');
    }
  }
}
