export interface UserResponse {
  id: string;
  email: string;
  userName: string;
  fullName: string;
  avatar?: string | null;
  dateOfBirth: Date | null;
  phoneNumber?: string | null;
  bio?: string | null;
  location?: string | null;
  websiteUrl?: string | null;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  role: string;
  googleId?: string | null;
}

// Lightweight user item used for lists / search results to avoid returning full profile
export interface UserListItem {
  id: string;
  userName: string;
  fullName: string;
  avatar?: string | null;
  bio?: string | null;
  websiteUrl?: string | null;
}
export interface UserResponse {
  id: string;
  email: string;
  userName: string;
  fullName: string;
  avatar?: string | null;
  dateOfBirth: Date | null;
  phoneNumber?: string | null;
  bio?: string | null;
  location?: string | null;
  websiteUrl?: string | null;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  role: string;
  googleId?: string | null;
}
