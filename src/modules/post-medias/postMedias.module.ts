import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../database/prisma.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

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
  CloudinaryAdapter,
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
  imports: [PrismaModule, CloudinaryModule, ConfigModule],
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

    // Service Implementations
    {
      provide: CLOUDINARY_SERVICE,
      useClass: CloudinaryAdapter,
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
