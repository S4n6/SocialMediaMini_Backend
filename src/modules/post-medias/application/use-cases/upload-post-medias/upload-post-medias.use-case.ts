import { Injectable, Inject } from '@nestjs/common';
import { PostMediaRepository } from '../../ports/repositories/post-media.repository';
import { CloudinaryService } from '../../ports/services/cloudinary.service';
import { PostService } from '../../ports/services/post.service';
import { PostMediaEntity } from '../../../domain/post-media.entity';
import {
  PostMediaUploadFailedException,
  PostMediaLimitExceededException,
  PostMediaDuplicateException,
  InvalidMediaTypeException,
} from '../../../domain/post-media.exceptions';
import { PostMediaFactory } from '../../../infrastructure/factories/post-media.factory';
import {
  POST_MEDIA_REPOSITORY,
  CLOUDINARY_SERVICE,
  POST_SERVICE,
} from '../../../tokens';

export interface UploadPostMediasCommand {
  files: Express.Multer.File[];
  postId: string;
  userId: string;
  maxMediaPerPost?: number;
}

@Injectable()
export class UploadPostMediasUseCase {
  constructor(
    @Inject(POST_MEDIA_REPOSITORY)
    private readonly postMediaRepository: PostMediaRepository,
    @Inject(CLOUDINARY_SERVICE)
    private readonly cloudinaryService: CloudinaryService,
    @Inject(POST_SERVICE)
    private readonly postService: PostService,
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

      // Validate post exists and user has permission
      const postExists = await this.postService.exists(command.postId);
      if (!postExists) {
        throw new PostMediaUploadFailedException('Post not found');
      }

      const userOwnsPost = await this.postService.belongsToUser(
        command.postId,
        command.userId,
      );
      if (!userOwnsPost) {
        throw new PostMediaUploadFailedException(
          'You can only add media to your own posts',
        );
      }

      // Check media limit
      const maxMediaPerPost = command.maxMediaPerPost || 10;
      const currentMediaCount = await this.postMediaRepository.countByPostId(
        command.postId,
      );

      if (currentMediaCount + command.files.length > maxMediaPerPost) {
        throw new PostMediaLimitExceededException(maxMediaPerPost);
      }

      // Upload files to cloud storage
      const uploadedFiles = await this.cloudinaryService.uploadMultipleFiles(
        command.files,
        `SocialMedia/posts/${command.postId}`,
      );

      // Create post media entities
      const postMediaEntities = PostMediaFactory.createFromUploadedFiles(
        uploadedFiles,
        command.postId,
        currentMediaCount + 1,
      );

      // Check for duplicate URLs
      const urls = postMediaEntities.map((media) => media.url);
      const existingMedias = await this.postMediaRepository.findByUrls(urls);
      if (existingMedias.length > 0) {
        throw new PostMediaDuplicateException(existingMedias[0].url);
      }

      // Save to repository
      return await this.postMediaRepository.saveMany(postMediaEntities);
    } catch (error) {
      if (
        error instanceof PostMediaUploadFailedException ||
        error instanceof PostMediaLimitExceededException ||
        error instanceof PostMediaDuplicateException ||
        error instanceof InvalidMediaTypeException
      ) {
        throw error;
      }
      throw new PostMediaUploadFailedException(
        error.message || 'Unknown upload error',
      );
    }
  }
}
