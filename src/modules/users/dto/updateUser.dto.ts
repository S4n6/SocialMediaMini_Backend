import {
  IsEmail,
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsUrl,
  IsIn,
  Matches,
  IsDate,
} from 'class-validator';
import { Role } from 'src/constants/roles.constant';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @MaxLength(30, { message: 'Username must not exceed 30 characters' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers, and underscores',
  })
  username?: string;

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

  @IsString()
  @IsOptional()
  @IsIn([Role.USER, Role.ADMIN, Role.MODERATOR, Role.SUPER_ADMIN], {
    message: 'Role must be one of: user, admin, moderator, super_admin',
  })
  role?: Role;
}
