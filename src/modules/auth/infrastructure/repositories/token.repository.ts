import { Injectable, Inject } from '@nestjs/common';
import { ITokenRepository } from '../../application/interfaces/token.repository.interface';
import { AuthToken, TokenType } from '../../domain/entities/token.entity';
import { Token } from '../../domain/value-objects/token.vo';
import { Email } from '../../domain/value-objects/email.vo';
import { PrismaService } from '../../../../database/prisma.service';
import { VerificationTokenService } from '../services/verification-token.service';
import { AuthSession } from '../../domain/entities/session.entity';
import { JwtService } from '@nestjs/jwt';
import { JWT } from '../../../../config/jwt.config';

/**
 * Prisma Token Repository Implementation
 * Implements ITokenRepository using Prisma ORM
 */
@Injectable()
export class TokenRepository implements ITokenRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly verificationTokenService: VerificationTokenService,
    private readonly jwtService: JwtService,
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
    const payload = {
      sub: userId,
      email: email,
      role: role,
      type: 'access',
    };

    // Use JwtService to sign the token so JwtStrategy can verify it using the
    // same secret configured in JwtModule.register(...)
    return this.jwtService.sign(payload, {
      secret: JWT.SECRET,
      expiresIn: JWT.EXPIRES_IN,
    });
  }

  generateRefreshToken(userId: string, sessionId: string): string {
    // Generate refresh token with session info
    const payload = {
      sub: userId,
      sessionId: sessionId,
      type: 'refresh',
    };

    return this.jwtService.sign(payload, {
      secret: JWT.REFRESH_SECRET || JWT.SECRET,
      expiresIn: JWT.REFRESH_EXPIRES_IN,
    });
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
    // Validate and verify refresh token signature and payload
    let tokenData;
    try {
      const verified = this.jwtService.verify(refreshToken, {
        secret: JWT.REFRESH_SECRET || JWT.SECRET,
      }) as any;

      // Basic checks
      if (!verified || verified.type !== 'refresh' || !verified.sub) {
        throw new Error('Invalid refresh token');
      }

      tokenData = {
        userId: verified.sub,
        email: verified.email || 'unknown@example.com',
        sessionId: verified.sessionId,
      };
    } catch (err) {
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
    try {
      const verified = this.jwtService.verify(refreshToken, {
        secret: JWT.REFRESH_SECRET || JWT.SECRET,
      }) as any;

      if (!verified || verified.type !== 'refresh' || !verified.sub) {
        return;
      }

      const sessionId = AuthSession.generateSessionId(refreshToken);
      await this.prisma.session.updateMany({
        where: {
          sessionId: sessionId,
          userId: verified.sub,
        },
        data: {
          isRevoked: true,
        },
      });
    } catch (err) {
      // ignore invalid tokens
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

  // Note: refresh token verification is done via JwtService.verify in refreshAccessToken
  // and revokeRefreshToken, so no separate manual parsing is required.
}
