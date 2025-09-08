import { Module } from '@nestjs/common';
import { PrismaModule } from './database/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { CommentsModule } from './modules/comments/comments.module';
import { AuthModule } from './modules/auth/auth.module';
import { PostMediasModule } from './modules/post-medias/postMedias.module';
import { FriendsModule } from './modules/follow/follow.module';
import { ReactionsModule } from './modules/reactions/reactions.module';
import { CloudinaryModule } from './modules/cloudinary/cloudinary.module';
import { PostsModule } from './modules/posts/posts.module';
import { MailerModule } from './modules/mailer/mailer.module';
import { RedisCacheModule } from './modules/cache/cache.module';
import { NotificationModule } from './modules/notification/notification.module';

@Module({
  imports: [
    UsersModule,
    CommentsModule,
    AuthModule,
    PostMediasModule,
    FriendsModule,
    ReactionsModule,
    CloudinaryModule,
    PostsModule,
    MailerModule,
    RedisCacheModule,
    NotificationModule,
    PrismaModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
