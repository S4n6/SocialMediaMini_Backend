import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { RedisCacheService } from '../../../modules/cache';
import { WEBSOCKET_CONFIG } from '../constants';
import { ConnectionManagerService } from './connection-manager.service';

const PRESENCE_KEY_PREFIX = `${WEBSOCKET_CONFIG.REDIS_KEY_PREFIX}presence:`;
const PRESENCE_TTL = 300; // 5 minutes — auto-expire if server crashes without disconnect

/**
 * Online Presence Service
 *
 * Tracks which users are currently connected to ANY server instance.
 * Uses Redis as the authoritative store so presence is accurate across
 * multiple horizontally-scaled NestJS nodes.
 *
 * Design decisions:
 * - Redis key per user with TTL (auto-cleans on crash)
 * - Heartbeat refreshes TTL every 4 minutes (< 5min TTL)
 * - `ConnectionManagerService` owns socket-level tracking
 * - `PresenceService` owns user-level "is online?" semantics
 */
@Injectable()
export class PresenceService implements OnModuleDestroy {
  private readonly logger = new Logger(PresenceService.name);
  private heartbeatInterval?: NodeJS.Timeout;

  constructor(
    private readonly cacheService: RedisCacheService,
    private readonly connectionManager: ConnectionManagerService,
  ) {
    this.startHeartbeat();
  }

  /**
   * Mark user as online. Called on successful WebSocket connection.
   */
  async setOnline(userId: string): Promise<void> {
    try {
      await this.cacheService.set(
        `${PRESENCE_KEY_PREFIX}${userId}`,
        JSON.stringify({
          status: 'online',
          lastSeen: new Date().toISOString(),
          connectedAt: new Date().toISOString(),
        }),
        PRESENCE_TTL,
      );
    } catch (error) {
      this.logger.error(
        `Failed to set user ${userId} online: ${error.message}`,
      );
    }
  }

  /**
   * Mark user as offline. Called when the LAST socket for a user disconnects.
   * Stores lastSeen timestamp for "last active" display.
   */
  async setOffline(userId: string): Promise<void> {
    try {
      await this.cacheService.set(
        `${PRESENCE_KEY_PREFIX}${userId}`,
        JSON.stringify({
          status: 'offline',
          lastSeen: new Date().toISOString(),
        }),
        PRESENCE_TTL * 12, // Keep offline status for 1 hour for "last seen" queries
      );
    } catch (error) {
      this.logger.error(
        `Failed to set user ${userId} offline: ${error.message}`,
      );
    }
  }

  /**
   * Check if a user is online on ANY server instance.
   * This is the only correct way to check presence in a multi-instance deployment.
   */
  async isOnline(userId: string): Promise<boolean> {
    try {
      const raw = await this.cacheService.get<string>(
        `${PRESENCE_KEY_PREFIX}${userId}`,
      );
      if (!raw) return false;

      const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return data.status === 'online';
    } catch {
      return false;
    }
  }

  /**
   * Get the last seen timestamp for a user. Returns null if never tracked.
   */
  async getLastSeen(userId: string): Promise<Date | null> {
    try {
      const raw = await this.cacheService.get<string>(
        `${PRESENCE_KEY_PREFIX}${userId}`,
      );
      if (!raw) return null;

      const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return data.lastSeen ? new Date(data.lastSeen) : null;
    } catch {
      return null;
    }
  }

  /**
   * Batch presence check for a list of user IDs.
   * Useful for showing online indicators in a conversation participant list.
   */
  async getOnlineStatusBatch(userIds: string[]): Promise<Map<string, boolean>> {
    const result = new Map<string, boolean>();
    // Execute in parallel for efficiency
    const checks = userIds.map(async (id) => {
      result.set(id, await this.isOnline(id));
    });
    await Promise.all(checks);
    return result;
  }

  /**
   * Get full presence info for a user.
   */
  async getPresence(
    userId: string,
  ): Promise<{ isOnline: boolean; lastSeen: Date | null }> {
    try {
      const raw = await this.cacheService.get<string>(
        `${PRESENCE_KEY_PREFIX}${userId}`,
      );
      if (!raw) return { isOnline: false, lastSeen: null };

      const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return {
        isOnline: data.status === 'online',
        lastSeen: data.lastSeen ? new Date(data.lastSeen) : null,
      };
    } catch {
      return { isOnline: false, lastSeen: null };
    }
  }

  /**
   * Heartbeat: refresh TTL for all users connected to THIS instance.
   * Prevents presence keys from expiring while users are still connected.
   * Runs every 4 minutes (safely under the 5-minute TTL).
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(
      async () => {
        try {
          const onlineUserIds = await this.connectionManager.getOnlineUsers();
          const refreshes = onlineUserIds.map((userId) =>
            this.setOnline(userId),
          );
          await Promise.all(refreshes);

          if (onlineUserIds.length > 0) {
            this.logger.debug(
              `Presence heartbeat: refreshed ${onlineUserIds.length} users`,
            );
          }
        } catch (error) {
          this.logger.error(`Presence heartbeat failed: ${error.message}`);
        }
      },
      4 * 60 * 1000,
    ); // 4 minutes

    this.logger.log('Presence heartbeat started (interval: 4m, TTL: 5m)');
  }

  onModuleDestroy(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.logger.log('Presence heartbeat stopped');
    }
  }
}
