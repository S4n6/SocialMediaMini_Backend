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
} from '../../tokens';
import {
  StoryNotFoundException,
  StoryExpiredException,
} from '../../domain/exceptions';

/**
 * View Story Use Case
 *
 * Responsibility: Handle story viewing and track views
 * - Validate story exists and is viewable
 * - Track view (avoid duplicate views)
 * - Return story with updated view data
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
    // Input validation
    this.validateCommand(command);

    // Find story
    const story = await this.storyRepository.findById(command.storyId);
    if (!story) {
      throw new StoryNotFoundException(command.storyId);
    }

    // Check if story is viewable
    if (!story.isViewable()) {
      throw new StoryExpiredException(command.storyId);
    }

    // Track view (only if not already viewed)
    await this.trackView(command.storyId, command.viewerId);

    // Get updated view count
    const viewCount = await this.storyViewRepository.countViewsByStoryId(
      command.storyId,
    );

    // Return result
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
      hasViewed: true, // User has just viewed it
    };
  }

  private validateCommand(command: ViewStoryCommand): void {
    if (!command.storyId?.trim()) {
      throw new Error('Story ID is required');
    }
    if (!command.viewerId?.trim()) {
      throw new Error('Viewer ID is required');
    }
  }

  private async trackView(storyId: string, viewerId: string): Promise<void> {
    // Check if user has already viewed this story
    const existingView = await this.storyViewRepository.findByStoryAndViewer(
      storyId,
      viewerId,
    );

    if (!existingView) {
      // Create new view record
      const viewId = uuid();
      const storyView = StoryViewEntity.create(viewId, storyId, viewerId);
      await this.storyViewRepository.create(storyView);
    }
    // If already viewed, do nothing (avoid duplicate views)
  }
}
