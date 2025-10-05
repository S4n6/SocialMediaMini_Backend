import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ITokenGenerator } from '../../application/interfaces/token-generator.interface';
import { Token } from '../../domain/value-objects/token.vo';

/**
 * JWT Token Generator Implementation
 * Implements ITokenGenerator using JWT
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

  async generateVerificationToken(
    userId: string,
    email: string,
  ): Promise<Token> {
    const payload = {
      sub: userId,
      email,
      type: 'verification',
    };

    const tokenString = this.jwtService.sign(payload, {
      expiresIn: '24h', // 24 hours
    });

    return new Token(tokenString, new Date(Date.now() + 24 * 60 * 60 * 1000));
  }

  async generatePasswordResetToken(
    userId: string,
    email: string,
  ): Promise<Token> {
    const payload = {
      sub: userId,
      email,
      type: 'password-reset',
    };

    const tokenString = this.jwtService.sign(payload, {
      expiresIn: '1h', // 1 hour
    });

    return new Token(tokenString, new Date(Date.now() + 60 * 60 * 1000));
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

  async verifyVerificationToken(token: Token): Promise<{
    userId: string;
    email: string;
    iat: number;
    exp: number;
  }> {
    try {
      const payload = this.jwtService.verify(token.value);

      if (payload.type !== 'verification') {
        throw new Error('Invalid token type');
      }

      return {
        userId: payload.sub,
        email: payload.email,
        iat: payload.iat,
        exp: payload.exp,
      };
    } catch (error) {
      throw new Error('Invalid verification token');
    }
  }

  async verifyPasswordResetToken(token: Token): Promise<{
    userId: string;
    email: string;
    iat: number;
    exp: number;
  }> {
    try {
      const payload = this.jwtService.verify(token.value);

      if (payload.type !== 'password-reset') {
        throw new Error('Invalid token type');
      }

      return {
        userId: payload.sub,
        email: payload.email,
        iat: payload.iat,
        exp: payload.exp,
      };
    } catch (error) {
      throw new Error('Invalid password reset token');
    }
  }

  isTokenExpired(token: Token): boolean {
    return token.isExpired();
  }
}
