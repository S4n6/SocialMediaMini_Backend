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
    // @Inject(REFRESH_TOKEN_PARSER_TOKEN)
    // private refreshTokenParser: IRefreshTokenParser,
  ) {
    super();
  }

  async execute(request: LogoutRequest): Promise<AuthResult> {
    const { refreshToken } = request;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    // Extract userId and sessionId from refresh token using parser (Clean Architecture way)
    // TODO: Implement proper refresh token parsing through domain service
    const tokenPayload = JSON.parse(
      Buffer.from(refreshToken, 'base64').toString(),
    );
    const sessionId = tokenPayload.sessionId;
    const userId = tokenPayload.userId;

    // Find session to validate it exists and belongs to the user
    const session = await this.sessionRepository.findById(sessionId);
    console.log('session found for logout:', session);
    if (!session || session.userId !== userId) {
      throw new UnauthorizedException('Invalid session');
    }

    // Delete session completely (not just revoke)
    await this.sessionRepository.delete(sessionId);

    return {
      success: true,
      message: 'Logout successful',
    };
  }
}
