import { Injectable } from '@nestjs/common';
import { FollowStatusResponseDto } from '../dto/follow-response.dto';
import { FollowMapper } from '../mappers/follow.mapper';
import { FollowEnrichmentService } from '../services/follow-enrichment.service';

@Injectable()
export class GetFollowStatusUseCase {
  constructor(
    private readonly followEnrichmentService: FollowEnrichmentService,
  ) {}

  async execute(
    userId: string,
    targetUserId: string,
  ): Promise<FollowStatusResponseDto> {
    const result = await this.followEnrichmentService.getFollowStatus(
      userId,
      targetUserId,
    );
    return FollowMapper.toFollowStatusResponseDto(result);
  }
}
