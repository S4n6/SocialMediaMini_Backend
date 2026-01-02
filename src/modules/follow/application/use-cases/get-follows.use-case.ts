import { Injectable } from '@nestjs/common';
import { FollowWithUsers } from '../interfaces/follow-query.interface';
import { FollowEnrichmentService } from '../services/follow-enrichment.service';

@Injectable()
export class GetFollowsUseCase {
  constructor(
    private readonly followEnrichmentService: FollowEnrichmentService,
  ) {}

  async execute(query?: {
    followerId?: string;
    followingId?: string;
    limit?: number;
    offset?: number;
  }): Promise<FollowWithUsers[]> {
    return await this.followEnrichmentService.getFollowsWithUserData(query);
  }
}
