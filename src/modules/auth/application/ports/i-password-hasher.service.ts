import { Password } from '../../domain/value-objects/password.vo';

/**
 * Password Hasher Service Port - Application Layer
 * Contract for password hashing and verification operations
 */
export interface IPasswordHasherService {
  /**
   * Hash a plain password
   */
  hash(password: Password): Promise<string>;

  /**
   * Verify a password against its hash
   */
  verify(password: Password, hash: string): Promise<boolean>;
}
