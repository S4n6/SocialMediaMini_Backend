import { INestApplicationContext, Logger } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import { ServerOptions } from 'socket.io';

/**
 * Redis IO Adapter for Socket.IO
 *
 * Enables cross-instance WebSocket broadcasting when scaling to multiple
 * NestJS server nodes. Without this, User A on Instance 1 cannot receive
 * messages from User B on Instance 2.
 *
 * How it works:
 * - Each Socket.IO server publishes events to a Redis pub/sub channel
 * - All server instances subscribe to the same channel
 * - When Instance 1 emits to a room, Redis relays the event to all instances
 * - Each instance checks if it has sockets in that room and delivers locally
 *
 * Setup flow:
 * 1. main.ts calls `adapter.connectToRedis()` before `app.listen()`
 * 2. `createIOServer()` attaches the Redis adapter to the Socket.IO server
 * 3. All subsequent `.to(room).emit()` calls are automatically broadcast
 */
export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter> | null = null;
  private readonly logger = new Logger(RedisIoAdapter.name);

  constructor(app: INestApplicationContext) {
    super(app);
  }

  /**
   * Connect pub/sub Redis clients for the Socket.IO adapter.
   * Must be called BEFORE app.listen().
   */
  async connectToRedis(): Promise<void> {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      this.logger.warn(
        'REDIS_URL not set — falling back to in-memory adapter (no cross-instance broadcasting)',
      );
      return;
    }

    try {
      const pubClient = new Redis(redisUrl, {
        lazyConnect: true,
        retryStrategy: (times) => Math.min(times * 200, 5000),
      });
      const subClient = pubClient.duplicate();

      await Promise.all([pubClient.connect(), subClient.connect()]);

      pubClient.on('error', (err) =>
        this.logger.error(`Redis pub client error: ${err.message}`),
      );
      subClient.on('error', (err) =>
        this.logger.error(`Redis sub client error: ${err.message}`),
      );

      this.adapterConstructor = createAdapter(pubClient, subClient);
      this.logger.log(
        '✅ Redis IO Adapter connected — cross-instance broadcasting enabled',
      );
    } catch (error) {
      this.logger.error(`Failed to connect Redis IO Adapter: ${error.message}`);
      this.logger.warn('Falling back to in-memory adapter');
    }
  }

  createIOServer(port: number, options?: Partial<ServerOptions>): any {
    const server = super.createIOServer(port, {
      ...options,
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
      },
      transports: ['websocket', 'polling'],
      pingInterval: 25000,
      pingTimeout: 20000,
      maxHttpBufferSize: 1e6, // 1MB max payload
    });

    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor);
    }

    return server;
  }
}
