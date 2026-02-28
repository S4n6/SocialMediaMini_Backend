import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../database/prisma.service';
import {
  FollowRepository,
  FindFollowsOptions,
} from '../../../domain/repositories/follow.repository';
import { FollowEntity } from '../../../domain/entities/follow.entity';
import { FollowPrismaMapper } from '../mappers/follow-prisma.mapper';

/**
 * Prisma Implementation of Follow Repository
 * Infrastructure layer - implements domain repository interface
 */
@Injectable()
export class PrismaFollowRepository implements FollowRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(follow: FollowEntity): Promise<FollowEntity> {
    const data = FollowPrismaMapper.toPrismaCreate(follow);

    if (follow.id) {
      const updated = await this.prisma.follow.update({
        where: { id: follow.id },
        data,
      });
      return FollowPrismaMapper.toDomain(updated);
    }

    const created = await this.prisma.follow.create({ data });
    return FollowPrismaMapper.toDomain(created);
  }

  async findById(id: string): Promise<FollowEntity | null> {
    const follow = await this.prisma.follow.findUnique({
      where: { id },
    });

    return follow ? FollowPrismaMapper.toDomain(follow) : null;
  }

  async findByFollowerAndFollowing(
    followerId: string,
    followingId: string,
  ): Promise<FollowEntity | null> {
    const follow = await this.prisma.follow.findFirst({
      where: { followerId, followingId },
    });

    return follow ? FollowPrismaMapper.toDomain(follow) : null;
  }

  async findAll(options?: FindFollowsOptions): Promise<FollowEntity[]> {
    const where: Record<string, string> = {};

    if (options?.followerId) where.followerId = options.followerId;
    if (options?.followingId) where.followingId = options.followingId;

    const follows = await this.prisma.follow.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit,
      skip: options?.offset,
    });

    return FollowPrismaMapper.toDomainList(follows);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.follow.delete({
      where: { id },
    });
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

  async existsByFollowerAndFollowing(
    followerId: string,
    followingId: string,
  ): Promise<boolean> {
    const count = await this.prisma.follow.count({
      where: { followerId, followingId },
    });
    return count > 0;
  }
}
