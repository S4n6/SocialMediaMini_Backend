import { Injectable, Inject } from '@nestjs/common';
import { IUserRepository } from '../../../domain/repositories/user.repository';
import { User as AuthUser } from '../../../domain/entities/user.entity';
import { UserMapper } from '../mappers/user.mapper';
import { UserPrismaRepository } from '../../../../users/infrastructure/persistence/repositories/user.repository';
import { UserId, UserEmail } from '../../../../users/domain/value-objects';
import { USER_REPOSITORY_TOKEN } from '../../../../users/users.constants';

/**
 * User Repository Implementation
 * Implements Auth domain IUserRepository using Users module repository
 * Follows Clean Architecture with proper domain mapping
 */
@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly usersRepository: UserPrismaRepository,
    private readonly mapper: UserMapper,
  ) {}

  /**
   * Save user (handles both create and update)
   * Infrastructure layer determines INSERT vs UPDATE based on entity state
   */
  async save(user: AuthUser): Promise<void> {
    // Map Auth User to Users User
    const usersUser = this.mapper.toUsersUser(user);

    // Delegate to Users repository (it handles INSERT/UPDATE logic)
    await this.usersRepository.save(usersUser);
  }

  async findById(id: string): Promise<AuthUser | null> {
    const usersUser = await this.usersRepository.findById(new UserId(id));
    return usersUser ? this.mapper.toAuthUser(usersUser) : null;
  }

  async findByEmail(email: string): Promise<AuthUser | null> {
    const usersUser = await this.usersRepository.findByEmail(
      new UserEmail(email),
    );
    return usersUser ? this.mapper.toAuthUser(usersUser) : null;
  }

  async findByGoogleId(googleId: string): Promise<AuthUser | null> {
    const usersUser = await this.usersRepository.findByGoogleId(googleId);
    return usersUser ? this.mapper.toAuthUser(usersUser) : null;
  }

  async existsByEmail(email: string): Promise<boolean> {
    return this.usersRepository.existsByEmail(new UserEmail(email));
  }

  async delete(id: string): Promise<void> {
    await this.usersRepository.delete(id);
  }
}
