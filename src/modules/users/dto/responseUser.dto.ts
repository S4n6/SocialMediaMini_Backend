export interface UserResponse {
  id: string;
  email: string;
  fullName: string;
  avatar?: string | null;
  dateOfBirth: Date;
  phoneNumber?: string | null;
  bio?: string | null;
  location?: string | null;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  role: string;
}
