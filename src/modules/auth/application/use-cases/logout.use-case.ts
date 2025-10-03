import { Injectable, UnauthorizedException } from '@nestjs/common';
import { BaseUseCase } from './base.use-case';
import { LogoutRequest } from './auth.dtos';
import { AuthResult } from '../../domain/entities';
import { ISessionRepository } from '../interfaces/session-repository.interface';
import { ITokenRepository } from '../interfaces/token-repository.interface';
import { Inject } from '@nestjs/common';
// Avoid importing tokens from auth.module to prevent circular dependency
const SESSION_REPOSITORY_TOKEN = 'SESSION_REPOSITORY';
const TOKEN_REPOSITORY_TOKEN = 'TOKEN_REPOSITORY';

@Injectable()
export class LogoutUseCase extends BaseUseCase<LogoutRequest, AuthResult> {
  constructor(
    @Inject(SESSION_REPOSITORY_TOKEN)
    private sessionRepository: ISessionRepository,
    @Inject(TOKEN_REPOSITORY_TOKEN)
    private tokenRepository: ITokenRepository,
  ) {
    super();
  }

  async execute(request: LogoutRequest): Promise<AuthResult> {
    const { sessionId, userId } = request;

    // Find and validate session
    const session =
      await this.sessionRepository.findSessionBySessionId(sessionId);
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
