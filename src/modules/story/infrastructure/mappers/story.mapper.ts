import { Story as PrismaStory } from '../../../../generated/prisma/client';
import { StoryEntity } from '../../domain/entities';

/**
 * Maps between Prisma Story model and StoryEntity domain object.
 */
export class StoryMapper {
  /**
   * Prisma model → Domain entity
   */
  static toDomain(raw: PrismaStory): StoryEntity {
    return new StoryEntity(
      raw.id,
      raw.authorId,
      raw.content,
      raw.mediaUrl,
      raw.mediaType,
      raw.expiresAt,
      raw.isActive,
      raw.createdAt,
      raw.updatedAt,
    );
  }

  /**
   * Domain entity → Prisma-compatible plain object
   */
  static toPrisma(entity: StoryEntity): PrismaStory {
    return {
      id: entity.id,
      authorId: entity.authorId,
      content: entity.content,
      mediaUrl: entity.mediaUrl,
      mediaType: entity.mediaType,
      expiresAt: entity.expiresAt,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    } as PrismaStory;
  }
}
