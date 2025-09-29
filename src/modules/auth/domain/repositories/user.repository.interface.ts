import { AuthUser, AuthUserCreationData, AuthUserUpdateData } from '../entities';

export interface IUserRepository {
  // User creation and retrieval
  createUser(userData: AuthUserCreationData): Promise<AuthUser>;
  findUserById(id: string): Promise<AuthUser | null>;
  findUserByEmail(email: string): Promise<AuthUser | null>;
  findUserByUsername(username: string): Promise<AuthUser | null>;
  findUserByEmailOrUsername(identifier: string): Promise<AuthUser | null>;
  
  // User updates
  updateUser(id: string, userData: AuthUserUpdateData): Promise<AuthUser>;
  updateUserPassword(id: string, hashedPassword: string): Promise<void>;
  
  // Email verification
  setEmailVerificationToken(userId: string, token: string): Promise<void>;
  verifyEmailByToken(token: string): Promise<AuthUser | null>;
  
  // Password reset
  setPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<void>;
  findUserByPasswordResetToken(token: string): Promise<AuthUser | null>;
  clearPasswordResetToken(userId: string): Promise<void>;
  
  // User existence checks
  existsByEmail(email: string): Promise<boolean>;
  existsByUsername(username: string): Promise<boolean>;
}