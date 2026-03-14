/**
 * Secure Token Generator Port - Application Layer
 *
 * Contract for generating cryptographically secure random tokens.
 * Infrastructure layer provides the implementation using Node crypto.
 */
export interface ISecureTokenGenerator {
  /**
   * Generate a URL-safe, cryptographically random token string.
   * @param byteLength Number of random bytes (output hex length = byteLength * 2)
   */
  generate(byteLength?: number): string;
}
