import { Follow } from '../../../../../generated/prisma/client';
import { FollowEntity } from '../../../domain/entities/follow.entity';

/**
 * Infrastructure Mapper - Prisma Model ↔ Domain Entity
 * Handles translation between persistence and domain layers
 */
export class FollowPrismaMapper {
  /**
   * Map Prisma Follow model to domain FollowEntity
   */
  static toDomain(prismaFollow: Follow): FollowEntity {
    return FollowEntity.create({
      id: prismaFollow.id,
      followerId: prismaFollow.followerId,
      followingId: prismaFollow.followingId,
      createdAt: prismaFollow.createdAt,
    });
  }

  /**
   * Map domain FollowEntity to Prisma create/update data
   */
  static toPrismaCreate(entity: FollowEntity): {
    followerId: string;
    followingId: string;
  } {
    return {
      followerId: entity.followerId,
      followingId: entity.followingId,
    };
  }

  /**
   * Map multiple Prisma Follow models to domain entities
   */
  static toDomainList(prismaFollows: Follow[]): FollowEntity[] {
    return prismaFollows.map((follow) => this.toDomain(follow));
  }
}
