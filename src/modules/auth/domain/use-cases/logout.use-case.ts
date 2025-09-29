import { Injectable, UnauthorizedException } from '@nestjs/common';
import { BaseUseCase } from './base.use-case';
import { LogoutRequest } from './auth.dtos';
import { AuthResult } from '../entities';
import { ISessionRepository, ITokenRepository } from '../repositories';

@Injectable()
export class LogoutUseCase extends BaseUseCase<LogoutRequest, AuthResult> {
  constructor(
    private sessionRepository: ISessionRepository,
    private tokenRepository: ITokenRepository,
  ) {
    super();
  }

  async execute(request: LogoutRequest): Promise<AuthResult> {
    const { sessionId, userId } = request;

    // Find and validate session
    const session = await this.sessionRepository.findSessionBySessionId(sessionId);
    if (!session || session.userId !== userId || session.isRevoked) {
      throw new UnauthorizedException('Invalid session');
    }

    // Revoke session
    await this.sessionRepository.revokeSession(sessionId);

    // Revoke associated tokens
    await this.tokenRepository.revokeToken(session.refreshToken, 'refresh');

    return {
      success: true,
      message: 'Logout successful',
    };
  }
}