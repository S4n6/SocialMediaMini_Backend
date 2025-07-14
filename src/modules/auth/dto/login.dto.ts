import { IsEmail, IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class LoginDto {
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email?: string;

  @IsOptional()
  @IsString()
  userName?: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}
