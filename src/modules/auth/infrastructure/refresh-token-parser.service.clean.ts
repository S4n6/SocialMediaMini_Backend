import { Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class RefreshTokenParserService {
  parseRefreshToken(refreshToken: string): any {
    try {
      const tokenPayload = JSON.parse(
        Buffer.from(refreshToken, 'base64').toString(),
      );

      const { sessionId, userId, timestamp } = tokenPayload;

      if (!sessionId || !userId || !timestamp) {
        throw new UnauthorizedException('Invalid refresh token format');
      }

      return {
        sessionId,
        userId,
        timestamp,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token format');
    }
  }

  validateRefreshTokenFormat(refreshToken: string): boolean {
    try {
      this.parseRefreshToken(refreshToken);
      return true;
    } catch {
      return false;
    }
  }
}
