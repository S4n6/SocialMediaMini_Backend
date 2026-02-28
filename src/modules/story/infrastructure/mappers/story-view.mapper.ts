import { StoryView as PrismaStoryView } from '../../../../generated/prisma/client';
import { StoryViewEntity } from '../../domain/entities';

/**
 * Maps between Prisma StoryView model and StoryViewEntity domain object.
 */
export class StoryViewMapper {
  /**
   * Prisma model → Domain entity
   */
  static toDomain(raw: PrismaStoryView): StoryViewEntity {
    return new StoryViewEntity(raw.id, raw.storyId, raw.viewerId, raw.viewedAt);
  }

  /**
   * Domain entity → Prisma-compatible plain object
   */
  static toPrisma(
    entity: StoryViewEntity,
  ): Pick<PrismaStoryView, 'id' | 'storyId' | 'viewerId' | 'viewedAt'> {
    return {
      id: entity.id,
      storyId: entity.storyId,
      viewerId: entity.viewerId,
      viewedAt: entity.viewedAt,
    };
  }
}
