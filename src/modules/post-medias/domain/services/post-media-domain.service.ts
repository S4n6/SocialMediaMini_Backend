import { Injectable, Inject } from '@nestjs/common';
import { PostMediaEntity, PostMediaType } from '../post-media.entity';
import { PostMediaRepository } from '../repositories/post-media.repository';
import {
  PostMediaLimitExceededException,
  PostMediaDuplicateException,
  InvalidMediaTypeException,
} from '../post-media.exceptions';
import {
  POST_MEDIA_REPOSITORY,
  CLOUDINARY_SERVICE,
  POST_SERVICE,
} from '../../tokens';

export interface UploadedFile {
  url: string;
  type: string;
  resourceType: string;
}

export interface CloudinaryService {
  uploadMultipleFiles(
    files: Express.Multer.File[],
    folder: string,
  ): Promise<UploadedFile[]>;
  generateSignature(params: any): Promise<string>;
}

export interface PostService {
  exists(postId: string): Promise<boolean>;
  belongsToUser(postId: string, userId: string): Promise<boolean>;
}

@Injectable()
export class PostMediaDomainService {
  constructor(
    @Inject('POST_MEDIA_REPOSITORY')
    private readonly postMediaRepository: PostMediaRepository,
    @Inject(CLOUDINARY_SERVICE)
    private readonly cloudinaryService: CloudinaryService,
    @Inject('POST_SERVICE')
    private readonly postService: PostService,
  ) {}

  async uploadPostMedias(
    files: Express.Multer.File[],
    postId: string,
    userId: string,
    maxMediaPerPost: number = 10,
  ): Promise<PostMediaEntity[]> {
    // Validate post exists and user has permission
    const postExists = await this.postService.exists(postId);
    if (!postExists) {
      throw new Error('Post not found');
    }

    const userOwnsPost = await this.postService.belongsToUser(postId, userId);
    if (!userOwnsPost) {
      throw new Error('You can only add media to your own posts');
    }

    // Check media limit
    const currentMediaCount =
      await this.postMediaRepository.countByPostId(postId);
    if (currentMediaCount + files.length > maxMediaPerPost) {
      throw new PostMediaLimitExceededException(maxMediaPerPost);
    }

    // Upload files to cloud storage
    const uploadedFiles = await this.cloudinaryService.uploadMultipleFiles(
      files,
      `SocialMedia/posts/${postId}`,
    );

    // Create post media entities
    const postMediaEntities = uploadedFiles.map((file, index) => {
      const mediaType = this.mapResourceTypeToPostMediaType(
        file.resourceType || file.type,
      );

      return PostMediaEntity.create({
        url: file.url,
        type: mediaType,
        postId: postId,
        order: currentMediaCount + index + 1,
      });
    });

    // Check for duplicate URLs
    const urls = postMediaEntities.map((media) => media.url);
    const existingMedias = await this.postMediaRepository.findByUrls(urls);
    if (existingMedias.length > 0) {
      throw new PostMediaDuplicateException(existingMedias[0].url);
    }

    // Save to repository
    return await this.postMediaRepository.saveMany(postMediaEntities);
  }

  async reorderPostMedias(
    postId: string,
    userId: string,
    newOrders: Array<{ id: string; order: number }>,
  ): Promise<void> {
    // Validate post ownership
    const userOwnsPost = await this.postService.belongsToUser(postId, userId);
    if (!userOwnsPost) {
      throw new Error('You can only reorder media on your own posts');
    }

    // Validate all media belong to the post
    const postMedias = await this.postMediaRepository.findByPostId(postId);
    const postMediaIds = postMedias.map((media) => media.id);

    for (const orderItem of newOrders) {
      if (!postMediaIds.includes(orderItem.id)) {
        throw new Error(
          `Media with id ${orderItem.id} does not belong to post ${postId}`,
        );
      }
    }

    // Update orders
    await this.postMediaRepository.updateOrdersByPostId(postId, newOrders);
  }

  async generateCloudinarySignature(
    folder: string = 'SocialMedia/posts',
  ): Promise<{
    signature: string;
    timestamp: number;
    folder: string;
    apiKey: string;
    cloudName: string;
  }> {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = await this.cloudinaryService.generateSignature({
      timestamp,
      folder,
    });

    return {
      signature,
      timestamp,
      folder,
      apiKey: process.env.CLOUDINARY_API_KEY || '',
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    };
  }

  private mapResourceTypeToPostMediaType(resourceType: string): PostMediaType {
    switch (resourceType.toLowerCase()) {
      case 'image':
        return PostMediaType.IMAGE;
      case 'video':
        return PostMediaType.VIDEO;
      default:
        throw new InvalidMediaTypeException(
          `Unsupported resource type: ${resourceType}`,
        );
    }
  }
}
