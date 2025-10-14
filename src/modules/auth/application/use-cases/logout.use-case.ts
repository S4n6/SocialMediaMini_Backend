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
  ) {
    super();
  }

  async execute(request: LogoutRequest): Promise<AuthResult> {
    const { refreshToken } = request;
    if (!refreshToken) {
      return {
        success: true,
        message: 'Logout successful',
      };
    }

    const session =
      await this.sessionRepository.findByRefreshToken(refreshToken);

    if (!session) {
      return {
        success: true,
        message: 'Logout successful',
      };
    }

    // Validate that the refresh token matches this session
    if (!session.isValidRefreshToken(refreshToken)) {
      // Token doesn't match session - treat as success to avoid failing logout
      return {
        success: true,
        message: 'Logout successful',
      };
    }

    // Validate session is not expired or revoked
    if (!session.isValid()) {
      // Session already expired/revoked - treat as successful
      return {
        success: true,
        message: 'Logout successful',
      };
    }

    // Delete session completely using the database ID (not just revoke)
    await this.sessionRepository.delete(session.id);

    return {
      success: true,
      message: 'Logout successful',
    };
  }
}
