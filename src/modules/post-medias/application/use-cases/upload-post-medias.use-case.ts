import { Injectable, Inject } from '@nestjs/common';
import { PostMediaRepository } from '../../domain/repositories/post-media.repository';
import { PostMediaDomainService } from '../../domain/services/post-media-domain.service';
import { PostMediaFactory } from '../../domain/factories/post-media.factory';
import { PostMediaEntity } from '../../domain/post-media.entity';
import { PostMediaUploadFailedException } from '../../domain/post-media.exceptions';

export interface UploadPostMediasCommand {
  files: Express.Multer.File[];
  postId: string;
  userId: string;
  maxMediaPerPost?: number;
}

@Injectable()
export class UploadPostMediasUseCase {
  constructor(
    @Inject('POST_MEDIA_REPOSITORY')
    private readonly postMediaRepository: PostMediaRepository,
    private readonly postMediaDomainService: PostMediaDomainService,
  ) {}

  async execute(command: UploadPostMediasCommand): Promise<PostMediaEntity[]> {
    try {
      // Validate files
      if (!command.files || command.files.length === 0) {
        throw new PostMediaUploadFailedException(
          'At least one file is required',
        );
      }

      // Validate file types
      for (const file of command.files) {
        PostMediaFactory.validateAndGetTypeFromMimetype(file.mimetype);
      }

      // Use domain service to handle the upload logic
      const uploadedMedias = await this.postMediaDomainService.uploadPostMedias(
        command.files,
        command.postId,
        command.userId,
        command.maxMediaPerPost || 10,
      );

      return uploadedMedias;
    } catch (error) {
      if (error instanceof PostMediaUploadFailedException) {
        throw error;
      }
      throw new PostMediaUploadFailedException(
        error.message || 'Unknown upload error',
      );
    }
  }
}
