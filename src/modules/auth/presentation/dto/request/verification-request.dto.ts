import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// ===== EMAIL VERIFICATION REQUEST DTOs =====

export class VerifyEmailRequestDto {
  @ApiProperty({
    description: 'Email verification token',
  })
  @IsString()
  @IsNotEmpty({ message: 'Verification token is required' })
  token: string;

  @ApiProperty({
    description: 'Password to set upon verification',
    minLength: 8,
    maxLength: 128,
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
  })
  password: string;
}

export class ResendVerificationRequestDto {
  @ApiProperty({
    description: 'Email address',
    format: 'email',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;
}
