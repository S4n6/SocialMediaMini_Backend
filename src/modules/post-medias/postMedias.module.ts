import { Module } from '@nestjs/common';
import { PostMediasService } from './postMedias.service';
import { PostMediasController } from './postMedias.controller';

@Module({
  controllers: [PostMediasController],
  providers: [PostMediasService],
})
export class PostMediasModule {}
