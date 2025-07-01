import { Module } from '@nestjs/common';
import { PostMediasService } from './post-medias.service';
import { PostMediasController } from './post-medias.controller';

@Module({
  controllers: [PostMediasController],
  providers: [PostMediasService],
})
export class PostMediasModule {}
