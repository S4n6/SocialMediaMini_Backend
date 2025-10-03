import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SessionService } from './session.repository';
import { ITokenRepository } from '../application/interfaces/token-repository.interface';

@Injectable()
export class TokenService {
  // TODO: Implement ITokenRepository properly - interface mismatch needs fixing
  constructor(
    private jwtService: JwtService,
    private sessionService: SessionService,
  ) {}

  // ===== ACCESS TOKEN =====

  generateAccessToken(userId: string, email: string): string {
    const payload = { sub: userId, email };
    return this.jwtService.sign(payload);
  }

  // ===== TOKEN PAIR GENERATION =====

  async createTokensForUser(
    userId: string,
    email: string,
    role: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = this.generateAccessToken(userId, email);
    const refreshToken = await this.sessionService.createSession(
      userId,
      userAgent,
      ipAddress,
    );

    return { accessToken, refreshToken };
  }

  // ===== TOKEN REFRESH (RTR) =====

  async refreshAccessToken(refreshToken: string) {
    // Verify current session and get user data
    const tokenData =
      await this.sessionService.verifyAndUpdateSession(refreshToken);

    // Get current session info
    const currentSession =
      await this.sessionService.getSessionFromRefreshToken(refreshToken);

    // Generate new access token
    const accessToken = this.generateAccessToken(
      tokenData.userId,
      tokenData.email,
    );

    // Rotate refresh token within same session
    const newRefreshToken = await this.sessionService.rotateRefreshToken(
      currentSession.sessionId,
    );

    return {
      accessToken,
      refreshToken: newRefreshToken,
      userId: tokenData.userId,
      email: tokenData.email,
    };
  }

  // ===== TOKEN REVOCATION =====

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    await this.sessionService.deleteSession(refreshToken);
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.sessionService.deleteAllUserSessions(userId);
  }
}
