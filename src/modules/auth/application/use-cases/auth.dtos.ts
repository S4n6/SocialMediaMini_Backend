export interface RegisterUserRequest {
  username: string;
  email: string;
  fullName: string;
  avatar?: string;
  dateOfBirth?: Date;
  phoneNumber?: string;
  gender?: 'male' | 'female' | 'other';
}

export interface LoginRequest {
  email?: string;
  username?: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
  deviceName?: string;
  deviceType?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken?: string;
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
  /** The user's email address (used to look up the userId for OTP verification) */
  email: string;
  /** The 6-digit OTP sent to the user's email */
  code: string;
  /** Password to set upon first verification (optional for OAuth-registered users) */
  password?: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface GoogleAuthRequest {
  googleId: string;
  email: string;
  fullName: string;
  profilePicture?: string;
}

export interface RevokeTokenRequest {
  token: string;
  tokenType: 'access' | 'refresh';
}
