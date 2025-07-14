import { BadRequestException } from '@nestjs/common';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsUrl,
  IsIn,
  IsDateString,
  Matches,
  IsNotEmpty,
  IsDate,
} from 'class-validator';
import { isValid, parse } from 'date-fns';

export class CreateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @MaxLength(30, { message: 'Username must not exceed 30 characters' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers, and underscores',
  })
  username?: string;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(100, { message: 'Password must not exceed 100 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  password: string;

  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Full name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Full name must not exceed 100 characters' })
  fullname?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Profile picture must be a valid URL' })
  profilePicture?: string;

  @IsOptional()
  @IsString()
  @IsIn(['male', 'female', 'other'], {
    message: 'Gender must be either male, female, or other',
  })
  gender?: string;

  @IsOptional()
  @IsDate({
    message: 'Birth date must be a valid date',
  })
  birthDate?: Date;
}
