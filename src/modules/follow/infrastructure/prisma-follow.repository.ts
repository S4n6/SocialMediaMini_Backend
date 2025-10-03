import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import {
  FollowRepository,
  FindFollowsOptions,
  FollowWithUsers,
  FollowersResult,
  FollowingResult,
  FollowStatusResult,
} from '../domain/repositories/follow.repository';
import { FollowEntity } from '../domain/follow.entity';
import { FollowFactory } from '../domain/factories/follow.factory';

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

    if (follow.id) {
      // Update existing
      const updated = await this.prisma.follow.update({
        where: { id: follow.id },
        data,
      });

      return this.followFactory.createFromPrimitive({
        ...updated,
        updatedAt: updated.createdAt, // Fallback since Prisma model might not have updatedAt
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
  }

  async findById(id: string): Promise<FollowEntity | null> {
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
  }

  async findByFollowerAndFollowing(
    followerId: string,
    followingId: string,
  ): Promise<FollowEntity | null> {
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
  }

  async findAll(options?: FindFollowsOptions): Promise<FollowEntity[]> {
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
  }

  async findAllWithUsers(
    options?: FindFollowsOptions,
  ): Promise<FollowWithUsers[]> {
    const where: any = {};

    if (options?.followerId) where.followerId = options.followerId;
    if (options?.followingId) where.followingId = options.followingId;

    const follows = await this.prisma.follow.findMany({
      where,
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
            bio: true,
          },
        },
        following: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
            bio: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit,
      skip: options?.offset,
    });

    return follows.map((follow) => ({
      follow: this.followFactory.createFromPrimitive({
        id: follow.id,
        followerId: follow.followerId,
        followingId: follow.followingId,
        createdAt: follow.createdAt,
        updatedAt: follow.createdAt,
      }),
      follower: follow.follower,
      following: follow.following,
    }));
  }

  async delete(id: string): Promise<void> {
    await this.prisma.follow.delete({
      where: { id },
    });
  }

  async getFollowers(userId: string): Promise<FollowersResult> {
    const followers = await this.prisma.follow.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
            bio: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      userId,
      totalFollowers: followers.length,
      followers: followers.map((f) => f.follower),
    };
  }

  async getFollowing(userId: string): Promise<FollowingResult> {
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
            bio: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      userId,
      totalFollowing: following.length,
      following: following.map((f) => f.following),
    };
  }

  async getFollowStatus(
    userId: string,
    targetUserId: string,
  ): Promise<FollowStatusResult> {
    const follow = await this.prisma.follow.findFirst({
      where: {
        followerId: userId,
        followingId: targetUserId,
      },
    });

    return {
      userId,
      targetUserId,
      isFollowing: !!follow,
      followId: follow?.id || null,
    };
  }

  async countFollowers(userId: string): Promise<number> {
    return this.prisma.follow.count({
      where: { followingId: userId },
    });
  }

  async countFollowing(userId: string): Promise<number> {
    return this.prisma.follow.count({
      where: { followerId: userId },
    });
  }
}
