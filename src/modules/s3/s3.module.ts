import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { S3Service } from './s3.service';

/**
 * S3Module provides S3Service as a low-level AWS client.
 *
 * HTTP endpoints for S3 are exposed through MediaModule's MediaController
 * (POST /media/upload/*, GET /media/credentials, DELETE /media/:id).
 * This module is imported by MediaModule and should not be imported directly
 * by feature modules — use MediaModule + MEDIA_SERVICE token instead.
 */
@Module({
  imports: [ConfigModule],
  providers: [S3Service],
  exports: [S3Service],
})
export class S3Module {}
