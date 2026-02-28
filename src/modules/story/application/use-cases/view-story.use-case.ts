import { Injectable, Inject } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import {
  IStoryRepository,
  IStoryViewRepository,
} from '../../domain/repositories';
import { StoryViewEntity } from '../../domain/entities';
import { ViewStoryCommand, StoryUseCaseResult } from '../dto';
import {
  STORY_REPOSITORY_TOKEN,
  STORY_VIEW_REPOSITORY_TOKEN,
} from '../../constants';
import {
  StoryNotFoundException,
  StoryExpiredException,
} from '../../domain/exceptions';

/**
 * View Story Use Case
 *
 * Validates the story exists and is viewable, tracks unique views,
 * and returns the story with updated view data.
 */
@Injectable()
export class ViewStoryUseCase {
  constructor(
    @Inject(STORY_REPOSITORY_TOKEN)
    private readonly storyRepository: IStoryRepository,
    @Inject(STORY_VIEW_REPOSITORY_TOKEN)
    private readonly storyViewRepository: IStoryViewRepository,
  ) {}

  async execute(command: ViewStoryCommand): Promise<StoryUseCaseResult> {
    // Find story
    const story = await this.storyRepository.findById(command.storyId);
    if (!story) {
      throw new StoryNotFoundException(command.storyId);
    }

    // Check if story is viewable (domain logic)
    if (!story.isViewable()) {
      throw new StoryExpiredException(command.storyId);
    }

    // Track view (idempotent — only creates if not already viewed)
    await this.trackView(command.storyId, command.viewerId);

    // Get updated view count
    const viewCount = await this.storyViewRepository.countViewsByStoryId(
      command.storyId,
    );

    return {
      id: story.id,
      authorId: story.authorId,
      content: story.content || undefined,
      mediaUrl: story.mediaUrl || undefined,
      mediaType: story.mediaType || undefined,
      expiresAt: story.expiresAt,
      isActive: story.isActive,
      createdAt: story.createdAt,
      updatedAt: story.updatedAt,
      viewCount,
      hasViewed: true,
    };
  }

  private async trackView(storyId: string, viewerId: string): Promise<void> {
    const existingView = await this.storyViewRepository.findByStoryAndViewer(
      storyId,
      viewerId,
    );

    if (!existingView) {
      const storyView = StoryViewEntity.create(uuid(), storyId, viewerId);
      await this.storyViewRepository.save(storyView);
    }
  }
}
