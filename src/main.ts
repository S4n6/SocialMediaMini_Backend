import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './shared/filters/global-exception.filter';
import { ErrorMonitoringService } from './shared/services/error-monitoring.service';
import { RedisIoAdapter } from './infrastructure/websocket/adapters/redis-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global pipes for validation
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Get ErrorMonitoringService instance for dependency injection
  const errorMonitoringService = app.get(ErrorMonitoringService);

  // Global exception filter for centralized error handling
  app.useGlobalFilters(new GlobalExceptionFilter(errorMonitoringService));

  // ── WebSocket: Redis Adapter for multi-instance scaling ──
  // When running 2+ server instances behind a load balancer, the Redis adapter
  // ensures that socket.io events (room broadcasts, user emissions) are relayed
  // across all nodes. Without this, User A on Instance 1 cannot receive messages
  // from User B on Instance 2.
  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Server is running on: ${await app.getUrl()}`);
}
bootstrap();
