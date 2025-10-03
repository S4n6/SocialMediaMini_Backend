import { Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { CloudinaryController } from './cloudinary.controller';
import { CloudinaryConfig } from '../../config/cloudinary.config';

@Module({
  controllers: [CloudinaryController],
  providers: [CloudinaryService, CloudinaryConfig],
  exports: [CloudinaryService],
})
export class CloudinaryModule {}
