import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './database/prisma.service';
import { ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './shared/filters/global-exception.filter';
import { ErrorMonitoringService } from './shared/services/error-monitoring.service';

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

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Server is running on: ${await app.getUrl()}`);
}
bootstrap();
