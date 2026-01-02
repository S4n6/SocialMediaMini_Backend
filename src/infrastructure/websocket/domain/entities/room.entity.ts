import { WebSocketRoomType } from '../../constants';

export class RoomEntity {
  private connections = new Set<string>();
  private userConnections = new Map<string, Set<string>>(); // userId -> Set<socketId>
  public readonly createdAt: Date;
  public lastActivity: Date;
  private metadata: Record<string, any>;

  constructor(
    public readonly roomId: string,
    public readonly roomType: WebSocketRoomType,
    createdAt?: Date,
    metadata?: Record<string, any>,
  ) {
    this.createdAt = createdAt || new Date();
    this.lastActivity = new Date();
    this.metadata = metadata || {};
  }

  public addConnection(socketId: string, userId?: string): void {
    this.connections.add(socketId);
    this.updateActivity();

    if (userId) {
      if (!this.userConnections.has(userId)) {
        this.userConnections.set(userId, new Set());
      }
      this.userConnections.get(userId)!.add(socketId);
    }
  }

  public removeConnection(socketId: string, userId?: string): void {
    const wasRemoved = this.connections.delete(socketId);
    if (wasRemoved) {
      this.updateActivity();
    }

    if (userId && this.userConnections.has(userId)) {
      const userSockets = this.userConnections.get(userId)!;
      userSockets.delete(socketId);

      if (userSockets.size === 0) {
        this.userConnections.delete(userId);
      }
    }
  }

  public removeAllUserConnections(userId: string): string[] {
    const userSockets = this.userConnections.get(userId);
    if (!userSockets) return [];

    const removedSockets = Array.from(userSockets);

    // Remove all sockets for this user from the room
    userSockets.forEach((socketId) => {
      this.connections.delete(socketId);
    });

    this.userConnections.delete(userId);
    this.updateActivity();

    return removedSockets;
  }

  public getConnectionCount(): number {
    return this.connections.size;
  }

  public getUserCount(): number {
    return this.userConnections.size;
  }

  public getConnections(): string[] {
    return Array.from(this.connections);
  }

  public getUsers(): string[] {
    return Array.from(this.userConnections.keys());
  }

  public getUserConnections(userId: string): string[] {
    const userSockets = this.userConnections.get(userId);
    return userSockets ? Array.from(userSockets) : [];
  }

  public hasConnection(socketId: string): boolean {
    return this.connections.has(socketId);
  }

  public hasUser(userId: string): boolean {
    return this.userConnections.has(userId);
  }

  public isEmpty(): boolean {
    return this.connections.size === 0;
  }

  public isUserRoom(): boolean {
    return this.roomType === 'user';
  }

  public isConversationRoom(): boolean {
    return this.roomType === 'conversation';
  }

  private updateActivity(): void {
    this.lastActivity = new Date();
  }

  public setMetadata(key: string, value: any): void {
    this.metadata[key] = value;
  }

  public getMetadata(key: string): any {
    return this.metadata[key];
  }

  public getAllMetadata(): Record<string, any> {
    return { ...this.metadata };
  }

  public toJSON() {
    return {
      roomId: this.roomId,
      roomType: this.roomType,
      connectionCount: this.getConnectionCount(),
      userCount: this.getUserCount(),
      createdAt: this.createdAt,
      lastActivity: this.lastActivity,
      metadata: this.metadata,
    };
  }
}
