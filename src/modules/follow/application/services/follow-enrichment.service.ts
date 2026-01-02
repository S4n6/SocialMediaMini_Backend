import { Injectable, Inject } from '@nestjs/common';
import { FollowRepository } from '../../domain/repositories/follow.repository';
import { ExternalUserService } from '../interfaces/external-services.interface';
import {
  UserSummary,
  FollowersResult,
  FollowingResult,
  FollowStatusResult,
  FollowWithUsers,
} from '../interfaces/follow-query.interface';
import { FOLLOW_MODULE_TOKENS } from '../../constants';

/**
 * Application Service for data enrichment and complex queries
 * Handles business orchestration and external service integration
 */
@Injectable()
export class FollowEnrichmentService {
  constructor(
    @Inject(FOLLOW_MODULE_TOKENS.FOLLOW_REPOSITORY)
    private readonly followRepository: FollowRepository,
    @Inject(FOLLOW_MODULE_TOKENS.EXTERNAL_USER_SERVICE)
    private readonly userService: ExternalUserService,
  ) {}

  /**
   * Get followers with user details
   */
  async getFollowers(userId: string): Promise<FollowersResult> {
    // Get basic follow entities
    const follows = await this.followRepository.findAll({
      followingId: userId,
    });

    // Enrich with user data
    const followers: UserSummary[] = [];
    for (const follow of follows) {
      const user = await this.userService.findById(follow.followerId);
      if (user) {
        followers.push(user);
      }
    }

    return {
      userId,
      totalFollowers: followers.length,
      followers,
    };
  }

  /**
   * Get following with user details
   */
  async getFollowing(userId: string): Promise<FollowingResult> {
    // Get basic follow entities
    const follows = await this.followRepository.findAll({
      followerId: userId,
    });

    // Enrich with user data
    const following: UserSummary[] = [];
    for (const follow of follows) {
      const user = await this.userService.findById(follow.followingId);
      if (user) {
        following.push(user);
      }
    }

    return {
      userId,
      totalFollowing: following.length,
      following,
    };
  }

  /**
   * Get follow status between two users
   */
  async getFollowStatus(
    userId: string,
    targetUserId: string,
  ): Promise<FollowStatusResult> {
    const follow = await this.followRepository.findByFollowerAndFollowing(
      userId,
      targetUserId,
    );

    return {
      userId,
      targetUserId,
      isFollowing: !!follow,
      followId: follow?.id || null,
    };
  }

  /**
   * Get follows with enriched user data
   */
  async getFollowsWithUserData(options?: {
    followerId?: string;
    followingId?: string;
    limit?: number;
    offset?: number;
  }): Promise<FollowWithUsers[]> {
    const follows = await this.followRepository.findAll(options);

    const enrichedFollows: FollowWithUsers[] = [];

    for (const follow of follows) {
      const [follower, following] = await Promise.all([
        this.userService.findById(follow.followerId),
        this.userService.findById(follow.followingId),
      ]);

      if (follower && following) {
        enrichedFollows.push({
          followId: follow.id,
          followerId: follow.followerId,
          followingId: follow.followingId,
          createdAt: follow.createdAt,
          follower,
          following,
        });
      }
    }

    return enrichedFollows;
  }

  /**
   * Validate user exists
   */
  async validateUserExists(userId: string): Promise<UserSummary> {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    return user;
  }
}
