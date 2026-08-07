import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../database/prisma.module';
import { MediaModule } from '../media/media.module';
import { MEDIA_SERVICE } from '../media/media.tokens';

// Presentation Layer
import {
  PostMediasController,
  MediaCallbackController,
  MediaSseController,
} from './presentation/controllers';

// Use Cases
import {
  UploadPostMediasUseCase,
  GetAllPostMediasUseCase,
  GetPostMediaByIdUseCase,
  GetPostMediasByPostIdUseCase,
  UpdatePostMediaUseCase,
  DeletePostMediaUseCase,
  ReorderPostMediasUseCase,
  GenerateCloudinarySignatureUseCase,
  CreatePostMediasFromUrlsUseCase,
  CleanupMediaUseCase,
  CompleteMediaProcessingUseCase,
} from './application/use-cases';

// Application Services
import {
  PostMediaApplicationServiceImpl,
  PostMediaMapperImpl,
} from './application';

// Subscribers
import { MediaProcessingSubscriber } from './application/subscribers';

// Infrastructure Layer
import {
  PostMediaPrismaRepository,
  PostServiceAdapter,
  MediaSseService,
} from './infrastructure';

// Guards
import { WorkerSecretGuard } from '../../shared/guards/worker-secret.guard';

// Tokens
import {
  POST_MEDIA_REPOSITORY,
  CLOUDINARY_SERVICE,
  POST_SERVICE,
} from './tokens';

@Module({
  imports: [
    PrismaModule,
    // MediaModule replaces CloudinaryModule — it provides the active
    // media provider (Cloudinary or S3) based on MEDIA_PROVIDER env var.
    MediaModule,
    ConfigModule,
  ],
  controllers: [
    PostMediasController,
    MediaCallbackController,
    MediaSseController,
  ],
  providers: [
    // Use Cases
    UploadPostMediasUseCase,
    GetAllPostMediasUseCase,
    GetPostMediaByIdUseCase,
    GetPostMediasByPostIdUseCase,
    UpdatePostMediaUseCase,
    DeletePostMediaUseCase,
    ReorderPostMediasUseCase,
    GenerateCloudinarySignatureUseCase,
    CreatePostMediasFromUrlsUseCase,
    CleanupMediaUseCase,
    CompleteMediaProcessingUseCase,

    // Guards
    WorkerSecretGuard,

    // Subscribers
    MediaProcessingSubscriber,

    // SSE Infrastructure
    MediaSseService,

    // Application Services
    PostMediaApplicationServiceImpl,
    PostMediaMapperImpl,

    // Wire CLOUDINARY_SERVICE → MEDIA_SERVICE so all existing use-cases
    // that still inject CLOUDINARY_SERVICE continue to work unchanged.
    // Once all use-cases are updated to use MEDIA_SERVICE directly this
    // alias provider can be removed.
    {
      provide: CLOUDINARY_SERVICE,
      useExisting: MEDIA_SERVICE,
    },
    {
      provide: POST_SERVICE,
      useClass: PostServiceAdapter,
    },

    // Repository Implementations
    {
      provide: POST_MEDIA_REPOSITORY,
      useClass: PostMediaPrismaRepository,
    },
  ],
  exports: [POST_MEDIA_REPOSITORY, CreatePostMediasFromUrlsUseCase],
})
export class PostMediasModule {}
