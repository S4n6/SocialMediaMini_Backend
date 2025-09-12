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
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  role: string;
  googleId?: string | null;
}
