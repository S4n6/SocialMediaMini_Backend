import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  UserResponseDto,
  TokensResponseDto,
  SessionResponseDto,
} from './base-response.dto';

// ===== AUTHENTICATION RESPONSE DTOs =====

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
