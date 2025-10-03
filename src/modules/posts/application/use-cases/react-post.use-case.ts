import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PostDomainService } from '../../domain/services/post-domain.service';
import { IPostRepository } from '../interfaces/post-repository.interface';
import { CreateReactionDto } from '../dto/post.dto';
import { POST_REPOSITORY_TOKEN } from './create-post.use-case';

/**
 * Use case for adding reaction to a post
 */
@Injectable()
export class AddReactionUseCase {
  constructor(
    private readonly postDomainService: PostDomainService,
    @Inject(POST_REPOSITORY_TOKEN)
    private readonly postRepository: IPostRepository,
  ) {}

  async execute(
    postId: string,
    userId: string,
    dto: CreateReactionDto,
  ): Promise<void> {
    // Find post
    const post = await this.postRepository.findById(postId);
    if (!post) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    // Validate and add reaction using domain service
    this.postDomainService.validateAddReaction(post, userId, dto.type);

    // Add or update reaction
    post.addReaction(userId, dto.type);

    // Save updated post
    await this.postRepository.save(post);
  }
}

/**
 * Use case for removing reaction from a post
 */
@Injectable()
export class RemoveReactionUseCase {
  constructor(
    private readonly postDomainService: PostDomainService,
    @Inject(POST_REPOSITORY_TOKEN)
    private readonly postRepository: IPostRepository,
  ) {}

  async execute(postId: string, userId: string): Promise<void> {
    // Find post
    const post = await this.postRepository.findById(postId);
    if (!post) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    // Validate and remove reaction using domain service
    this.postDomainService.validateRemoveReaction(post, userId);

    // Remove reaction
    post.removeReaction(userId);

    // Save updated post
    await this.postRepository.save(post);
  }
}

/**
 * Use case for toggling reaction (add if not exists, remove if exists, or change type)
 */
@Injectable()
export class ToggleReactionUseCase {
  constructor(
    private readonly postDomainService: PostDomainService,
    @Inject(POST_REPOSITORY_TOKEN)
    private readonly postRepository: IPostRepository,
  ) {}

  async execute(
    postId: string,
    userId: string,
    dto: CreateReactionDto,
  ): Promise<{
    action: 'added' | 'removed' | 'changed';
    reactionType?: string;
  }> {
    // Find post
    const post = await this.postRepository.findById(postId);
    if (!post) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    // Check if user can react to this post
    if (!this.postDomainService.canReactToPost(post, userId)) {
      throw new BadRequestException('You cannot react to your own post');
    }

    // Check existing reaction
    const existingReaction = post.reactions.find((r) => r.userId === userId);

    let action: 'added' | 'removed' | 'changed';

    if (!existingReaction) {
      // No existing reaction, add new one
      post.addReaction(userId, dto.type);
      action = 'added';
    } else if (existingReaction.type === dto.type) {
      // Same reaction type, remove it
      post.removeReaction(userId);
      action = 'removed';
    } else {
      // Different reaction type, change it
      post.removeReaction(userId);
      post.addReaction(userId, dto.type);
      action = 'changed';
    }

    // Save updated post
    await this.postRepository.save(post);

    return {
      action,
      reactionType: action === 'removed' ? undefined : dto.type,
    };
  }
}
