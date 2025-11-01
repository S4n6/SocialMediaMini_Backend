import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { IStoryRepository } from '../../domain/repositories';
import { StoryEntity } from '../../domain/entities';

@Injectable()
export class StoryPrismaRepository implements IStoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapToEntity(prismaStory: any): StoryEntity {
    return new StoryEntity(
      prismaStory.id,
      prismaStory.authorId,
      prismaStory.content,
      prismaStory.mediaUrl,
      prismaStory.mediaType,
      prismaStory.expiresAt,
      prismaStory.isActive,
      prismaStory.createdAt,
      prismaStory.updatedAt,
    );
  }

  async create(story: StoryEntity): Promise<StoryEntity> {
    const data = {
      id: story.id,
      authorId: story.authorId,
      content: story.content,
      mediaUrl: story.mediaUrl,
      mediaType: story.mediaType,
      expiresAt: story.expiresAt,
      isActive: story.isActive,
      createdAt: story.createdAt,
      updatedAt: story.updatedAt,
    };

    const savedStory = await this.prisma.story.create({
      data,
    });

    return this.mapToEntity(savedStory);
  }

  async findById(id: string): Promise<StoryEntity | null> {
    const story = await this.prisma.story.findUnique({
      where: { id },
    });

    return story ? this.mapToEntity(story) : null;
  }

  async findActiveByUserId(userId: string): Promise<StoryEntity[]> {
    const stories = await this.prisma.story.findMany({
      where: {
        authorId: userId,
        isActive: true,
        expiresAt: {
          gt: new Date(), // Not expired
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return stories.map((story) => this.mapToEntity(story));
  }

  async findActiveFromFollowedUsers(
    currentUserId: string,
  ): Promise<StoryEntity[]> {
    const stories = await this.prisma.story.findMany({
      where: {
        isActive: true,
        expiresAt: {
          gt: new Date(), // Not expired
        },
        author: {
          followers: {
            some: {
              followerId: currentUserId,
            },
          },
        },
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return stories.map((story) => this.mapToEntity(story));
  }

  async update(
    id: string,
    updates: Partial<StoryEntity>,
  ): Promise<StoryEntity> {
    const updatedStory = await this.prisma.story.update({
      where: { id },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
    });

    return this.mapToEntity(updatedStory);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.story.delete({
      where: { id },
    });
  }

  async findExpiredStories(): Promise<StoryEntity[]> {
    const stories = await this.prisma.story.findMany({
      where: {
        isActive: true,
        expiresAt: {
          lt: new Date(), // Expired
        },
      },
    });

    return stories.map((story) => this.mapToEntity(story));
  }

  async deactivateExpiredStories(): Promise<void> {
    await this.prisma.story.updateMany({
      where: {
        isActive: true,
        expiresAt: {
          lt: new Date(), // Expired
        },
      },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });
  }
}
