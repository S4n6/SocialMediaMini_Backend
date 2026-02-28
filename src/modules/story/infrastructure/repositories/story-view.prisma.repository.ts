import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { IStoryViewRepository } from '../../domain/repositories';
import { StoryViewEntity } from '../../domain/entities';
import { StoryViewMapper } from '../mappers';

@Injectable()
export class StoryViewPrismaRepository implements IStoryViewRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(storyView: StoryViewEntity): Promise<void> {
    const data = StoryViewMapper.toPrisma(storyView);

    await this.prisma.storyView.upsert({
      where: {
        storyId_viewerId: {
          storyId: data.storyId,
          viewerId: data.viewerId,
        },
      },
      create: data,
      update: data,
    });
  }

  async findByStoryAndViewer(
    storyId: string,
    viewerId: string,
  ): Promise<StoryViewEntity | null> {
    const storyView = await this.prisma.storyView.findUnique({
      where: {
        storyId_viewerId: { storyId, viewerId },
      },
    });

    return storyView ? StoryViewMapper.toDomain(storyView) : null;
  }

  async findViewersByStoryId(storyId: string): Promise<StoryViewEntity[]> {
    const storyViews = await this.prisma.storyView.findMany({
      where: { storyId },
      orderBy: { viewedAt: 'desc' },
    });

    return storyViews.map(StoryViewMapper.toDomain);
  }

  async countViewsByStoryId(storyId: string): Promise<number> {
    return this.prisma.storyView.count({
      where: { storyId },
    });
  }

  async countViewsByStoryIds(storyIds: string[]): Promise<Map<string, number>> {
    if (storyIds.length === 0) return new Map();

    const counts = await this.prisma.storyView.groupBy({
      by: ['storyId'],
      where: { storyId: { in: storyIds } },
      _count: { storyId: true },
    });

    const map = new Map<string, number>();
    for (const row of counts) {
      map.set(row.storyId, row._count.storyId);
    }
    return map;
  }

  async findViewedStoryIds(
    storyIds: string[],
    viewerId: string,
  ): Promise<Set<string>> {
    if (storyIds.length === 0) return new Set();

    const views = await this.prisma.storyView.findMany({
      where: {
        storyId: { in: storyIds },
        viewerId,
      },
      select: { storyId: true },
    });

    return new Set(views.map((v) => v.storyId));
  }
}
