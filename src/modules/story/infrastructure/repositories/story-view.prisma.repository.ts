import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { IStoryViewRepository } from '../../domain/repositories';
import { StoryViewEntity } from '../../domain/entities';

@Injectable()
export class StoryViewPrismaRepository implements IStoryViewRepository {
  constructor(private readonly prisma: PrismaService) {}

  private mapToEntity(prismaStoryView: any): StoryViewEntity {
    return new StoryViewEntity(
      prismaStoryView.id,
      prismaStoryView.storyId,
      prismaStoryView.viewerId,
      prismaStoryView.viewedAt,
    );
  }

  async create(storyView: StoryViewEntity): Promise<StoryViewEntity> {
    const data = {
      id: storyView.id,
      storyId: storyView.storyId,
      viewerId: storyView.viewerId,
      viewedAt: storyView.viewedAt,
    };

    const savedStoryView = await this.prisma.storyView.create({
      data,
    });

    return this.mapToEntity(savedStoryView);
  }

  async findByStoryAndViewer(
    storyId: string,
    viewerId: string,
  ): Promise<StoryViewEntity | null> {
    const storyView = await this.prisma.storyView.findUnique({
      where: {
        storyId_viewerId: {
          storyId,
          viewerId,
        },
      },
    });

    return storyView ? this.mapToEntity(storyView) : null;
  }

  async findViewersByStoryId(storyId: string): Promise<StoryViewEntity[]> {
    const storyViews = await this.prisma.storyView.findMany({
      where: { storyId },
      include: {
        viewer: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
      orderBy: { viewedAt: 'desc' },
    });

    return storyViews.map((storyView) => this.mapToEntity(storyView));
  }

  async countViewsByStoryId(storyId: string): Promise<number> {
    return this.prisma.storyView.count({
      where: { storyId },
    });
  }

  async hasUserViewedStory(
    storyId: string,
    viewerId: string,
  ): Promise<boolean> {
    const count = await this.prisma.storyView.count({
      where: {
        storyId,
        viewerId,
      },
    });

    return count > 0;
  }
}
