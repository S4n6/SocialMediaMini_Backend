import { Injectable, Inject } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { IStoryRepository } from '../../domain/repositories';
import { StoryEntity } from '../../domain/entities';
import { CreateStoryCommand, StoryUseCaseResult } from '../dto';
import { STORY_REPOSITORY_TOKEN } from '../../constants';

/**
 * Create Story Use Case
 *
 * Responsibility: Orchestrate the creation of a new story
 * - Create story entity using domain factory
 * - Persist via repository
 * - Return result
 *
 * NOTE: Input validation is handled by the presentation-layer DTO
 * (class-validator). This use case trusts that the command is valid.
 */
@Injectable()
export class CreateStoryUseCase {
  constructor(
    @Inject(STORY_REPOSITORY_TOKEN)
    private readonly storyRepository: IStoryRepository,
  ) {}

  async execute(command: CreateStoryCommand): Promise<StoryUseCaseResult> {
    const story = StoryEntity.create(
      uuid(),
      command.authorId,
      command.content || null,
      command.mediaUrl || null,
      command.mediaType || null,
    );

    await this.storyRepository.save(story);

    return this.mapToResult(story);
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
      viewCount: 0,
      hasViewed: false,
    };
  }
}
