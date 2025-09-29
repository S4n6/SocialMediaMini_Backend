export interface AuthSession {
  id: string;
  sessionId: string;
  userId: string;
  refreshToken: string;
  ipAddress?: string;
  userAgent?: string;
  isRevoked: boolean;
  createdAt: Date;
  expiresAt: Date;
  revokedAt?: Date;
}

export interface AuthSessionCreationData {
  sessionId: string;
  userId: string;
  refreshToken: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: Date;
}

export interface AuthSessionUpdateData {
  isRevoked?: boolean;
  revokedAt?: Date;
}