import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsUrl,
  IsPhoneNumber,
  IsDateString,
  IsIn,
} from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * DTO for creating a new user
 */
export class CreateUserDto {
  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @MaxLength(30, { message: 'Username cannot exceed 30 characters' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  username: string;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @MaxLength(128, { message: 'Password cannot exceed 128 characters' })
  password: string;

  @IsString()
  @MinLength(2, { message: 'Full name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Full name cannot exceed 100 characters' })
  fullName: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Bio cannot exceed 500 characters' })
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Location cannot exceed 100 characters' })
  location?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Please provide a valid website URL' })
  websiteUrl?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Please provide a valid date of birth' })
  dateOfBirth?: string;

  @IsOptional()
  @IsPhoneNumber(undefined, { message: 'Please provide a valid phone number' })
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @IsIn(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'])
  gender?: string;
}

/**
 * DTO for Google OAuth user creation
 */
export class CreateGoogleUserDto {
  @IsString()
  googleId: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(3)
  @MaxLength(30)
  username: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName: string;

  @IsOptional()
  @IsString()
  avatar?: string;
}

/**
 * DTO for updating user profile
 */
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Full name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Full name cannot exceed 100 characters' })
  fullName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Bio cannot exceed 500 characters' })
  bio?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Location cannot exceed 100 characters' })
  location?: string;

  @IsOptional()
  @IsUrl({}, { message: 'Please provide a valid website URL' })
  websiteUrl?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Please provide a valid date of birth' })
  dateOfBirth?: string;

  @IsOptional()
  @IsPhoneNumber(undefined, { message: 'Please provide a valid phone number' })
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @IsIn(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'])
  gender?: string;
}

/**
 * DTO for user response (public data)
 */
export class UserResponseDto {
  id: string;
  username: string;
  email: string;
  fullName: string;
  bio?: string;
  avatar?: string;
  location?: string;
  websiteUrl?: string;
  isEmailVerified: boolean;
  followersCount: number;
  followingCount: number;
  isFollowing?: boolean; // Only present when viewed by another user
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}

/**
 * DTO for user profile response (private data for owner)
 */
export class UserProfileResponseDto extends UserResponseDto {
  phoneNumber?: string;
  gender?: string;
  dateOfBirth?: Date;
  emailVerifiedAt?: Date;
  lastProfileUpdate?: Date;
  role: string;
  status: string;
  canCreatePost: boolean;
  canComment: boolean;
  accountAge: number;
  isProfileComplete: boolean;

  constructor(partial: Partial<UserProfileResponseDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}

/**
 * DTO for user list (minimal data)
 */
export class UserListItemDto {
  id: string;
  username: string;
  fullName: string;
  avatar?: string;
  bio?: string;
  followersCount: number;
  isFollowing?: boolean;

  constructor(partial: Partial<UserListItemDto>) {
    Object.assign(this, partial);
  }
}

/**
 * DTO for follow/unfollow operations
 */
export class FollowUserDto {
  @IsString()
  targetUserId: string;
}

/**
 * DTO for user search query
 */
export class SearchUsersDto {
  @IsString()
  @MinLength(2, { message: 'Search query must be at least 2 characters long' })
  @MaxLength(100, { message: 'Search query cannot exceed 100 characters' })
  query: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  limit?: number = 20;
}

/**
 * DTO for getting user followers/following
 */
export class GetFollowersDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  limit?: number = 20;
}
