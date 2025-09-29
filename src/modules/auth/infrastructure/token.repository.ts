import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ITokenRepository } from '../domain/repositories';
import {
  AuthToken,
  TokenPayload,
  AccessTokenData,
  RefreshTokenData,
} from '../domain/entities';
import * as crypto from 'crypto';

@Injectable()
export class TokenRepository implements ITokenRepository {
  constructor(private jwtService: JwtService) {}

  async generateAccessToken(payload: AccessTokenData): Promise<string> {
    return this.jwtService.signAsync(
      {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        sessionId: payload.sessionId,
      },
      {
        expiresIn: '15m', // 15 minutes
      },
    );
  }

  async generateRefreshToken(): Promise<string> {
    return crypto.randomBytes(64).toString('hex');
  }

  async createTokensForUser(
    userId: string,
    email: string,
    role: string,
  ): Promise<AuthToken> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const accessToken = await this.generateAccessToken({
      userId,
      email,
      role,
      sessionId,
    });

    const refreshToken = await this.generateRefreshToken();

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
      tokenType: 'Bearer',
    };
  }

  async validateAccessToken(token: string): Promise<TokenPayload | null> {
    try {
      const payload = await this.jwtService.verifyAsync(token);
      return payload as TokenPayload;
    } catch (error) {
      return null;
    }
  }

  async validateRefreshToken(
    refreshToken: string,
  ): Promise<TokenPayload | null> {
    // For refresh tokens, we need to validate against stored sessions
    // This would typically involve checking against the session repository
    // For now, return null as we need session integration
    return null;
  }

  async refreshAccessToken(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // This would typically:
    // 1. Validate the refresh token against session storage
    // 2. Get user info from session
    // 3. Generate new access token
    // 4. Optionally rotate refresh token

    // For now, throw error as this needs session repository integration
    throw new Error('Token refresh requires session repository integration');
  }

  async revokeToken(
    token: string,
    tokenType: 'access' | 'refresh',
  ): Promise<void> {
    // For JWT access tokens, we can't really revoke them without a blacklist
    // For refresh tokens, we would revoke the associated session
    console.log(`Revoking ${tokenType} token: ${token}`);
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    // This would typically revoke all sessions for the user
    console.log(`Revoking all tokens for user: ${userId}`);
  }

  async cleanupExpiredTokens(): Promise<number> {
    // JWT tokens expire automatically, refresh tokens are cleaned via sessions
    return 0;
  }

  async decodeToken(token: string): Promise<TokenPayload | null> {
    try {
      const decoded = this.jwtService.decode(token);
      return decoded as TokenPayload;
    } catch (error) {
      return null;
    }
  }

  async isTokenExpired(token: string): Promise<boolean> {
    try {
      await this.jwtService.verifyAsync(token);
      return false;
    } catch (error) {
      return true;
    }
  }
}
