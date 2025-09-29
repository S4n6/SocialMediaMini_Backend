/**
 * Generic repository interface for domain entities
 * T - Entity type
 * K - Entity ID type
 */
export interface IRepository<T, K> {
  /**
   * Find entity by ID
   */
  findById(id: K): Promise<T | null>;

  /**
   * Save entity (create or update)
   */
  save(entity: T): Promise<T>;

  /**
   * Delete entity by ID
   */
  delete(id: K): Promise<void>;

  /**
   * Check if entity exists
   */
  exists(id: K): Promise<boolean>;
}

/**
 * Repository interface with additional query methods
 */
export interface IQueryRepository<T, K> extends IRepository<T, K> {
  /**
   * Find entities matching criteria
   */
  findBy(criteria: Partial<T>): Promise<T[]>;

  /**
   * Find entities with pagination
   */
  findMany(options: {
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
    where?: any;
  }): Promise<{
    data: T[];
    total: number;
    hasMore: boolean;
  }>;

  /**
   * Count entities matching criteria
   */
  count(criteria?: Partial<T>): Promise<number>;
}
