// ===== USE CASE INPUT DTOs =====
// These DTOs are used for use case inputs/outputs and business logic
// No validation decorators - validation handled at presentation layer

export class RegisterUserDto {
  fullName: string;
  username: string;
  email: string;
  dateOfBirth: Date;
  phoneNumber?: string;
  gender?: string;
  avatar?: string;
}

export class LoginDto {
  identifier: string; // email or username
  password: string;
  rememberMe?: boolean;
  ipAddress?: string;
  userAgent?: string;
}

export class GoogleAuthDto {
  googleId: string;
  email: string;
  fullName: string;
  avatar?: string;
  emailVerified: boolean;
}

export class ForgotPasswordDto {
  email: string;
}

export class ResetPasswordDto {
  token: string;
  newPassword: string;
}

export class VerifyEmailDto {
  token: string;
  password: string;
}

export class RefreshTokenDto {
  refreshToken: string;
}

export class LogoutDto {
  refreshToken?: string;
  revokeAll?: boolean;
}

export class ChangePasswordDto {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

// ===== USE CASE OUTPUT DTOs =====

export class AuthResultDto {
  user: AuthUserDto;
  tokens: AuthTokensDto;
  session?: AuthSessionDto;
}

export class AuthUserDto {
  id: string;
  fullName: string;
  username: string;
  email: string;
  avatar?: string;
  role: string;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class AuthTokensDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export class AuthSessionDto {
  id: string;
  sessionId: string;
  userId: string;
  deviceInfo?: string;
  ipAddress?: string;
  userAgent?: string;
  isActive: boolean;
  expiresAt: Date;
  createdAt: Date;
  lastActiveAt: Date;
}

// Password validation DTOs
export class PasswordValidationDto {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
}

// Email verification DTOs
export class EmailVerificationDto {
  email: string;
  token: string;
  expiresAt: Date;
}

// Session management DTOs
export class SessionListDto {
  sessions: AuthSessionDto[];
  total: number;
  current?: string; // current session ID
}
