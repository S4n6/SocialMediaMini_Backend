import { PostMediaEntity } from '../../domain/post-media.entity';
import {
  UploadPostMediaDto,
  UpdatePostMediaDto,
  ReorderPostMediaDto,
  GetPostMediasDto,
  PostMediaResponseDto,
  PostMediaPaginationDto,
  CloudinarySignatureDto,
} from '../dto/post-media.dto';

export interface PostMediaApplicationService {
  /**
   * Upload and create post medias
   */
  uploadPostMedias(
    files: Express.Multer.File[],
    dto: UploadPostMediaDto,
    userId: string,
  ): Promise<PostMediaResponseDto[]>;

  /**
   * Get all post medias with pagination
   */
  getAllPostMedias(dto: GetPostMediasDto): Promise<PostMediaPaginationDto>;

  /**
   * Get post medias by post ID
   */
  getPostMediasByPostId(postId: string): Promise<PostMediaResponseDto[]>;

  /**
   * Get post media by ID
   */
  getPostMediaById(id: string): Promise<PostMediaResponseDto>;

  /**
   * Update post media
   */
  updatePostMedia(
    id: string,
    dto: UpdatePostMediaDto,
    userId: string,
  ): Promise<PostMediaResponseDto>;

  /**
   * Delete post media
   */
  deletePostMedia(id: string, userId: string): Promise<void>;

  /**
   * Reorder post medias
   */
  reorderPostMedias(dto: ReorderPostMediaDto, userId: string): Promise<void>;

  /**
   * Generate Cloudinary signature for client-side uploads
   */
  generateCloudinarySignature(folder?: string): Promise<CloudinarySignatureDto>;
}

export interface PostMediaMapper {
  /**
   * Convert entity to response DTO
   */
  toDto(entity: PostMediaEntity): PostMediaResponseDto;

  /**
   * Convert array of entities to response DTOs
   */
  toDtoArray(entities: PostMediaEntity[]): PostMediaResponseDto[];

  /**
   * Convert entities with pagination info to pagination DTO
   */
  toPaginationDto(
    entities: PostMediaEntity[],
    total: number,
    page: number,
    limit: number,
  ): PostMediaPaginationDto;
}
