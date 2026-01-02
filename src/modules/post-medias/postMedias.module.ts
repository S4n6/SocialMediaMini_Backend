import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

// Presentation Layer
import { PostMediasController } from './presentation/controllers';

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
} from './application/use-cases';

// Application Services
import {
  PostMediaApplicationServiceImpl,
  PostMediaMapperImpl,
} from './application';

// Infrastructure Layer
import {
  PostMediaPrismaRepository,
  CloudinaryAdapter,
  PostServiceAdapter,
} from './infrastructure';

// Tokens
import {
  POST_MEDIA_REPOSITORY,
  CLOUDINARY_SERVICE,
  POST_SERVICE,
} from './tokens';

@Module({
  imports: [PrismaModule, CloudinaryModule],
  controllers: [PostMediasController],
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
    CreatePostMediasFromUrlsUseCase,

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
