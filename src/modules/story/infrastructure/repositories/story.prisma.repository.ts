import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { IStoryRepository } from '../../domain/repositories';
import { StoryEntity } from '../../domain/entities';
import { StoryMapper } from '../mappers';

@Injectable()
export class StoryPrismaRepository implements IStoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(story: StoryEntity): Promise<void> {
    const data = StoryMapper.toPrisma(story);

    await this.prisma.story.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    });
  }

  async findById(id: string): Promise<StoryEntity | null> {
    const story = await this.prisma.story.findUnique({
      where: { id },
    });

    return story ? StoryMapper.toDomain(story) : null;
  }

  async findActiveByUserId(userId: string): Promise<StoryEntity[]> {
    const stories = await this.prisma.story.findMany({
      where: {
        authorId: userId,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    return stories.map(StoryMapper.toDomain);
  }

  async findActiveFromFollowedUsers(
    currentUserId: string,
  ): Promise<StoryEntity[]> {
    const stories = await this.prisma.story.findMany({
      where: {
        isActive: true,
        expiresAt: { gt: new Date() },
        author: {
          followers: {
            some: { followerId: currentUserId },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return stories.map(StoryMapper.toDomain);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.story.delete({
      where: { id },
    });
  }

  async findExpiredActiveStories(): Promise<StoryEntity[]> {
    const stories = await this.prisma.story.findMany({
      where: {
        isActive: true,
        expiresAt: { lt: new Date() },
      },
    });

    return stories.map(StoryMapper.toDomain);
  }
}
