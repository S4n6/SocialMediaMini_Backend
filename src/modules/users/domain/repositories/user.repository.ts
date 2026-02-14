import { User } from '../entities/user.entity';

/**
 * Repository interface for User aggregate
 * This interface defines the contract for user persistence operations
 * Used by application layer to abstract data access
 */
export interface IUserRepository {
  // Basic CRUD operations
  save(user: User): Promise<void>;
  findById(id: string): Promise<User | null>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;

  // User-specific queries
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findByGoogleId(googleId: string): Promise<User | null>;
  existsByEmail(email: string): Promise<boolean>;
  existsByUsername(username: string): Promise<boolean>;

  // User authentication queries
  findByEmailOrUsername(emailOrUsername: string): Promise<User | null>;

  // Search operations
  searchUsers(
    query: string,
    page: number,
    limit: number,
  ): Promise<{
    users: User[];
    total: number;
    hasMore: boolean;
  }>;

  // Bulk operations
  findMultipleByIds(ids: string[]): Promise<User[]>;
}
