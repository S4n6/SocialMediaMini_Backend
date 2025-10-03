import { Injectable } from '@nestjs/common';
import { FollowEntity } from '../follow.entity';

@Injectable()
export class FollowFactory {
  createFollow(followerId: string, followingId: string): FollowEntity {
    if (!followerId) {
      throw new Error('Follower ID is required');
    }

    if (!followingId) {
      throw new Error('Following ID is required');
    }

    if (followerId === followingId) {
      throw new Error('Cannot follow yourself');
    }

    return FollowEntity.createNew(followerId, followingId);
  }

  createFromPrimitive(props: {
    id: string;
    followerId: string;
    followingId: string;
    createdAt: Date;
    updatedAt: Date;
  }): FollowEntity {
    return FollowEntity.create(props);
  }
}
