import { Injectable } from '@nestjs/common';
import { IPasswordHasherService } from '../../application/ports/i-password-hasher.service';
import { Password } from '../../domain/value-objects/password.vo';
import * as bcrypt from 'bcrypt';

/**
 * Bcrypt Password Hasher Adapter
 * Implements IPasswordHasherService using bcrypt library
 */
@Injectable()
export class BcryptPasswordAdapter implements IPasswordHasherService {
  private readonly saltRounds = 12;

  async hash(password: Password): Promise<string> {
    const salt = await this.generateSalt();
    return bcrypt.hash(password.value, salt);
  }

  async verify(password: Password, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password.value, hash);
    } catch (error) {
      console.error('Error verifying password:', error);
      return false;
    }
  }

  private async generateSalt(): Promise<string> {
    return bcrypt.genSalt(this.saltRounds);
  }
}
