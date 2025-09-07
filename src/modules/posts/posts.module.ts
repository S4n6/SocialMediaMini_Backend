import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { PrismaModule } from '../../database/prisma.module';
import { RedisCacheModule } from '../cache/cache.module';
import { PostMediasModule } from '../post-medias/postMedias.module';

@Module({
  imports: [PrismaModule, RedisCacheModule, PostMediasModule],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],


})
export class PostsModule {}
