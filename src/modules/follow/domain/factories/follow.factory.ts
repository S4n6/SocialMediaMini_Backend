import { FollowEntity, FollowEntityProps } from '../entities/follow.entity';

/**
 * Follow Factory - Pure Domain
 * Responsible for creating Follow entities
 */
export class FollowFactory {
  static createFollow(followerId: string, followingId: string): FollowEntity {
    return FollowEntity.createNew(followerId, followingId);
  }

  static createFromPersistence(props: FollowEntityProps): FollowEntity {
    return FollowEntity.create(props);
  }
}
