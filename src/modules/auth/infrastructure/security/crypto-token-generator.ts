import { Injectable } from '@nestjs/common';
import { ISecureTokenGenerator } from '../../application/ports/i-secure-token-generator.service';
import { randomBytes, randomInt } from 'crypto';

/**
 * Crypto-based secure token generator.
 * Uses Node.js crypto module for CSPRNG output.
 */
@Injectable()
export class CryptoTokenGenerator implements ISecureTokenGenerator {
  /**
   * Generate a cryptographically random hex token.
   * @param byteLength Number of random bytes (output length = byteLength * 2)
   */
  generate(byteLength = 32): string {
    return randomBytes(byteLength).toString('hex');
  }

  /**
   * Generate a cryptographically random 6-digit OTP string.
   * Uses crypto.randomInt for uniform distribution across [0, 1_000_000).
   * Result is zero-padded to always be exactly 6 digits (e.g. '007421').
   */
  generateOtp(): string {
    const code = randomInt(0, 1_000_000);
    return code.toString().padStart(6, '0');
  }
}
