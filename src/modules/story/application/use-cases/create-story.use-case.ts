import { Injectable, Inject } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { IStoryRepository } from '../../domain/repositories';
import { StoryEntity } from '../../domain/entities';
import { CreateStoryCommand, StoryUseCaseResult } from '../dto';
import { STORY_REPOSITORY_TOKEN } from '../../tokens';

/**
 * Create Story Use Case
 *
 * Responsibility: Orchestrate the creation of a new story
 * - Validate command input
 * - Create story entity with business rules
 * - Save to repository
 * - Return result
 */
@Injectable()
export class CreateStoryUseCase {
  constructor(
    @Inject(STORY_REPOSITORY_TOKEN)
    private readonly storyRepository: IStoryRepository,
  ) {}

  async execute(command: CreateStoryCommand): Promise<StoryUseCaseResult> {
    // Input validation
    this.validateCommand(command);

    // Create story entity using domain factory method
    const storyId = uuid();
    const story = StoryEntity.create(
      storyId,
      command.authorId,
      command.content || null,
      command.mediaUrl || null,
      command.mediaType || null,
    );

    // Save to repository
    const savedStory = await this.storyRepository.create(story);

    // Return use case result
    return this.mapToResult(savedStory);
  }

  private validateCommand(command: CreateStoryCommand): void {
    if (!command.authorId?.trim()) {
      throw new Error('Author ID is required');
    }

    // Must have either content or media
    if (!command.content?.trim() && !command.mediaUrl?.trim()) {
      throw new Error('Story must have either content or media');
    }

    // If media is provided, mediaType is required
    if (command.mediaUrl && !command.mediaType) {
      throw new Error('Media type is required when media URL is provided');
    }

    // Validate media type
    if (command.mediaType && !['image', 'text'].includes(command.mediaType)) {
      throw new Error('Media type must be either "image" or "text"');
    }
  }

  private mapToResult(story: StoryEntity): StoryUseCaseResult {
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
      viewCount: 0, // New story has no views
      hasViewed: false, // Author hasn't viewed their own story
    };
  }
}
