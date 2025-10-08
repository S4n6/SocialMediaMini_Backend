import { Injectable, UnauthorizedException } from '@nestjs/common';
import { BaseUseCase } from './base.use-case';
import { LogoutRequest } from './auth.dtos';
import { AuthResult } from '../../domain/entities';
import { ISessionRepository } from '../interfaces/session.repository.interface';
import { ITokenRepository } from '../interfaces/token.repository.interface';
// import { IRefreshTokenParser } from '../../domain/repositories/IRefreshTokenParser';
import { Inject } from '@nestjs/common';
// Avoid importing tokens from auth.module to prevent circular dependency
const SESSION_REPOSITORY_TOKEN = 'SESSION_REPOSITORY';
const TOKEN_REPOSITORY_TOKEN = 'TOKEN_REPOSITORY';
const REFRESH_TOKEN_PARSER_TOKEN = 'REFRESH_TOKEN_PARSER';

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
    const { refreshToken } = request;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    // Use the new sessionId-based approach - find session by refresh token hash
    const session =
      await this.sessionRepository.findByRefreshToken(refreshToken);

    if (!session) {
      throw new UnauthorizedException('Invalid session or refresh token');
    }

    // Validate that the refresh token matches this session
    if (!session.isValidRefreshToken(refreshToken)) {
      throw new UnauthorizedException('Refresh token does not match session');
    }

    // Validate session is not expired or revoked
    if (!session.isValid()) {
      throw new UnauthorizedException('Session is expired or revoked');
    }

    // Delete session completely using the database ID (not just revoke)
    await this.sessionRepository.delete(session.id);

    return {
      success: true,
      message: 'Logout successful',
    };
  }
}
