import { Injectable } from '@nestjs/common';
import { PostEntity, PostPrivacy, ReactionType } from '../post.entity';
import {
  PostAlreadyLikedException,
  PostNotLikedException,
  UnauthorizedPostActionException,
  InvalidPostContentException,
  PostContentTooLongException,
  PostMediaLimitExceededException,
} from '../post.exceptions';

/**
 * Domain service for Post business logic
 * Encapsulates complex domain rules that don't belong to a single entity
 */
@Injectable()
export class PostDomainService {
  private readonly MAX_CONTENT_LENGTH = 2000;
  private readonly MAX_MEDIA_COUNT = 10;

  /**
   * Validates if a user can edit a post
   */
  canEditPost(post: PostEntity, userId: string): boolean {
    return post.authorId === userId;
  }

  /**
   * Validates if a user can delete a post
   */
  canDeletePost(post: PostEntity, userId: string, userRole?: string): boolean {
    // Author can always delete their own post
    if (post.authorId === userId) {
      return true;
    }

    // Admins and moderators can delete posts
    if (userRole === 'ADMIN' || userRole === 'MODERATOR') {
      return true;
    }

    return false;
  }

  /**
   * Validates if a user can view a post based on privacy settings
   */
  canViewPost(
    post: PostEntity,
    viewerId?: string,
    isFollowing?: boolean,
  ): boolean {
    switch (post.privacy) {
      case PostPrivacy.PUBLIC:
        return true;

      case PostPrivacy.FOLLOWERS:
        if (!viewerId) return false;
        return post.authorId === viewerId || isFollowing === true;

      case PostPrivacy.PRIVATE:
        if (!viewerId) return false;
        return post.authorId === viewerId;

      default:
        return false;
    }
  }

  /**
   * Validates post content according to business rules
   */
  validatePostContent(content?: string, mediaCount: number = 0): void {
    // Post must have either content or media
    if ((!content || content.trim() === '') && mediaCount === 0) {
      throw new InvalidPostContentException(
        'Post must have either content or media',
      );
    }

    // Check content length
    if (content && content.length > this.MAX_CONTENT_LENGTH) {
      throw new PostContentTooLongException(this.MAX_CONTENT_LENGTH);
    }

    // Check media count
    if (mediaCount > this.MAX_MEDIA_COUNT) {
      throw new PostMediaLimitExceededException(this.MAX_MEDIA_COUNT);
    }
  }

  /**
   * Determines if a user can react to a post
   */
  canReactToPost(post: PostEntity, userId: string): boolean {
    // Users cannot react to their own posts (business rule)
    return post.authorId !== userId;
  }

  /**
   * Validates reaction addition
   */
  validateAddReaction(
    post: PostEntity,
    userId: string,
    reactionType: ReactionType,
  ): void {
    if (!this.canReactToPost(post, userId)) {
      throw new UnauthorizedPostActionException('react to your own post');
    }

    // Check if already reacted with same type
    const existingReaction = post.reactions.find((r) => r.userId === userId);
    if (existingReaction && existingReaction.type === reactionType) {
      throw new PostAlreadyLikedException(
        `Post is already reacted with ${reactionType}`,
      );
    }
  }

  /**
   * Validates reaction removal
   */
  validateRemoveReaction(post: PostEntity, userId: string): void {
    const existingReaction = post.reactions.find((r) => r.userId === userId);
    if (!existingReaction) {
      throw new PostNotLikedException('No reaction found to remove');
    }
  }

  /**
   * Calculates post engagement score for feed algorithms
   */
  calculateEngagementScore(
    post: PostEntity,
    timeDecayFactor: number = 0.8,
  ): number {
    const now = new Date();
    const postAge = now.getTime() - post.createdAt.getTime();
    const hoursAge = postAge / (1000 * 60 * 60);

    // Base scores
    const likesScore = post.reactions.length * 2;
    const commentsScore = post.comments.length * 5; // Comments are worth more

    // Time decay
    const timeDecay = Math.exp((-hoursAge / 24) * timeDecayFactor);

    return (likesScore + commentsScore) * timeDecay;
  }

  /**
   * Extracts hashtags from content
   */
  extractHashtags(content?: string): string[] {
    if (!content) return [];

    const hashtagRegex = /#[\w\u0590-\u05ff]+/g;
    const matches = content.match(hashtagRegex);

    if (!matches) return [];

    return matches
      .map((tag) => tag.toLowerCase().substring(1)) // Remove # and convert to lowercase
      .filter((tag, index, self) => self.indexOf(tag) === index); // Remove duplicates
  }

  /**
   * Determines if content contains inappropriate material (basic implementation)
   */
  containsInappropriateContent(content?: string): boolean {
    if (!content) return false;

    // Basic inappropriate content detection
    // In production, this would use more sophisticated ML models
    const inappropriateWords = ['spam', 'scam', 'hate'];
    const lowerContent = content.toLowerCase();

    return inappropriateWords.some((word) => lowerContent.includes(word));
  }

  /**
   * Generates suggested hashtags based on content
   */
  generateSuggestedHashtags(content?: string): string[] {
    if (!content) return [];

    // Simple keyword extraction for hashtag suggestions
    // In production, this would use NLP libraries
    const words = content
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(' ')
      .filter((word) => word.length > 3);

    return words.slice(0, 5); // Return top 5 suggestions
  }

  /**
   * Validates post editing rules
   */
  validatePostEdit(post: PostEntity, userId: string): void {
    if (!this.canEditPost(post, userId)) {
      throw new UnauthorizedPostActionException('edit this post');
    }

    // Business rule: Posts older than 24 hours cannot be edited
    const now = new Date();
    const hoursSinceCreation =
      (now.getTime() - post.createdAt.getTime()) / (1000 * 60 * 60);

    if (hoursSinceCreation > 24) {
      throw new UnauthorizedPostActionException(
        'edit posts older than 24 hours',
      );
    }
  }
}
