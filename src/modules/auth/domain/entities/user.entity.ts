export interface AuthUser {
  id: string;
  email: string;
  username: string;
  fullName: string;
  password?: string;
  avatar?: string;
  role: string;
  isEmailVerified: boolean;
  emailVerifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthUserCreationData {
  username: string;
  email: string;
  fullName: string;
  password?: string;
  avatar?: string;
  role?: string;
  isEmailVerified?: boolean;
  emailVerificationToken?: string;
}

export interface AuthUserUpdateData {
  username?: string;
  email?: string;
  fullName?: string;
  password?: string;
  avatar?: string;
  isEmailVerified?: boolean;
  emailVerifiedAt?: Date;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
}
