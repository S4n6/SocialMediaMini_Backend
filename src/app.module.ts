import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { PrismaModule } from './database/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { CommentsModule } from './modules/comments/comments.module';
import { AuthModule } from './modules/auth/auth.module';
import { PostMediasModule } from './modules/post-medias/postMedias.module';
import { FollowsModule } from './modules/follow/follow.module';
import { ReactionsModule } from './modules/reactions/reactions.module';
import { CloudinaryModule } from './modules/cloudinary/cloudinary.module';
import { PostsModule } from './modules/posts/posts.module';
import { MailerModule } from './modules/mailer/mailer.module';
import { RedisCacheModule } from './modules/cache/cache.module';
import { NotificationModule } from './modules/notification/notification.module';
import { SearchHistoryModule } from './modules/search-history/search-history.module';
import { MessagingModule } from './modules/messaging/messaging.module';
import {
  CorsMiddleware,
  RateLimitMiddleware,
  RequestLoggerMiddleware,
  SecurityLoggerMiddleware,
  CookieParserMiddleware,
  SecurityHeadersMiddleware,
  FileUploadSecurityMiddleware,
  WebSocketSecurityMiddleware,
} from './shared/middlewares';
import { ErrorMonitoringService } from './shared/services/error-monitoring.service';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    // CommentsModule,
    // PostMediasModule,
    // FollowsModule,
    // ReactionsModule,
    // CloudinaryModule,
    // PostsModule,
    MailerModule,
    RedisCacheModule,
    NotificationModule,
    // SearchHistoryModule,
    // MessagingModule,
    PrismaModule,
  ],
  controllers: [],
  providers: [ErrorMonitoringService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply middleware in order of execution

    // 1. Security headers - first for all requests
    consumer.apply(SecurityHeadersMiddleware).forRoutes('*');

    // 2. CORS - before any processing
    consumer.apply(CorsMiddleware).forRoutes('*');

    // 3. Cookie parser - needed for auth
    consumer.apply(CookieParserMiddleware).forRoutes('*');

    // 4. Request logging - general logging
    // consumer.apply(RequestLoggerMiddleware).forRoutes('*');

    // 5. Security logging - sensitive operations
    consumer.apply(SecurityLoggerMiddleware).forRoutes('*');

    // 6. Rate limiting - protect against abuse
    consumer.apply(RateLimitMiddleware).forRoutes('*');

    // 7. File upload security - apply globally but middleware will only act on upload/cloudinary paths
    consumer.apply(FileUploadSecurityMiddleware).forRoutes('*');

    // 8. WebSocket security - Socket.IO routes
    consumer.apply(WebSocketSecurityMiddleware).forRoutes('/socket.io/*path');
  }
}
