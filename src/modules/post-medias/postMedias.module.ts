import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

// Presentation Layer
import { PostMediasController } from './presentation/controllers/post-medias.controller';

// Use Cases
import { UploadPostMediasUseCase } from './application/use-cases/upload-post-medias/upload-post-medias.use-case';
import { GetAllPostMediasUseCase } from './application/use-cases/get-all-post-medias/get-all-post-medias.use-case';
import { GetPostMediaByIdUseCase } from './application/use-cases/get-post-media-by-id/get-post-media-by-id.use-case';
import { GetPostMediasByPostIdUseCase } from './application/use-cases/get-post-medias-by-post-id/get-post-medias-by-post-id.use-case';
import { UpdatePostMediaUseCase } from './application/use-cases/update-post-media/update-post-media.use-case';
import { DeletePostMediaUseCase } from './application/use-cases/delete-post-media/delete-post-media.use-case';
import { ReorderPostMediasUseCase } from './application/use-cases/reorder-post-medias/reorder-post-medias.use-case';
import { GenerateCloudinarySignatureUseCase } from './application/use-cases/generate-cloudinary-signature/generate-cloudinary-signature.use-case';
import { CreatePostMediasFromUrlsUseCase } from './application/use-cases/create-post-medias-from-urls/create-post-medias-from-urls.use-case';
import { CleanupMediaUseCase } from './application/use-cases/cleanup-media/cleanup-media.use-case';

// Application Services
import { PostMediaApplicationServiceImpl } from './application/post-media-application.service';
import { PostMediaMapperImpl } from './application/mappers/post-media.mapper';

// Infrastructure Layer
import { PostMediaPrismaRepository } from './infrastructure/repositories/post-media.prisma.repository';
import { CloudinaryAdapter } from './infrastructure/services/cloudinary.adapter';
import { PostServiceAdapter } from './infrastructure/services/post.adapter';

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
