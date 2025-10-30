import { Injectable, Logger } from '@nestjs/common';
import {
  ConnectionManagerService,
  RoomManagerService,
  WebSocketHandlerRegistry,
} from './';
import { HealthStatus } from '../../types';
import { WEBSOCKET_CONFIG } from '../../constants';

@Injectable()
export class WebSocketHealthService {
  private readonly logger = new Logger(WebSocketHealthService.name);
  private lastHealthCheck: Date = new Date();
  private healthCheckInterval?: NodeJS.Timeout;

  constructor(
    private readonly connectionManager: ConnectionManagerService,
    private readonly roomManager: RoomManagerService,
    private readonly handlerRegistry: WebSocketHandlerRegistry,
  ) {
    this.startHealthCheckMonitoring();
  }

  /**
   * Get current health status of WebSocket system
   */
  async getHealthStatus(): Promise<HealthStatus> {
    try {
      const startTime = Date.now();

      // Gather metrics
      const connectionCount = await this.connectionManager.getConnectionCount();
      const onlineUsers = await this.connectionManager.getOnlineUsers();
      const roomCount = await this.roomManager.getRoomCount();
      const handlerCount = this.handlerRegistry.getEventNames().length;

      // Memory usage
      const memoryUsage = process.memoryUsage();
      const memoryUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
      const memoryTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
      const memoryPercentage = Math.round((memoryUsedMB / memoryTotalMB) * 100);

      // Determine health status
      let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';

      if (memoryPercentage > 90) {
        status = 'unhealthy';
      } else if (
        memoryPercentage > 75 ||
        connectionCount > WEBSOCKET_CONFIG.MAX_CONNECTIONS_PER_USER * 1000
      ) {
        status = 'degraded';
      }

      const healthStatus: HealthStatus = {
        status,
        connections: {
          total: connectionCount,
          healthy: connectionCount, // Assume all connections are healthy for now
        },
        rooms: {
          total: roomCount,
          active: roomCount, // All rooms are considered active
        },
        memory: {
          used: memoryUsedMB,
          total: memoryTotalMB,
          percentage: memoryPercentage,
        },
        uptime: Math.floor(process.uptime()),
        lastCheck: new Date(),
      };

      this.lastHealthCheck = new Date();

      const checkDuration = Date.now() - startTime;
      this.logger.debug(
        `Health check completed in ${checkDuration}ms - Status: ${status}`,
      );

      return healthStatus;
    } catch (error) {
      this.logger.error(`Health check failed: ${error.message}`, error.stack);

      return {
        status: 'unhealthy',
        connections: { total: 0, healthy: 0 },
        rooms: { total: 0, active: 0 },
        memory: { used: 0, total: 0, percentage: 0 },
        uptime: 0,
        lastCheck: new Date(),
      };
    }
  }

  /**
   * Get detailed system metrics
   */
  async getDetailedMetrics() {
    try {
      const healthStatus = await this.getHealthStatus();
      const handlerStats = this.handlerRegistry.getHandlerStats();

      // Connection metrics
      const onlineUsers = await this.connectionManager.getOnlineUsers();
      const avgConnectionsPerUser =
        onlineUsers.length > 0
          ? Math.round(
              (healthStatus.connections.total / onlineUsers.length) * 100,
            ) / 100
          : 0;

      // Room metrics
      const allRoomIds = await this.roomManager.getAllRoomIds();
      const roomsByType = new Map<string, number>();

      for (const roomId of allRoomIds) {
        const roomType = this.determineRoomType(roomId);
        roomsByType.set(roomType, (roomsByType.get(roomType) || 0) + 1);
      }

      // Performance metrics
      const performanceMetrics = {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        pid: process.pid,
        ppid: process.ppid,
        uptime: process.uptime(),
      };

      return {
        ...healthStatus,
        detailed: {
          connections: {
            ...healthStatus.connections,
            uniqueUsers: onlineUsers.length,
            avgConnectionsPerUser,
          },
          rooms: {
            ...healthStatus.rooms,
            byType: Object.fromEntries(roomsByType),
          },
          handlers: {
            total: handlerStats.totalHandlers,
            byModule: Object.fromEntries(handlerStats.moduleBreakdown),
          },
          performance: performanceMetrics,
          lastUpdated: new Date(),
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to get detailed metrics: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  /**
   * Check if system is healthy
   */
  async isHealthy(): Promise<boolean> {
    try {
      const health = await this.getHealthStatus();
      return health.status === 'healthy';
    } catch (error) {
      this.logger.error(`Health check failed: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Perform system cleanup and maintenance
   */
  async performMaintenance(): Promise<{
    cleanedConnections: number;
    cleanedRooms: number;
  }> {
    try {
      this.logger.log('Starting WebSocket system maintenance...');

      // Clean up expired connections
      const cleanedConnections =
        await this.connectionManager.cleanupConnections();

      // Clean up empty rooms
      const cleanedRooms = await this.roomManager.cleanupEmptyRooms();

      this.logger.log(
        `Maintenance completed - Cleaned ${cleanedConnections} connections, ${cleanedRooms} rooms`,
      );

      return { cleanedConnections, cleanedRooms };
    } catch (error) {
      this.logger.error(`Maintenance failed: ${error.message}`, error.stack);
      return { cleanedConnections: 0, cleanedRooms: 0 };
    }
  }

  /**
   * Get health check readiness probe (for Kubernetes/Docker)
   */
  async getReadinessProbe(): Promise<{
    ready: boolean;
    checks: Record<string, boolean>;
  }> {
    try {
      const checks = {
        connectionManager: true,
        roomManager: true,
        handlerRegistry: true,
        memoryUsage: true,
      };

      // Test connection manager
      try {
        await this.connectionManager.getConnectionCount();
      } catch (error) {
        checks.connectionManager = false;
        this.logger.warn('Connection manager readiness check failed');
      }

      // Test room manager
      try {
        await this.roomManager.getRoomCount();
      } catch (error) {
        checks.roomManager = false;
        this.logger.warn('Room manager readiness check failed');
      }

      // Test handler registry
      try {
        this.handlerRegistry.getEventNames();
      } catch (error) {
        checks.handlerRegistry = false;
        this.logger.warn('Handler registry readiness check failed');
      }

      // Check memory usage
      const memoryUsage = process.memoryUsage();
      const memoryPercentage =
        (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
      if (memoryPercentage > 95) {
        checks.memoryUsage = false;
        this.logger.warn('Memory usage too high for readiness');
      }

      const ready = Object.values(checks).every((check) => check);

      return { ready, checks };
    } catch (error) {
      this.logger.error(
        `Readiness probe failed: ${error.message}`,
        error.stack,
      );
      return {
        ready: false,
        checks: {
          connectionManager: false,
          roomManager: false,
          handlerRegistry: false,
          memoryUsage: false,
        },
      };
    }
  }

  /**
   * Get liveness probe (for Kubernetes/Docker)
   */
  async getLivenessProbe(): Promise<{
    alive: boolean;
    lastHealthCheck: Date;
    uptime: number;
  }> {
    try {
      const now = new Date();
      const timeSinceLastCheck = now.getTime() - this.lastHealthCheck.getTime();
      const alive = timeSinceLastCheck < 5 * 60 * 1000; // 5 minutes threshold

      return {
        alive,
        lastHealthCheck: this.lastHealthCheck,
        uptime: process.uptime(),
      };
    } catch (error) {
      this.logger.error(`Liveness probe failed: ${error.message}`, error.stack);
      return {
        alive: false,
        lastHealthCheck: this.lastHealthCheck,
        uptime: 0,
      };
    }
  }

  private startHealthCheckMonitoring(): void {
    // Perform health checks every 2 minutes
    this.healthCheckInterval = setInterval(
      async () => {
        try {
          const health = await this.getHealthStatus();

          if (health.status !== 'healthy') {
            this.logger.warn(`System health is ${health.status}`, {
              connections: health.connections.total,
              memory: `${health.memory.percentage}%`,
              uptime: health.uptime,
            });

            // Perform maintenance if system is degraded
            if (health.status === 'degraded') {
              await this.performMaintenance();
            }
          }
        } catch (error) {
          this.logger.error('Health check monitoring error:', error);
        }
      },
      2 * 60 * 1000,
    ); // 2 minutes

    this.logger.log('Health check monitoring started');
  }

  private determineRoomType(roomId: string): string {
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
    return 'other';
  }

  onModuleDestroy() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.logger.log('Health check monitoring stopped');
    }
  }
}
