export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
  tokenType?: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  sessionId?: string;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenData {
  userId: string;
  sessionId: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface AccessTokenData {
  userId: string;
  email: string;
  role: string;
  sessionId?: string;
}