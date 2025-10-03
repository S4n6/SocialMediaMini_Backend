import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

// Presentation Layer
import { PostMediasController } from './presentation/post-medias.controller';

// Application Layer
import { PostMediaApplicationServiceImpl } from './application/post-media-application.service';
import { PostMediaMapperImpl } from './application/mappers/post-media.mapper';

// Use Cases
import { UploadPostMediasUseCase } from './application/use-cases/upload-post-medias.use-case';
import { GetAllPostMediasUseCase } from './application/use-cases/get-all-post-medias.use-case';
import { GetPostMediaByIdUseCase } from './application/use-cases/get-post-media-by-id.use-case';
import { GetPostMediasByPostIdUseCase } from './application/use-cases/get-post-medias-by-post-id.use-case';
import { UpdatePostMediaUseCase } from './application/use-cases/update-post-media.use-case';
import { DeletePostMediaUseCase } from './application/use-cases/delete-post-media.use-case';
import { ReorderPostMediasUseCase } from './application/use-cases/reorder-post-medias.use-case';
import { GenerateCloudinarySignatureUseCase } from './application/use-cases/generate-cloudinary-signature.use-case';

// Domain Layer
import { PostMediaDomainService } from './domain/services/post-media-domain.service';

// Infrastructure Layer
import { PostMediaPrismaRepository } from './infrastructure/post-media.prisma.repository';
import { CloudinaryAdapter } from './infrastructure/cloudinary.adapter';
import { PostServiceAdapter } from './infrastructure/post.adapter';

// Tokens
import {
  POST_MEDIA_APPLICATION_SERVICE,
  POST_MEDIA_REPOSITORY,
  CLOUDINARY_SERVICE,
  POST_SERVICE,
} from './tokens';

@Module({
  imports: [PrismaModule, CloudinaryModule],
  controllers: [PostMediasController],
  providers: [
    // Application Services
    {
      provide: POST_MEDIA_APPLICATION_SERVICE,
      useClass: PostMediaApplicationServiceImpl,
    },
    PostMediaMapperImpl,

    // Use Cases
    UploadPostMediasUseCase,
    GetAllPostMediasUseCase,
    GetPostMediaByIdUseCase,
    GetPostMediasByPostIdUseCase,
    UpdatePostMediaUseCase,
    DeletePostMediaUseCase,
    ReorderPostMediasUseCase,
    GenerateCloudinarySignatureUseCase,

    // Domain Services
    PostMediaDomainService,

    // Domain Service Implementations
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
  exports: [
    POST_MEDIA_APPLICATION_SERVICE,
    POST_MEDIA_REPOSITORY,
    PostMediaDomainService,
  ],
})
export class PostMediasModule {}
