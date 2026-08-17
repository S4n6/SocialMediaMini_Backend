import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaModule } from './database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TestModule } from './modules/test/test.module';
import { MailerModule } from './modules/mailer/mailer.module';
import { RedisCacheModule } from './modules/cache/cache.module';
import { MediaModule } from './modules/media/media.module';
import { PostMediasModule } from './modules/post-medias/postMedias.module';
import { PostsModule } from './modules/posts/posts.module';
import { StoryModule } from './modules/story/story.module';
import { MessageQueueModule } from './infrastructure/message-queue';
import { NotificationModule } from './modules/notification/notification.module';

import {
  CorsMiddleware,
  RateLimitMiddleware,
  RequestLoggerMiddleware,
  SecurityLoggerMiddleware,
  CookieParserMiddleware,
  SecurityHeadersMiddleware,
  FileUploadSecurityMiddleware,
} from './shared/middlewares';
import { ErrorMonitoringService } from './shared/services/error-monitoring.service';
import { ReactionsModule } from './modules/reactions/reactions.module';

@Module({
  imports: [
    // System Configuration
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: false,
      ignoreErrors: false,
    }),

    // Database & Infrastructure
    PrismaModule,
    MessageQueueModule,

    // Shared Services
    MailerModule,
    RedisCacheModule,
    // MediaModule: set MEDIA_PROVIDER=cloudinary (default) or s3
    MediaModule,

    // ✅ Core Modules (Clean Architecture)
    AuthModule,
    UsersModule,
    PostMediasModule,
    PostsModule,
    StoryModule,
    NotificationModule,
    ReactionsModule,

    // 🧪 Test Module
    TestModule,
  ],
  controllers: [],
  providers: [ErrorMonitoringService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply middleware in order of execution
    consumer.apply(SecurityHeadersMiddleware).forRoutes('*');
    consumer.apply(CorsMiddleware).forRoutes('*');
    consumer.apply(CookieParserMiddleware).forRoutes('*');
    // consumer.apply(RequestLoggerMiddleware).forRoutes('*');
    consumer.apply(SecurityLoggerMiddleware).forRoutes('*');
    // consumer.apply(RateLimitMiddleware).forRoutes('*');
    consumer.apply(FileUploadSecurityMiddleware).forRoutes('*');
  }
}
