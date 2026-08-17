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

  /**
   * Generate a cryptographically random 6-digit numeric OTP string.
   * Returns a zero-padded string in the range '000000'–'999999'.
   */
  generateOtp(): string;
}
