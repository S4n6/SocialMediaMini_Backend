import { Password } from '../../domain/value-objects/password.vo';

/**
 * Password Hasher Interface - Domain Layer
 * Contract for password hashing operations
 */
export interface IPasswordHasher {
  /**
   * Hash a plain password
   */
  hash(password: Password): Promise<string>;

  /**
   * Verify a password against its hash
   */
  verify(password: Password, hash: string): Promise<boolean>;

  /**
   * Generate salt for password hashing
   */
  generateSalt(): Promise<string>;
}
