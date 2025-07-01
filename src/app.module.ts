import { Module } from '@nestjs/common';
import { PrismaModule } from './database/prisma.module';
import { UsersModule } from './modules/users/users.module';
import { CommentsModule } from './modules/comments/comments.module';
import { AuthModule } from './modules/auth/auth.module';
import { PostMediasModule } from './modules/post-medias/post-medias.module';
import { FriendsModule } from './modules/friends/friends.module';
import { ReactionsModule } from './modules/reactions/reactions.module';

@Module({
  imports: [PrismaModule, UsersModule, CommentsModule, AuthModule, PostMediasModule, FriendsModule, ReactionsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
