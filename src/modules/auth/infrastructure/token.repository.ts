import { Injectable } from '@nestjs/common';
import { ITokenRepository } from '../application/interfaces/token.repository.interface';
import { AuthToken, TokenType } from '../domain/entities/token.entity';
import { Token } from '../domain/value-objects/token.vo';
import { Email } from '../domain/value-objects/email.vo';
import { PrismaService } from '../../../database/prisma.service';

/**
 * Prisma Token Repository Implementation
 * Implements ITokenRepository using Prisma ORM
 */
@Injectable()
export class TokenRepository implements ITokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(token: AuthToken): Promise<AuthToken> {
    // NOTE: Requires Token model in Prisma schema
    // Placeholder implementation
    return token;
  }

  async findById(tokenId: string): Promise<AuthToken | null> {
    // Placeholder implementation
    return null;
  }

  async findByToken(token: string): Promise<AuthToken | null> {
    // Placeholder implementation
    return null;
  }

  async findByUserIdAndType(
    userId: string,
    type: string,
  ): Promise<AuthToken[]> {
    // Placeholder implementation
    return [];
  }

  async update(tokenId: string, token: Partial<AuthToken>): Promise<AuthToken> {
    // Placeholder implementation
    throw new Error('Method not implemented.');
  }

  async delete(tokenId: string): Promise<void> {
    // Placeholder implementation
  }

  async deleteByToken(token: string): Promise<void> {
    // Placeholder implementation
  }

  async deleteByUserIdAndType(userId: string, type: string): Promise<void> {
    // Placeholder implementation
  }

  async deleteExpired(): Promise<void> {
    // Placeholder implementation
  }

  async isValidToken(token: string): Promise<boolean> {
    // Placeholder implementation
    return false;
  }

  async markAsUsed(tokenId: string): Promise<void> {
    // Placeholder implementation
  }

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
    // Generate session ID for this login
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Generate tokens
    const accessToken = this.generateAccessTokenWithRole(userId, email, role);
    const refreshToken = this.generateRefreshToken(userId, sessionId);

    // Create session record in database
    await this.prisma.session.create({
      data: {
        id: `session_${sessionId}`,
        sessionId: sessionId,
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

    // Check if session is still valid
    const session = await this.prisma.session.findFirst({
      where: {
        sessionId: tokenData.sessionId,
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

    // Generate new tokens
    const newAccessToken = this.generateAccessTokenWithRole(
      tokenData.userId,
      tokenData.email,
      'USER',
    );
    const newRefreshToken = this.generateRefreshToken(
      tokenData.userId,
      tokenData.sessionId,
    );

    // Update session activity (session is still valid, no update needed for now)
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
      // Revoke the session associated with this refresh token
      await this.prisma.session.updateMany({
        where: {
          sessionId: tokenData.sessionId,
          userId: tokenData.userId,
        },
        data: { isRevoked: true },
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
