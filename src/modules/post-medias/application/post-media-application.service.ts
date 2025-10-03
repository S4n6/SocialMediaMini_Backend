import { Injectable } from '@nestjs/common';
import { PostMediaApplicationService } from './interfaces/post-media-application.interface';
import { PostMediaMapperImpl } from './mappers/post-media.mapper';
import {
  UploadPostMediaDto,
  UpdatePostMediaDto,
  ReorderPostMediaDto,
  GetPostMediasDto,
  PostMediaResponseDto,
  PostMediaPaginationDto,
  CloudinarySignatureDto,
} from './dto/post-media.dto';

// Use cases imports
import { UploadPostMediasUseCase } from './use-cases/upload-post-medias.use-case';
import { GetAllPostMediasUseCase } from './use-cases/get-all-post-medias.use-case';
import { GetPostMediaByIdUseCase } from './use-cases/get-post-media-by-id.use-case';
import { GetPostMediasByPostIdUseCase } from './use-cases/get-post-medias-by-post-id.use-case';
import { UpdatePostMediaUseCase } from './use-cases/update-post-media.use-case';
import { DeletePostMediaUseCase } from './use-cases/delete-post-media.use-case';
import { ReorderPostMediasUseCase } from './use-cases/reorder-post-medias.use-case';
import { GenerateCloudinarySignatureUseCase } from './use-cases/generate-cloudinary-signature.use-case';

@Injectable()
export class PostMediaApplicationServiceImpl
  implements PostMediaApplicationService
{
  constructor(
    private readonly uploadPostMediasUseCase: UploadPostMediasUseCase,
    private readonly getAllPostMediasUseCase: GetAllPostMediasUseCase,
    private readonly getPostMediaByIdUseCase: GetPostMediaByIdUseCase,
    private readonly getPostMediasByPostIdUseCase: GetPostMediasByPostIdUseCase,
    private readonly updatePostMediaUseCase: UpdatePostMediaUseCase,
    private readonly deletePostMediaUseCase: DeletePostMediaUseCase,
    private readonly reorderPostMediasUseCase: ReorderPostMediasUseCase,
    private readonly generateCloudinarySignatureUseCase: GenerateCloudinarySignatureUseCase,
    private readonly postMediaMapper: PostMediaMapperImpl,
  ) {}

  async uploadPostMedias(
    files: Express.Multer.File[],
    dto: UploadPostMediaDto,
    userId: string,
  ): Promise<PostMediaResponseDto[]> {
    const entities = await this.uploadPostMediasUseCase.execute({
      files,
      postId: dto.postId,
      userId,
    });

    return this.postMediaMapper.toDtoArray(entities);
  }

  async getAllPostMedias(
    dto: GetPostMediasDto,
  ): Promise<PostMediaPaginationDto> {
    const result = await this.getAllPostMediasUseCase.execute({
      page: dto.page || 1,
      limit: dto.limit || 20,
    });

    return this.postMediaMapper.toPaginationDto(
      result.items,
      result.total,
      result.page,
      result.limit,
    );
  }

  async getPostMediasByPostId(postId: string): Promise<PostMediaResponseDto[]> {
    const entities = await this.getPostMediasByPostIdUseCase.execute({
      postId,
    });
    return this.postMediaMapper.toDtoArray(entities);
  }

  async getPostMediaById(id: string): Promise<PostMediaResponseDto> {
    const entity = await this.getPostMediaByIdUseCase.execute({ id });
    return this.postMediaMapper.toDto(entity);
  }

  async updatePostMedia(
    id: string,
    dto: UpdatePostMediaDto,
    userId: string,
  ): Promise<PostMediaResponseDto> {
    const entity = await this.updatePostMediaUseCase.execute({
      id,
      userId,
      url: dto.url,
      order: dto.order,
    });

    return this.postMediaMapper.toDto(entity);
  }

  async deletePostMedia(id: string, userId: string): Promise<void> {
    await this.deletePostMediaUseCase.execute({ id, userId });
  }

  async reorderPostMedias(
    dto: ReorderPostMediaDto,
    userId: string,
  ): Promise<void> {
    await this.reorderPostMediasUseCase.execute({
      postId: dto.postId,
      userId,
      newOrders: dto.orders,
    });
  }

  async generateCloudinarySignature(
    folder?: string,
  ): Promise<CloudinarySignatureDto> {
    const result = await this.generateCloudinarySignatureUseCase.execute({
      folder,
    });

    return {
      signature: result.signature,
      timestamp: result.timestamp,
      folder: result.folder,
      apiKey: result.apiKey,
      cloudName: result.cloudName,
    };
  }
}
