import { Injectable } from '@nestjs/common';
import { PostMediaEntity } from '../../domain/post-media.entity';
import {
  PostMediaResponseDto,
  PostMediaPaginationDto,
} from '../dto/post-media.dto';
import { PostMediaMapper } from '../interfaces/post-media-application.interface';

@Injectable()
export class PostMediaMapperImpl implements PostMediaMapper {
  toDto(entity: PostMediaEntity): PostMediaResponseDto {
    return {
      id: entity.id,
      url: entity.url,
      type: entity.type,
      postId: entity.postId,
      order: entity.order,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  toDtoArray(entities: PostMediaEntity[]): PostMediaResponseDto[] {
    return entities.map((entity) => this.toDto(entity));
  }

  toPaginationDto(
    entities: PostMediaEntity[],
    total: number,
    page: number,
    limit: number,
  ): PostMediaPaginationDto {
    const totalPages = Math.ceil(total / limit);

    return {
      items: this.toDtoArray(entities),
      pagination: {
        page,
        limit,
        totalCount: total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }
}
