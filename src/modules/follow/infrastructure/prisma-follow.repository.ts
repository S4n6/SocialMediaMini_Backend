import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import {
  FollowRepository,
  FindFollowsOptions,
} from '../domain/repositories/follow.repository';
import { FollowEntity } from '../domain/entities/follow.entity';
import { FollowFactory } from '../domain/factories/follow.factory';

/**
 * Prisma Implementation of Follow Repository
 * Contains only essential CRUD operations - no complex business logic
 */
@Injectable()
export class PrismaFollowRepository implements FollowRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly followFactory: FollowFactory,
  ) {}

  async save(follow: FollowEntity): Promise<FollowEntity> {
    const data = {
      followerId: follow.followerId,
      followingId: follow.followingId,
    };

    try {
      if (follow.id) {
        // Update existing
        const updated = await this.prisma.follow.update({
          where: { id: follow.id },
          data,
        });

        return this.followFactory.createFromPrimitive({
          ...updated,
          updatedAt: updated.createdAt,
        });
      } else {
        // Create new
        const created = await this.prisma.follow.create({
          data,
        });

        return this.followFactory.createFromPrimitive({
          ...created,
          updatedAt: created.createdAt,
        });
      }
    } catch (error) {
      console.error('Error saving follow:', error);
      throw new Error('Failed to save follow relationship');
    }
  }

  async findById(id: string): Promise<FollowEntity | null> {
    try {
      const follow = await this.prisma.follow.findUnique({
        where: { id },
      });

      if (!follow) {
        return null;
      }

      return this.followFactory.createFromPrimitive({
        ...follow,
        updatedAt: follow.createdAt,
      });
    } catch (error) {
      console.error('Error finding follow by id:', error);
      return null;
    }
  }

  async findByFollowerAndFollowing(
    followerId: string,
    followingId: string,
  ): Promise<FollowEntity | null> {
    try {
      const follow = await this.prisma.follow.findFirst({
        where: {
          followerId,
          followingId,
        },
      });

      if (!follow) {
        return null;
      }

      return this.followFactory.createFromPrimitive({
        ...follow,
        updatedAt: follow.createdAt,
      });
    } catch (error) {
      console.error('Error finding follow by follower and following:', error);
      return null;
    }
  }

  async findAll(options?: FindFollowsOptions): Promise<FollowEntity[]> {
    try {
      const where: any = {};

      if (options?.followerId) where.followerId = options.followerId;
      if (options?.followingId) where.followingId = options.followingId;

      const follows = await this.prisma.follow.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options?.limit,
        skip: options?.offset,
      });

      return follows.map((follow) =>
        this.followFactory.createFromPrimitive({
          ...follow,
          updatedAt: follow.createdAt,
        }),
      );
    } catch (error) {
      console.error('Error finding all follows:', error);
      return [];
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.follow.delete({
        where: { id },
      });
    } catch (error) {
      console.error('Error deleting follow:', error);
      throw new Error('Failed to delete follow relationship');
    }
  }

  async countFollowers(userId: string): Promise<number> {
    try {
      return await this.prisma.follow.count({
        where: { followingId: userId },
      });
    } catch (error) {
      console.error('Error counting followers:', error);
      return 0;
    }
  }

  async countFollowing(userId: string): Promise<number> {
    try {
      return await this.prisma.follow.count({
        where: { followerId: userId },
      });
    } catch (error) {
      console.error('Error counting following:', error);
      return 0;
    }
  }

  async existsByFollowerAndFollowing(
    followerId: string,
    followingId: string,
  ): Promise<boolean> {
    try {
      const count = await this.prisma.follow.count({
        where: {
          followerId,
          followingId,
        },
      });
      return count > 0;
    } catch (error) {
      console.error('Error checking follow existence:', error);
      return false;
    }
  }
}
