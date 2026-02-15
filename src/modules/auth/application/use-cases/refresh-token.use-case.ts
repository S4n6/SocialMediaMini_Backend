import { Injectable, Inject } from '@nestjs/common';
import { BaseUseCase } from './base.use-case';
import { RefreshTokenRequest } from './auth.dtos';
import { TokenRefreshResult } from '../../domain/entities';
import { ITokenRepository } from '../../domain/repositories/token.repository';
import { TOKEN_REPOSITORY_TOKEN } from '../../auth.constants';
import { InvalidTokenException } from '../../domain/exceptions/auth.exceptions';

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

    if (!refreshToken) {
      throw new InvalidTokenException('refresh');
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
      throw new InvalidTokenException('refresh');
    }
  }
}
