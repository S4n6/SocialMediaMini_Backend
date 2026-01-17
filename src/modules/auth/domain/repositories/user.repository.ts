import { User } from '../entities/user.entity';

/**
 * User Repository Interface - Domain Layer
 *
 * Pure domain contract for user persistence operations.
 * In Clean Architecture/DDD, the Repository mimics a collection of Aggregate Roots.
 * We persist the full entity to ensure consistency and invariants.
 */
export interface IUserRepository {
  /**
   * Persist the User Aggregate Root.
   * Handles both creation and updates based on entity state.
   * The infrastructure layer determines whether to INSERT or UPDATE.
   *
   * @param user The full domain entity with validated state
   */
  save(user: User): Promise<void>;

  /**
   * Find user by ID
   */
  findById(id: string): Promise<User | null>;

  /**
   * Find user by email
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Find user by google ID
   */
  findByGoogleId(googleId: string): Promise<User | null>;

  /**
   * Check if user exists by email
   */
  existsByEmail(email: string): Promise<boolean>;

  /**
   * Delete user by ID
   * Note: In strict DDD, you might mark as deleted and save() instead,
   * but explicit delete is common in practical implementations.
   */
  delete(id: string): Promise<void>;
}
