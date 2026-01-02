import { RoomEntity } from '../../domain/entities';
import { WebSocketRoomType } from '../../constants';

export interface IRoomManager {
  /**
   * Join a room
   */
  joinRoom(roomId: string, socketId: string, userId?: string): Promise<void>;

  /**
   * Leave a room
   */
  leaveRoom(roomId: string, socketId: string, userId?: string): Promise<void>;

  /**
   * Leave all rooms for a socket
   */
  leaveAllRooms(socketId: string): Promise<void>;

  /**
   * Create a new room
   */
  createRoom(
    roomId: string,
    roomType: WebSocketRoomType,
    metadata?: Record<string, any>,
  ): Promise<RoomEntity>;

  /**
   * Get room entity
   */
  getRoom(roomId: string): Promise<RoomEntity | null>;

  /**
   * Get all room IDs that a socket has joined
   */
  getSocketRooms(socketId: string): Promise<string[]>;

  /**
   * Get all socket IDs in a room
   */
  getRoomConnections(roomId: string): Promise<string[]>;

  /**
   * Get all user IDs in a room
   */
  getRoomUsers(roomId: string): Promise<string[]>;

  /**
   * Get all socket IDs for a user in a room
   */
  getUserConnectionsInRoom(roomId: string, userId: string): Promise<string[]>;

  /**
   * Check if a socket is in a room
   */
  isSocketInRoom(roomId: string, socketId: string): Promise<boolean>;

  /**
   * Check if a user is in a room
   */
  isUserInRoom(roomId: string, userId: string): Promise<boolean>;

  /**
   * Remove user from room (all their connections)
   */
  removeUserFromRoom(roomId: string, userId: string): Promise<string[]>;

  /**
   * Get room count
   */
  getRoomCount(): Promise<number>;

  /**
   * Get room connection count
   */
  getRoomConnectionCount(roomId: string): Promise<number>;

  /**
   * Get room user count
   */
  getRoomUserCount(roomId: string): Promise<number>;

  /**
   * Delete empty rooms
   */
  cleanupEmptyRooms(): Promise<number>;

  /**
   * Get all room IDs
   */
  getAllRoomIds(): Promise<string[]>;

  /**
   * Get rooms by type
   */
  getRoomsByType(roomType: WebSocketRoomType): Promise<string[]>;
}
