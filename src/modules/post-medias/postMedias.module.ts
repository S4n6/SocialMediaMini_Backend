import { Module } from '@nestjs/common';
import { PostMediasService } from './postMedias.service';
import { PostMediasController } from './postMedias.controller';
import { PrismaModule } from '../../database/prisma.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [PrismaModule, CloudinaryModule],
  controllers: [PostMediasController],
  providers: [PostMediasService],
  exports: [PostMediasService],
})
export class PostMediasModule {}