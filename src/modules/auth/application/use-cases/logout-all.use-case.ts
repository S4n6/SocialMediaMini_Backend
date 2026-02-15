import { Injectable, Inject } from '@nestjs/common';
import { BaseUseCase } from './base.use-case';
import { ISessionRepository } from '../../domain/repositories/session.repository';
import { SESSION_REPOSITORY_TOKEN } from '../../auth.constants';

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

    return {
      success: true,
      message: 'Logged out from all devices successfully',
      sessionsRevoked: activeSessions.length,
    };
  }
}
