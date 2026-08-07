import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { S3Module } from '../s3/s3.module';
import { S3Service } from '../s3/s3.service';
import { CloudinaryMediaAdapter } from './adapters/cloudinary.media-adapter';
import { S3MediaAdapter } from './adapters/s3.media-adapter';
import { MediaController } from './media.controller';
import { MEDIA_SERVICE } from './media.tokens';
import { IMediaService } from './media.interface';

/**
 * MediaModule — the single source of truth for file media.
 *
 * Switch providers by setting the environment variable:
 *   MEDIA_PROVIDER=cloudinary   (default)
 *   MEDIA_PROVIDER=s3
 *
 * Adding a new provider:
 *   1. Implement IMediaService in a new adapter class.
 *   2. Add the new platform module to `imports` below (optional).
 *   3. Add a branch in the useFactory below.
 *   4. Set MEDIA_PROVIDER=<your-new-provider>.
 */
@Module({
  imports: [
    ConfigModule,
    CloudinaryModule,
    // S3Module is always imported so NestJS can resolve S3Service for the
    // factory, but S3Service is now lazy — it never crashes when AWS env
    // vars are absent (it only throws at call-time).
    S3Module,
  ],
  controllers: [MediaController],
  providers: [
    CloudinaryMediaAdapter,
    S3MediaAdapter,
    {
      provide: MEDIA_SERVICE,
      useFactory: (
        config: ConfigService,
        cloudinaryAdapter: CloudinaryMediaAdapter,
        s3Adapter: S3MediaAdapter,
      ): IMediaService => {
        const provider = config.get<string>('MEDIA_PROVIDER', 'cloudinary');

        switch (provider) {
          case 's3':
            return s3Adapter;
          case 'cloudinary':
          default:
            return cloudinaryAdapter;
        }
      },
      inject: [ConfigService, CloudinaryMediaAdapter, S3MediaAdapter],
    },
  ],
  // Export MEDIA_SERVICE so any module that imports MediaModule can inject
  // IMediaService without knowing the concrete provider.
  exports: [MEDIA_SERVICE],
})
export class MediaModule {}
