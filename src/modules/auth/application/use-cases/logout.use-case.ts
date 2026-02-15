import { Injectable, UnauthorizedException } from '@nestjs/common';
import { BaseUseCase } from './base.use-case';
import { LogoutRequest } from './auth.dtos';
import { AuthResult } from '../../domain/entities';
import { ISessionRepository } from '../../domain/repositories/session.repository';
import { Inject } from '@nestjs/common';
import { SESSION_REPOSITORY_TOKEN } from '../../auth.constants';

@Injectable()
export class LogoutUseCase extends BaseUseCase<LogoutRequest, AuthResult> {
  constructor(
    @Inject(SESSION_REPOSITORY_TOKEN)
    private sessionRepository: ISessionRepository,
  ) {
    super();
  }

  async execute(request: LogoutRequest): Promise<AuthResult> {
    const { refreshToken } = request;
    if (!refreshToken) {
      console.log('[Logout] No refresh token provided');
      return {
        success: true,
        message: 'Logout successful',
      };
    }

    const session =
      await this.sessionRepository.findByRefreshToken(refreshToken);

    if (!session) {
      console.log('[Logout] Session not found for refresh token');
      return {
        success: true,
        message: 'Logout successful',
      };
    }

    // Validate that the refresh token matches this session
    if (!session.isValidRefreshToken(refreshToken)) {
      // Token doesn't match session - treat as success to avoid failing logout
      console.log('[Logout] Refresh token mismatch for session:', session.id);
      return {
        success: true,
        message: 'Logout successful',
      };
    }

    // Validate session is not expired or revoked
    if (!session.isValid()) {
      // Session already expired/revoked - treat as successful
      console.log('[Logout] Session already expired/revoked:', session.id);
      return {
        success: true,
        message: 'Logout successful',
      };
    }

    // Revoke the session (marks as revoked, keeps record for audit)
    const revokedSession = session.revoke();
    await this.sessionRepository.save(revokedSession);

    return {
      success: true,
      message: 'Logout successful',
    };
  }
}
