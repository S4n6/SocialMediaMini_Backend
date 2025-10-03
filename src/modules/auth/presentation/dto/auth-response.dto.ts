import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ===== RESPONSE DTOs =====

export class UserResponseDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'Full name' })
  fullName: string;

  @ApiProperty({ description: 'Username' })
  username: string;

  @ApiProperty({ description: 'Email address' })
  email: string;

  @ApiPropertyOptional({ description: 'Avatar URL' })
  avatar?: string;

  @ApiProperty({ description: 'User role' })
  role: string;

  @ApiProperty({ description: 'Email verification status' })
  isEmailVerified: boolean;

  @ApiProperty({ description: 'Account creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last profile update' })
  updatedAt: Date;
}

export class TokensResponseDto {
  @ApiProperty({ description: 'JWT access token' })
  accessToken: string;

  @ApiProperty({ description: 'Refresh token' })
  refreshToken: string;

  @ApiProperty({ description: 'Token expiration time in seconds' })
  expiresIn: number;

  @ApiProperty({ description: 'Token type', default: 'Bearer' })
  tokenType: string;
}

export class SessionResponseDto {
  @ApiProperty({ description: 'Session ID' })
  id: string;

  @ApiProperty({ description: 'Session identifier' })
  sessionId: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiPropertyOptional({ description: 'Device information' })
  deviceInfo?: string;

  @ApiPropertyOptional({ description: 'IP address' })
  ipAddress?: string;

  @ApiPropertyOptional({ description: 'User agent' })
  userAgent?: string;

  @ApiProperty({ description: 'Session active status' })
  isActive: boolean;

  @ApiProperty({ description: 'Session expiration date' })
  expiresAt: Date;

  @ApiProperty({ description: 'Session creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last activity date' })
  lastActiveAt: Date;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'Authenticated user information' })
  user: UserResponseDto;

  @ApiProperty({ description: 'Authentication tokens' })
  tokens: TokensResponseDto;

  @ApiPropertyOptional({ description: 'Session information' })
  session?: SessionResponseDto;

  @ApiProperty({ description: 'Success message' })
  message: string;
}

export class LoginResponseDto extends AuthResponseDto {
  @ApiProperty({ description: 'Login success message' })
  message: string;
}

export class RegisterResponseDto extends AuthResponseDto {
  @ApiProperty({ description: 'Registration success message' })
  message: string;
}

export class GoogleAuthResponseDto extends AuthResponseDto {
  @ApiProperty({ description: 'Google authentication success message' })
  message: string;

  @ApiProperty({ description: 'Whether this is a new user registration' })
  isNewUser: boolean;
}

export class RefreshTokenResponseDto {
  @ApiProperty({ description: 'New authentication tokens' })
  tokens: TokensResponseDto;

  @ApiProperty({ description: 'Token refresh success message' })
  message: string;
}

export class LogoutResponseDto {
  @ApiProperty({ description: 'Logout success message' })
  message: string;

  @ApiProperty({ description: 'Number of sessions revoked' })
  revokedSessions: number;
}

export class ForgotPasswordResponseDto {
  @ApiProperty({ description: 'Password reset request success message' })
  message: string;

  @ApiProperty({ description: 'Email where reset link was sent' })
  email: string;
}

export class ResetPasswordResponseDto {
  @ApiProperty({ description: 'Password reset success message' })
  message: string;
}

export class VerifyEmailResponseDto {
  @ApiProperty({ description: 'Email verification success message' })
  message: string;

  @ApiProperty({ description: 'Updated user information' })
  user: UserResponseDto;
}

export class ChangePasswordResponseDto {
  @ApiProperty({ description: 'Password change success message' })
  message: string;
}

export class SessionListResponseDto {
  @ApiProperty({
    description: 'List of user sessions',
    type: [SessionResponseDto],
  })
  sessions: SessionResponseDto[];

  @ApiProperty({ description: 'Total number of sessions' })
  total: number;

  @ApiPropertyOptional({ description: 'Current session ID' })
  currentSessionId?: string;
}

export class PasswordValidationResponseDto {
  @ApiProperty({ description: 'Password validation result' })
  isValid: boolean;

  @ApiProperty({
    description: 'Validation error messages',
    type: [String],
  })
  errors: string[];

  @ApiProperty({
    description: 'Password strength level',
    enum: ['weak', 'medium', 'strong'],
  })
  strength: 'weak' | 'medium' | 'strong';
}
