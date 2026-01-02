import { FollowEntity } from '../entities/follow.entity';
import {
  SelfFollowException,
  AlreadyFollowingException,
  NotFollowingException,
  FollowNotFoundException,
  UnauthorizedFollowActionException,
} from '../follow.exceptions';

/**
 * Pure Domain Service
 * Contains only business logic without external dependencies
 * Repository operations should be handled in Application Layer
 */
export class FollowDomainService {
  /**
   * Validates and creates a new Follow entity
   */
  static createFollowEntity(
    followerId: string,
    followingId: string,
  ): FollowEntity {
    // Validate not following self
    if (followerId === followingId) {
      throw new SelfFollowException();
    }

    // Create new follow relationship
    return FollowEntity.createNew(followerId, followingId);
  }

  /**
   * Validates unfollow operation
   */
  static validateUnfollow(followerId: string, followingId: string): void {
    if (followerId === followingId) {
      throw new SelfFollowException();
    }
  }

  /**
   * Validates if user can perform follow action
   */
  static validateFollowOwnership(follow: FollowEntity, userId: string): void {
    if (!follow.isFollowerOf(userId)) {
      throw new UnauthorizedFollowActionException();
    }
  }

  /**
   * Validates if already following to prevent duplicates
   */
  static validateNotAlreadyFollowing(
    existingFollow: FollowEntity | null,
  ): void {
    if (existingFollow) {
      throw new AlreadyFollowingException();
    }
  }

  /**
   * Validates if currently following before unfollowing
   */
  static validateCurrentlyFollowing(existingFollow: FollowEntity | null): void {
    if (!existingFollow) {
      throw new NotFollowingException();
    }
  }

  /**
   * Validates follow exists
   */
  static validateFollowExists(
    follow: FollowEntity | null,
    followId?: string,
  ): FollowEntity {
    if (!follow) {
      throw new FollowNotFoundException(followId || 'unknown');
    }
    return follow;
  }
}
