import { Injectable } from '@nestjs/common';
import { ITokenRepository } from '../../application/interfaces/token.repository.interface';
import { AuthToken, TokenType } from '../../domain/entities/token.entity';
import { Token } from '../../domain/value-objects/token.vo';
import { Email } from '../../domain/value-objects/email.vo';
import { PrismaService } from '../../../../database/prisma.service';
import { VerificationTokenService } from '../services/verification-token.service';
import { AuthSession } from '../../domain/entities/session.entity';

/**
 * Prisma Token Repository Implementation
 * Implements ITokenRepository using Prisma ORM
 */
@Injectable()
export class TokenRepository implements ITokenRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly verificationTokenService: VerificationTokenService,
  ) {}

  // NOTE: CRUD/lifecycle token methods removed - TokenRepository only exposes
  // high-level token operations used by the application (createTokensForUser,
  // refreshAccessToken, revokeRefreshToken, revokeAllUserTokens, generateAccessToken,
  // generateEmailVerificationToken). If you need persistent tokens later,
  // reintroduce CRUD methods and Prisma Token model.

  // High-level business operations
  generateAccessToken(userId: string, email: string): string {
    return this.generateAccessTokenWithRole(userId, email, 'USER'); // Default role
  }

  private generateAccessTokenWithRole(
    userId: string,
    email: string,
    role: string,
  ): string {
    // Generate JWT access token with user claims
    const payload = {
      sub: userId,
      email: email,
      role: role,
      type: 'access',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 15 * 60, // 15 minutes
    };

    // Simple JWT-like token (in production, use proper JWT library with signing)
    const header = Buffer.from(
      JSON.stringify({ typ: 'JWT', alg: 'HS256' }),
    ).toString('base64');
    const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64');
    return `${header}.${payloadStr}.signature`;
  }

  generateRefreshToken(userId: string, sessionId: string): string {
    // Generate refresh token with session info
    const payload = {
      sub: userId,
      sessionId: sessionId,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
    };

    const header = Buffer.from(
      JSON.stringify({ typ: 'JWT', alg: 'HS256' }),
    ).toString('base64');
    const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64');
    return `${header}.${payloadStr}.refresh_signature`;
  }

  async createTokensForUser(
    userId: string,
    email: string,
    role: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // Generate unique database ID for the session
    const databaseId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Generate tokens
    const accessToken = this.generateAccessTokenWithRole(userId, email, role);
    const refreshToken = this.generateRefreshToken(userId, databaseId);

    // Generate sessionId as hash of refresh token
    const sessionId = AuthSession.generateSessionId(refreshToken);

    // Create session record in database with hashed sessionId
    await this.prisma.session.create({
      data: {
        id: databaseId,
        sessionId: sessionId, // This is now the hash of the refresh token
        userId: userId,
        ipAddress: ipAddress,
        userAgent: userAgent,
        isRevoked: false,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return { accessToken, refreshToken };
  }

  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    userId: string;
    email: string;
  }> {
    // Validate refresh token
    const tokenData = this.validateRefreshToken(refreshToken);

    if (!tokenData) {
      throw new Error('Invalid or expired refresh token');
    }

    // Use the new sessionId hashing approach to find session
    const sessionId = AuthSession.generateSessionId(refreshToken);
    const session = await this.prisma.session.findFirst({
      where: {
        sessionId: sessionId,
        userId: tokenData.userId,
        isRevoked: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!session) {
      throw new Error('Session not found or expired');
    }

    // Generate new tokens (keep same session database ID)
    const newAccessToken = this.generateAccessTokenWithRole(
      tokenData.userId,
      tokenData.email,
      'USER',
    );
    const newRefreshToken = this.generateRefreshToken(
      tokenData.userId,
      session.id, // Use database ID for token generation
    );

    // Update sessionId with new refresh token hash
    const newSessionId = AuthSession.generateSessionId(newRefreshToken);
    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        sessionId: newSessionId,
        lastUsedAt: new Date(),
      },
    });

    console.log('Refreshed tokens for session:', session.id);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      userId: tokenData.userId,
      email: tokenData.email,
    };
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    const tokenData = this.validateRefreshToken(refreshToken);

    if (tokenData) {
      // Use the new sessionId hashing approach to find and revoke session
      const sessionId = AuthSession.generateSessionId(refreshToken);
      await this.prisma.session.updateMany({
        where: {
          sessionId: sessionId,
          userId: tokenData.userId,
        },
        data: {
          isRevoked: true,
        },
      });
    }
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    // Revoke all user sessions
    await this.prisma.session.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });
  }

  // Email verification token (non-persistent quick token)
  async generateEmailVerificationToken(
    userId: string,
    email: string,
  ): Promise<string> {
    // Delegate to existing VerificationTokenService which signs JWTs
    const token = this.verificationTokenService.generateEmailVerificationToken(
      userId,
      email,
    );
    return Promise.resolve(token);
  }

  // Helper method to validate refresh token
  private validateRefreshToken(
    refreshToken: string,
  ): { userId: string; email: string; sessionId: string } | null {
    try {
      if (!refreshToken.includes('.')) {
        return null;
      }

      const parts = refreshToken.split('.');
      if (parts.length < 2) {
        return null;
      }

      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

      // Check expiration
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        return null;
      }

      // Check token type
      if (payload.type !== 'refresh') {
        return null;
      }

      return {
        userId: payload.sub,
        email: payload.email || 'unknown@example.com',
        sessionId: payload.sessionId,
      };
    } catch (error) {
      console.error('Error validating refresh token:', error);
      return null;
    }
  }
}
