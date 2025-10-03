import { Injectable } from '@nestjs/common';
import { FollowRepository } from '../../domain/repositories/follow.repository';
import { FollowStatusResponseDto } from '../dto/follow-response.dto';
import { FollowMapper } from '../mappers/follow.mapper';

@Injectable()
export class GetFollowStatusUseCase {
  constructor(private readonly followRepository: FollowRepository) {}

  async execute(
    userId: string,
    targetUserId: string,
  ): Promise<FollowStatusResponseDto> {
    const result = await this.followRepository.getFollowStatus(
      userId,
      targetUserId,
    );
    return FollowMapper.toFollowStatusResponseDto(result);
  }
}
