import { Injectable } from '@nestjs/common';
import { FollowRepository } from '../../domain/repositories/follow.repository';
import { GetFollowsQuery } from '../dto/follow.dto';
import { FollowResponseDto } from '../dto/follow-response.dto';
import { FollowMapper } from '../mappers/follow.mapper';

@Injectable()
export class GetFollowsUseCase {
  constructor(private readonly followRepository: FollowRepository) {}

  async execute(query?: GetFollowsQuery): Promise<FollowResponseDto[]> {
    const follows = await this.followRepository.findAll({
      followerId: query?.followerId,
      followingId: query?.followingId,
    });

    return FollowMapper.toResponseDtoArray(follows);
  }
}
