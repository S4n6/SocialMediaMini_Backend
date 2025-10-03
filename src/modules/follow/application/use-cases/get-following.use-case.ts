import { Injectable, Inject } from '@nestjs/common';
import { FollowRepository } from '../../domain/repositories/follow.repository';
import { FollowingResponseDto } from '../dto/follow-response.dto';
import { FollowMapper } from '../mappers/follow.mapper';
import { ExternalUserService } from '../interfaces/external-services.interface';
import { EXTERNAL_USER_SERVICE } from '../interfaces/tokens';
import { UserNotFoundException } from '../../domain/follow.exceptions';

@Injectable()
export class GetFollowingUseCase {
  constructor(
    private readonly followRepository: FollowRepository,
    @Inject(EXTERNAL_USER_SERVICE)
    private readonly userService: ExternalUserService,
  ) {}

  async execute(userId: string): Promise<FollowingResponseDto> {
    // Validate user exists
    const userExists = await this.userService.exists(userId);
    if (!userExists) {
      throw new UserNotFoundException(userId);
    }

    const result = await this.followRepository.getFollowing(userId);
    return FollowMapper.toFollowingResponseDto(result);
  }
}
