import { BadRequestException } from '@nestjs/common';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsUrl,
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
  @Matches(/^[a-z0-9._]+$/, {
    message:
      'Username can only contain lowercase letters, numbers, dot and underscore',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  userName?: string;

  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  @MinLength(2, { message: 'Full name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Full name must not exceed 50 characters' })
  fullName: string;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @MaxLength(100, { message: 'Password must not exceed 100 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  password: string;

  @IsNotEmpty({ message: 'Date of birth is required' })
  @IsDate({ message: 'Date of birth must be a valid date' })
  @Transform(({ value }) => {
    if (!value) return value;
    if (typeof value === 'string') {
      // try ISO first
      const iso = new Date(value);
      if (!isNaN(iso.getTime())) return iso;

      // fallback to dd/MM/yyyy
      const parsedDate = parse(value, 'dd/MM/yyyy', new Date());
      if (!isValid(parsedDate)) {
        throw new BadRequestException(
          'Invalid date format. Use ISO (YYYY-MM-DD) or DD/MM/YYYY.',
        );
      }
      return parsedDate;
    }
    return value;
  })
  dateOfBirth: Date;

  @IsString()
  @IsOptional()
  @MaxLength(10, { message: 'Gender must not exceed 10 characters' })
  gender?: string;

  @IsOptional()
  @IsString()
  @MaxLength(15, { message: 'Phone number must not exceed 15 characters' })
  phoneNumber?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Avatar must be a valid URL' })
  avatar?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Bio must not exceed 500 characters' })
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Location must not exceed 100 characters' })
  location?: string;

  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const v = value.trim();
      return v === '' ? undefined : v;
    }
    return value;
  })
  @IsOptional()
  @IsUrl({}, { message: 'Website URL must be a valid URL' })
  @MaxLength(200, { message: 'Website URL must not exceed 200 characters' })
  websiteUrl?: string;
}
