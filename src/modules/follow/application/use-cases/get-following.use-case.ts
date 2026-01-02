import { Injectable } from '@nestjs/common';
import { FollowingResponseDto } from '../dto/follow-response.dto';
import { FollowMapper } from '../mappers/follow.mapper';
import { FollowEnrichmentService } from '../services/follow-enrichment.service';
import { UserNotFoundException } from '../../domain/follow.exceptions';

@Injectable()
export class GetFollowingUseCase {
  constructor(
    private readonly followEnrichmentService: FollowEnrichmentService,
  ) {}

  async execute(userId: string): Promise<FollowingResponseDto> {
    // Validate user exists using enrichment service
    try {
      await this.followEnrichmentService.validateUserExists(userId);
    } catch (error) {
      throw new UserNotFoundException(userId);
    }

    // Use enrichment service to get following with user data
    const result = await this.followEnrichmentService.getFollowing(userId);
    return FollowMapper.toFollowingResponseDto(result);
  }
}
