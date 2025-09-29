export interface UserResponseDto {
  id: string;
  username: string;
  email: string;
  profile: {
    fullName: string;
    bio?: string;
    avatar?: string;
    location?: string;
    websiteUrl?: string;
    dateOfBirth?: Date;
    phoneNumber?: string;
    gender?: string;
  };
  role: string;
  status: string;
  isEmailVerified: boolean;
  emailVerifiedAt?: Date;
  followingCount: number;
  followersCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfileResponseDto {
  id: string;
  username: string;
  profile: {
    fullName: string;
    bio?: string;
    avatar?: string;
    location?: string;
    websiteUrl?: string;
  };
  followingCount: number;
  followersCount: number;
  postsCount?: number;
  isFollowing?: boolean;
  isFollowedBy?: boolean;
  mutualFollowersCount?: number;
}

export interface UserListResponseDto {
  users: UserProfileResponseDto[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrevious: boolean;
}
