import { Injectable } from '@nestjs/common';
import { FollowEntity } from '../follow.entity';
import { FollowRepository } from '../repositories/follow.repository';
import {
  SelfFollowException,
  AlreadyFollowingException,
  NotFollowingException,
  FollowNotFoundException,
  UnauthorizedFollowActionException,
} from '../follow.exceptions';

@Injectable()
export class FollowDomainService {
  constructor(private readonly followRepository: FollowRepository) {}

  async createFollow(
    followerId: string,
    followingId: string,
  ): Promise<FollowEntity> {
    // Validate not following self
    if (followerId === followingId) {
      throw new SelfFollowException();
    }

    // Check if already following
    const existingFollow =
      await this.followRepository.findByFollowerAndFollowing(
        followerId,
        followingId,
      );

    if (existingFollow) {
      throw new AlreadyFollowingException();
    }

    // Create new follow relationship
    const newFollow = FollowEntity.createNew(followerId, followingId);
    return await this.followRepository.save(newFollow);
  }

  async removeFollow(followerId: string, followingId: string): Promise<void> {
    // Validate not unfollowing self
    if (followerId === followingId) {
      throw new SelfFollowException();
    }

    // Check if currently following
    const existingFollow =
      await this.followRepository.findByFollowerAndFollowing(
        followerId,
        followingId,
      );

    if (!existingFollow) {
      throw new NotFollowingException();
    }

    await this.followRepository.delete(existingFollow.id);
  }

  async validateFollowOwnership(
    followId: string,
    userId: string,
  ): Promise<FollowEntity> {
    const follow = await this.followRepository.findById(followId);

    if (!follow) {
      throw new FollowNotFoundException(followId);
    }

    if (!follow.isFollowerOf(userId)) {
      throw new UnauthorizedFollowActionException();
    }

    return follow;
  }

  async checkFollowStatus(
    followerId: string,
    followingId: string,
  ): Promise<{
    isFollowing: boolean;
    followId?: string;
  }> {
    const follow = await this.followRepository.findByFollowerAndFollowing(
      followerId,
      followingId,
    );

    return {
      isFollowing: !!follow,
      followId: follow?.id,
    };
  }
}
