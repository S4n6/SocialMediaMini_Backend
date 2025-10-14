import {
  PostMediaEntity,
  PostMediaType,
  PostMediaProps,
} from '../../domain/post-media.entity';
import {
  InvalidPostMediaException,
  InvalidMediaTypeException,
} from '../../domain/post-media.exceptions';

export interface CreatePostMediaParams {
  url: string;
  type: PostMediaType | string;
  postId: string;
  order: number;
}

export interface PostMediaFromPersistenceParams extends PostMediaProps {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export class PostMediaFactory {
  /**
   * Create a new post media entity
   */
  static create(params: CreatePostMediaParams): PostMediaEntity {
    // Validate and normalize type
    const normalizedType = this.normalizeMediaType(params.type);

    // Validate required fields
    if (!params.url?.trim()) {
      throw new InvalidPostMediaException('URL is required');
    }

    if (!params.postId?.trim()) {
      throw new InvalidPostMediaException('Post ID is required');
    }

    if (params.order < 1) {
      throw new InvalidPostMediaException('Order must be greater than 0');
    }

    return PostMediaEntity.create({
      url: params.url.trim(),
      type: normalizedType,
      postId: params.postId.trim(),
      order: params.order,
    });
  }

  /**
   * Create multiple post media entities from uploaded files
   */
  static createFromUploadedFiles(
    uploadedFiles: Array<{ url: string; type: string; resourceType?: string }>,
    postId: string,
    startOrder: number = 1,
  ): PostMediaEntity[] {
    return uploadedFiles.map((file, index) => {
      const type = this.normalizeMediaType(file.resourceType || file.type);

      return this.create({
        url: file.url,
        type,
        postId,
        order: startOrder + index,
      });
    });
  }

  /**
   * Reconstruct entity from database data
   */
  static fromPersistence(
    data: PostMediaFromPersistenceParams,
  ): PostMediaEntity {
    return PostMediaEntity.fromPersistence({
      id: data.id,
      url: data.url,
      type: this.normalizeMediaType(data.type),
      postId: data.postId,
      order: data.order,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  /**
   * Create entities from array of persistence data
   */
  static fromPersistenceArray(
    dataArray: PostMediaFromPersistenceParams[],
  ): PostMediaEntity[] {
    return dataArray.map((data) => this.fromPersistence(data));
  }

  /**
   * Normalize media type string to enum
   */
  private static normalizeMediaType(
    type: PostMediaType | string,
  ): PostMediaType {
    if (typeof type === 'string') {
      const normalizedType = type.toLowerCase();

      switch (normalizedType) {
        case 'image':
        case PostMediaType.IMAGE:
          return PostMediaType.IMAGE;
        case 'video':
        case PostMediaType.VIDEO:
          return PostMediaType.VIDEO;
        default:
          throw new InvalidMediaTypeException(`Invalid media type: ${type}`);
      }
    }

    if (Object.values(PostMediaType).includes(type)) {
      return type;
    }

    throw new InvalidMediaTypeException(`Invalid media type: ${type}`);
  }

  /**
   * Validate file type from mimetype
   */
  static validateAndGetTypeFromMimetype(mimetype: string): PostMediaType {
    if (mimetype.startsWith('image/')) {
      return PostMediaType.IMAGE;
    }

    if (mimetype.startsWith('video/')) {
      return PostMediaType.VIDEO;
    }

    throw new InvalidMediaTypeException(`Unsupported file type: ${mimetype}`);
  }
}
