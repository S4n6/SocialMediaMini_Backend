import { AuthUser } from './user.entity';
import { AuthToken } from './token.entity';

export interface AuthResult {
  success: boolean;
  message: string;
  user?: Partial<AuthUser>;
  accessToken?: string;
  refreshToken?: string;
  sessionId?: string;
}

export interface LoginResult extends AuthResult {
  user: {
    id: string;
    email: string;
    userName: string;
    fullName: string;
    avatar?: string;
    role: string;
  };
  accessToken: string;
  refreshToken: string;
  sessionId: string;
}

export interface RegisterResult {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    userName: string;
    fullName: string;
  };
}

export interface TokenRefreshResult {
  success: boolean;
  message: string;
  accessToken?: string;
  refreshToken?: string;
}

export interface PasswordResetResult {
  success: boolean;
  message: string;
}

export interface EmailVerificationResult {
  success: boolean;
  message: string;
  user?: Partial<AuthUser>;
}