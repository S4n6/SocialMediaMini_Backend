import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Response DTO for user data (public view)
 * Used for API responses when returning user information
 */
export class UserResponseDto {
  @ApiProperty({
    description: 'Unique user identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Username',
    example: 'johndoe',
  })
  username: string;

  @ApiProperty({
    description: 'Email address',
    example: 'john.doe@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Full name',
    example: 'John Doe',
  })
  fullName: string;

  @ApiPropertyOptional({
    description: 'User bio',
    example: 'I love coding and coffee!',
  })
  bio?: string;

  @ApiPropertyOptional({
    description: 'Avatar URL',
    example: 'https://example.com/avatar.jpg',
  })
  avatar?: string;

  @ApiPropertyOptional({
    description: 'Location',
    example: 'San Francisco, CA',
  })
  location?: string;

  @ApiPropertyOptional({
    description: 'Website URL',
    example: 'https://johndoe.com',
  })
  websiteUrl?: string;

  @ApiProperty({
    description: 'Email verification status',
    example: true,
  })
  isEmailVerified: boolean;

  @ApiProperty({
    description: 'Number of followers',
    example: 150,
  })
  followersCount: number;

  @ApiProperty({
    description: 'Number of following',
    example: 75,
  })
  followingCount: number;

  @ApiPropertyOptional({
    description: 'Whether current user is following this user',
    example: true,
  })
  isFollowing?: boolean;

  @ApiProperty({
    description: 'Account creation date',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update date',
    example: '2024-01-20T14:22:00Z',
  })
  updatedAt: Date;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}

/**
 * Response DTO for user profile (owner's detailed view)
 */
export class UserProfileResponseDto extends UserResponseDto {
  @ApiPropertyOptional({
    description: 'Phone number',
    example: '+1234567890',
  })
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: 'Gender',
    example: 'MALE',
  })
  gender?: string;

  @ApiPropertyOptional({
    description: 'Date of birth',
    example: '1990-01-15T00:00:00Z',
  })
  dateOfBirth?: Date;

  @ApiPropertyOptional({
    description: 'Email verification date',
    example: '2024-01-15T10:35:00Z',
  })
  emailVerifiedAt?: Date;

  @ApiPropertyOptional({
    description: 'Last profile update date',
    example: '2024-01-20T14:22:00Z',
  })
  lastProfileUpdate?: Date;

  @ApiProperty({
    description: 'User role',
    example: 'USER',
  })
  role: string;

  @ApiProperty({
    description: 'Account status',
    example: 'ACTIVE',
  })
  status: string;

  @ApiProperty({
    description: 'Whether user can create posts',
    example: true,
  })
  canCreatePost: boolean;

  @ApiProperty({
    description: 'Whether user can comment',
    example: true,
  })
  canComment: boolean;

  @ApiProperty({
    description: 'Account age in days',
    example: 45,
  })
  accountAge: number;

  @ApiProperty({
    description: 'Whether profile is complete',
    example: true,
  })
  isProfileComplete: boolean;

  constructor(partial: Partial<UserProfileResponseDto>) {
    super(partial);
    Object.assign(this, partial);
  }
}

/**
 * Response DTO for user list items (minimal data)
 */
export class UserListItemResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Username',
    example: 'johndoe',
  })
  username: string;

  @ApiProperty({
    description: 'Full name',
    example: 'John Doe',
  })
  fullName: string;

  @ApiPropertyOptional({
    description: 'Avatar URL',
    example: 'https://example.com/avatar.jpg',
  })
  avatar?: string;

  @ApiPropertyOptional({
    description: 'Bio',
    example: 'Software developer',
  })
  bio?: string;

  @ApiProperty({
    description: 'Followers count',
    example: 150,
  })
  followersCount: number;

  @ApiPropertyOptional({
    description: 'Whether current user is following',
    example: true,
  })
  isFollowing?: boolean;

  constructor(partial: Partial<UserListItemResponseDto>) {
    Object.assign(this, partial);
  }
}

/**
 * Response DTO for paginated user lists
 */
export class UserListResponseDto {
  @ApiProperty({
    description: 'List of users',
    type: [UserListItemResponseDto],
  })
  users: UserListItemResponseDto[];

  @ApiProperty({
    description: 'Total number of users',
    example: 1000,
  })
  total: number;

  @ApiProperty({
    description: 'Current page',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Items per page',
    example: 20,
  })
  limit: number;

  @ApiProperty({
    description: 'Whether there are more pages',
    example: true,
  })
  hasMore: boolean;

  constructor(partial: Partial<UserListResponseDto>) {
    Object.assign(this, partial);
  }
}

/**
 * Standard API success response wrapper
 */
export class ApiSuccessResponseDto<T = any> {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Success message',
    example: 'Operation completed successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Response data',
  })
  data: T;

  constructor(data: T, message: string = 'Success') {
    this.success = true;
    this.message = message;
    this.data = data;
  }
}

/**
 * Standard API error response
 */
export class ApiErrorResponseDto {
  @ApiProperty({
    description: 'Success status',
    example: false,
  })
  success: boolean;

  @ApiProperty({
    description: 'Error message',
    example: 'Something went wrong',
  })
  message: string;

  @ApiPropertyOptional({
    description: 'Error details',
    example: 'Validation failed',
  })
  error?: string;

  @ApiPropertyOptional({
    description: 'Error code',
    example: 400,
  })
  statusCode?: number;

  constructor(message: string, error?: string, statusCode?: number) {
    this.success = false;
    this.message = message;
    this.error = error;
    this.statusCode = statusCode;
  }
}
