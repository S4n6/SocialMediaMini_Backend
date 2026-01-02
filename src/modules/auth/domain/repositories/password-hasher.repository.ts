import { Password } from '../value-objects/password.vo';

/**
 * Password Hasher Interface - Domain Service Contract
 * Pure domain abstraction for password operations
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
}
