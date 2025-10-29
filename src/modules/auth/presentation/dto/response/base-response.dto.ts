import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ===== BASE RESPONSE DTOs =====

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
