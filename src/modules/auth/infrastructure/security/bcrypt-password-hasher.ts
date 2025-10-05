import { Injectable } from '@nestjs/common';
import { IPasswordHasher } from '../../application/interfaces/password-hasher.interface';
import { Password } from '../../domain/value-objects/password.vo';
import * as bcrypt from 'bcrypt';

/**
 * Bcrypt Password Hasher Implementation
 * Implements IPasswordHasher using bcrypt library
 */
@Injectable()
export class BcryptPasswordHasher implements IPasswordHasher {
  private readonly saltRounds = 12;

  async hash(password: Password): Promise<string> {
    const salt = await this.generateSalt();
    return bcrypt.hash(password.value, salt);
  }

  async verify(password: Password, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password.value, hash);
    } catch (error) {
      // Log error if needed
      return false;
    }
  }

  async generateSalt(): Promise<string> {
    return bcrypt.genSalt(this.saltRounds);
  }
}
