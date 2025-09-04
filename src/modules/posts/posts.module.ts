import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { PrismaModule } from '../../database/prisma.module';
import { RedisCacheModule } from '../cache/cache.module';

@Module({
  imports: [PrismaModule, RedisCacheModule],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
