import { Injectable } from '@nestjs/common';
import { ISecureTokenGenerator } from '../../application/ports/i-secure-token-generator.service';
import { randomBytes } from 'crypto';

/**
 * Crypto-based secure token generator.
 * Uses Node.js crypto.randomBytes for CSPRNG output.
 */
@Injectable()
export class CryptoTokenGenerator implements ISecureTokenGenerator {
  generate(byteLength = 32): string {
    return randomBytes(byteLength).toString('hex');
  }
}
