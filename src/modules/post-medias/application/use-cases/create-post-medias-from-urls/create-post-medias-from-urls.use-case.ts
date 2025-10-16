import { Inject, Injectable } from '@nestjs/common';
import { POST_MEDIA_REPOSITORY } from '../../../tokens';
import { PostMediaRepository } from '../../ports/repositories/post-media.repository';
import {
  PostMediaEntity,
  PostMediaType,
} from '../../../domain/post-media.entity';
import { CreatePostMediasFromUrlsCommand } from './create-post-medias-from-urls.command';
import { CreatePostMediasFromUrlsResponse } from './create-post-medias-from-urls.response';
import {
  TooManyMediaFilesException,
  InvalidPostMediaException,
} from '../../../domain/post-media.exceptions';

@Injectable()
export class CreatePostMediasFromUrlsUseCase {
  constructor(
    @Inject(POST_MEDIA_REPOSITORY)
    private readonly postMediaRepository: PostMediaRepository,
  ) {}

  async execute(
    command: CreatePostMediasFromUrlsCommand,
  ): Promise<CreatePostMediasFromUrlsResponse> {
    const { medias, postId, userId, maxMediaPerPost = 10 } = command;

    // Validate maximum number of media files
    if (medias.length > maxMediaPerPost) {
      throw new TooManyMediaFilesException(
        `Maximum ${maxMediaPerPost} media files allowed per post`,
      );
    }

    // Get existing medias for the post to check total count
    const existingMedias = await this.postMediaRepository.findByPostId(postId);
    const totalAfterCreation = existingMedias.length + medias.length;

    if (totalAfterCreation > maxMediaPerPost) {
      throw new TooManyMediaFilesException(
        `Total media files would exceed maximum of ${maxMediaPerPost}. Current: ${existingMedias.length}, Adding: ${medias.length}`,
      );
    }

    // Validate URLs and types
    this.validateMediaInputs(medias);

    // Determine the starting order for new medias
    const maxExistingOrder =
      existingMedias.length > 0
        ? Math.max(...existingMedias.map((m) => m.order))
        : 0;

    // Create PostMediaEntity instances
    const postMediaEntities = medias.map((media, index) => {
      const order = media.order || maxExistingOrder + index + 1;

      return new PostMediaEntity({
        url: media.url,
        type: media.type,
        postId,
        order,
      });
    });

    // Save all medias in a batch
    const savedMedias =
      await this.postMediaRepository.saveMany(postMediaEntities);

    return {
      medias: savedMedias,
      totalCreated: savedMedias.length,
    };
  }

  private validateMediaInputs(
    medias: { url: string; type: PostMediaType; order?: number }[],
  ): void {
    for (const media of medias) {
      // Validate URL format
      try {
        new URL(media.url);
      } catch {
        throw new InvalidPostMediaException(`Invalid URL format: ${media.url}`);
      }

      // Validate media type
      if (!Object.values(PostMediaType).includes(media.type)) {
        throw new InvalidPostMediaException(
          `Invalid media type: ${media.type}. Must be one of: ${Object.values(PostMediaType).join(', ')}`,
        );
      }

      // Validate order if provided
      if (media.order !== undefined && (media.order < 1 || media.order > 10)) {
        throw new InvalidPostMediaException(
          `Invalid order: ${media.order}. Must be between 1 and 10`,
        );
      }
    }

    // Check for duplicate orders if any orders are specified
    const specifiedOrders = medias
      .filter((m) => m.order !== undefined)
      .map((m) => m.order!);

    const uniqueOrders = new Set(specifiedOrders);
    if (specifiedOrders.length !== uniqueOrders.size) {
      throw new InvalidPostMediaException(
        'Duplicate order values are not allowed',
      );
    }
  }
}
