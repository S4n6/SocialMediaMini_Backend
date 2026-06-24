import { Injectable, Inject } from '@nestjs/common';
import { BaseUseCase } from './base.use-case';
import { ISessionRepository } from '../../domain/repositories/session.repository';
import { SESSION_REPOSITORY_TOKEN } from '../../auth.constants';
import { RedisCacheService } from '../../../cache/cache.service';

interface LogoutAllRequest {
  userId: string;
}

interface LogoutAllResult {
  success: boolean;
  message: string;
  sessionsRevoked: number;
}

@Injectable()
export class LogoutAllUseCase extends BaseUseCase<
  LogoutAllRequest,
  LogoutAllResult
> {
  constructor(
    @Inject(SESSION_REPOSITORY_TOKEN)
    private sessionRepository: ISessionRepository,
    private cacheService: RedisCacheService,
  ) {
    super();
  }

  async execute(request: LogoutAllRequest): Promise<LogoutAllResult> {
    const { userId } = request;

    // Get all active sessions for the user
    const sessions = await this.sessionRepository.findByUserId(userId);
    const activeSessions = sessions.filter((s) => !s.isRevoked);

    // Revoke all sessions
    await this.sessionRepository.deleteAllByUserId(userId);

    // Invalidate any access tokens issued before this logout-all moment.
    await this.cacheService.set(
      `auth:logout-all:${userId}`,
      Math.floor(Date.now() / 1000),
      7 * 24 * 60 * 60,
    );

    return {
      success: true,
      message: 'Logged out from all devices successfully',
      sessionsRevoked: activeSessions.length,
    };
  }
}
