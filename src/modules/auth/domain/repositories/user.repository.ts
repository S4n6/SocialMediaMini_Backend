import { User } from '../entities/user.entity';

/**
 * User Repository Interface - Domain Layer
 * Pure domain contract for user persistence operations
 */
export interface IUserRepository {
  /**
   * Create new user
   */
  create(user: User): Promise<User>;

  /**
   * Find user by ID
   */
  findById(id: string): Promise<User | null>;

  /**
   * Find user by email
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Find user by google ID
   */
  findByGoogleId(googleId: string): Promise<User | null>;

  /**
   * Update user
   */
  update(id: string, user: Partial<User>): Promise<User>;

  /**
   * Delete user
   */
  delete(id: string): Promise<void>;

  /**
   * Check if user exists by email
   */
  existsByEmail(email: string): Promise<boolean>;

  /**
   * Update user verification status
   */
  updateVerificationStatus(id: string, isVerified: boolean): Promise<void>;

  /**
   * Update user password
   */
  updatePassword(id: string, hashedPassword: string): Promise<void>;
}
