import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { BaseUseCase } from './base.use-case';
import { RefreshTokenRequest } from './auth.dtos';
import { TokenRefreshResult } from '../../domain/entities';
import { ITokenRepository } from '../interfaces/token.repository.interface';
import { TOKEN_REPOSITORY_TOKEN } from '../../auth.constants';

@Injectable()
export class RefreshTokenUseCase extends BaseUseCase<
  RefreshTokenRequest,
  TokenRefreshResult
> {
  constructor(
    @Inject(TOKEN_REPOSITORY_TOKEN)
    private tokenService: ITokenRepository, // Use interface with DI token
  ) {
    super();
  }

  async execute(request: RefreshTokenRequest): Promise<TokenRefreshResult> {
    const { refreshToken } = request;

    console.log('RefreshTokenUseCase called with request:', request);

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    try {
      // Use TokenService to handle refresh token logic with proper session management
      const tokens = await this.tokenService.refreshAccessToken(refreshToken);

      return {
        success: true,
        message: 'Token refreshed successfully',
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Failed to refresh token');
    }
  }
}
