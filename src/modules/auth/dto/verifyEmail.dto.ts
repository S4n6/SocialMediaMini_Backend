import { IsEmail, IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class VerifyEmailDto {
  @IsString()
  @IsNotEmpty({ message: 'Verification token is required' })
  token: string;
}

export class ResendVerificationDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;
}

export class EmailVerificationStatusDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;
}