import { Injectable, UnauthorizedException } from '@nestjs/common';
import { BaseUseCase } from './base.use-case';
import { RefreshTokenRequest } from './auth.dtos';
import { TokenRefreshResult } from '../../domain/entities';
import { ISessionRepository } from '../interfaces/session-repository.interface';
import { ITokenRepository } from '../interfaces/token-repository.interface';
import { Inject } from '@nestjs/common';
// Avoid importing tokens from auth.module to prevent circular dependency
const SESSION_REPOSITORY_TOKEN = 'SESSION_REPOSITORY';
const TOKEN_REPOSITORY_TOKEN = 'TOKEN_REPOSITORY';

@Injectable()
export class RefreshTokenUseCase extends BaseUseCase<
  RefreshTokenRequest,
  TokenRefreshResult
> {
  constructor(
    @Inject(SESSION_REPOSITORY_TOKEN)
    private sessionRepository: ISessionRepository,
    @Inject(TOKEN_REPOSITORY_TOKEN)
    private tokenRepository: ITokenRepository,
  ) {
    super();
  }

  async execute(request: RefreshTokenRequest): Promise<TokenRefreshResult> {
    const { refreshToken } = request;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    // Validate refresh token
    const session =
      await this.sessionRepository.findSessionByRefreshToken(refreshToken);
    if (!session || session.isRevoked) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Check if session is still valid
    if (session.expiresAt < new Date()) {
      throw new UnauthorizedException('Session has expired');
    }

    // Generate new tokens
    const tokens = await this.tokenRepository.refreshAccessToken(refreshToken);

    // Update session with new refresh token
    await this.sessionRepository.updateSession(session.id, {});

    return {
      success: true,
      message: 'Token refreshed successfully',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }
}
