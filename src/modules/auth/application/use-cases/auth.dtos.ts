export interface RegisterUserRequest {
  username: string;
  email: string;
  fullName: string;
  avatar?: string;
  password: string;
}

export interface LoginRequest {
  email?: string;
  username?: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  sessionId: string;
  userId: string;
}

export interface LogoutAllDevicesRequest {
  userId: string;
  currentSessionId?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface VerifyEmailRequest {
  token: string;
  password?: string;
}

export interface GoogleAuthRequest {
  email: string;
  fullName: string;
  profilePicture?: string;
}

export interface RevokeTokenRequest {
  token: string;
  tokenType: 'access' | 'refresh';
}
