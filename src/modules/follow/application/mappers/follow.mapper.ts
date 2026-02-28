import { FollowEntity } from '../../domain/entities/follow.entity';
import {
  FollowResponseDto,
  FollowersResponseDto,
  FollowingResponseDto,
  FollowStatusResponseDto,
} from '../dto/follow-response.dto';
import {
  FollowWithUsers,
  FollowersResult,
  FollowingResult,
  FollowStatusResult,
} from '../interfaces/follow-query.interface';

/**
 * Application Layer Mapper
 * Maps between domain entities and application DTOs
 */
export class FollowMapper {
  static toResponseDto(entity: FollowEntity): FollowResponseDto {
    return {
      id: entity.id,
      followerId: entity.followerId,
      followingId: entity.followingId,
      createdAt: entity.createdAt,
    };
  }

  static toResponseDtoWithUsers(data: FollowWithUsers): FollowResponseDto {
    return {
      id: data.followId,
      followerId: data.followerId,
      followingId: data.followingId,
      createdAt: data.createdAt,
      follower: data.follower,
      following: data.following,
    };
  }

  static toFollowersResponseDto(result: FollowersResult): FollowersResponseDto {
    return {
      userId: result.userId,
      totalFollowers: result.totalFollowers,
      followers: result.followers,
    };
  }

  static toFollowingResponseDto(result: FollowingResult): FollowingResponseDto {
    return {
      userId: result.userId,
      totalFollowing: result.totalFollowing,
      following: result.following,
    };
  }

  static toFollowStatusResponseDto(
    result: FollowStatusResult,
  ): FollowStatusResponseDto {
    return {
      userId: result.userId,
      targetUserId: result.targetUserId,
      isFollowing: result.isFollowing,
      followId: result.followId,
    };
  }

  static toResponseDtoArray(entities: FollowEntity[]): FollowResponseDto[] {
    return entities.map((entity) => this.toResponseDto(entity));
  }
}
