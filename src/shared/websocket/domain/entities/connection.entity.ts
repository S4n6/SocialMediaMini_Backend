import { WebSocketRoomType } from '../../constants';

export class ConnectionEntity {
  public readonly connectedAt: Date;
  public lastActivity: Date;
  public readonly metadata: Record<string, any>;

  constructor(
    public readonly userId: string,
    public readonly socketId: string,
    connectedAt?: Date,
    public readonly userAgent?: string,
    public readonly ipAddress?: string,
    metadata?: Record<string, any>,
  ) {
    this.connectedAt = connectedAt || new Date();
    this.lastActivity = new Date();
    this.metadata = metadata || {};
  }

  public updateActivity(): void {
    this.lastActivity = new Date();
  }

  public isExpired(maxAge: number = 24 * 60 * 60 * 1000): boolean {
    return Date.now() - this.connectedAt.getTime() > maxAge;
  }

  public isIdle(maxIdleTime: number = 30 * 60 * 1000): boolean {
    return Date.now() - this.lastActivity.getTime() > maxIdleTime;
  }

  public getConnectionDuration(): number {
    return Date.now() - this.connectedAt.getTime();
  }

  public getIdleDuration(): number {
    return Date.now() - this.lastActivity.getTime();
  }

  public setMetadata(key: string, value: any): void {
    this.metadata[key] = value;
  }

  public getMetadata(key: string): any {
    return this.metadata[key];
  }

  public toJSON() {
    return {
      userId: this.userId,
      socketId: this.socketId,
      connectedAt: this.connectedAt,
      lastActivity: this.lastActivity,
      userAgent: this.userAgent,
      ipAddress: this.ipAddress,
      metadata: this.metadata,
      connectionDuration: this.getConnectionDuration(),
      idleDuration: this.getIdleDuration(),
    };
  }
}
