import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ITokenGenerator } from '../adapters/token-generator.interface';
import { Token } from '../../domain/value-objects/token.vo';

/**
 * JWT Token Generator Implementation
 * Handles access and refresh tokens only.
 * Verification tokens are now managed by CryptoTokenGenerator + Redis.
 */
@Injectable()
export class JwtTokenGenerator implements ITokenGenerator {
  constructor(private readonly jwtService: JwtService) {}

  async generateAccessToken(
    userId: string,
    email: string,
    role: string,
  ): Promise<Token> {
    const payload = {
      sub: userId,
      email,
      role,
      type: 'access',
    };

    const tokenString = this.jwtService.sign(payload, {
      expiresIn: '15m', // 15 minutes
    });

    return new Token(tokenString, new Date(Date.now() + 15 * 60 * 1000));
  }

  async generateRefreshToken(
    sessionId: string,
    userId: string,
  ): Promise<Token> {
    const payload = {
      sub: userId,
      sessionId,
      type: 'refresh',
    };

    const tokenString = this.jwtService.sign(payload, {
      expiresIn: '7d', // 7 days
    });

    return new Token(
      tokenString,
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    );
  }


  async verifyAccessToken(token: Token): Promise<{
    userId: string;
    email: string;
    role: string;
    iat: number;
    exp: number;
  }> {
    try {
      const payload = this.jwtService.verify(token.value);

      if (payload.type !== 'access') {
        throw new Error('Invalid token type');
      }

      return {
        userId: payload.sub,
        email: payload.email,
        role: payload.role,
        iat: payload.iat,
        exp: payload.exp,
      };
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  async verifyRefreshToken(token: Token): Promise<{
    sessionId: string;
    userId: string;
    iat: number;
    exp: number;
  }> {
    try {
      const payload = this.jwtService.verify(token.value);

      if (payload.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      return {
        sessionId: payload.sessionId,
        userId: payload.sub,
        iat: payload.iat,
        exp: payload.exp,
      };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  isTokenExpired(token: Token): boolean {
    return token.isExpired();
  }
}
