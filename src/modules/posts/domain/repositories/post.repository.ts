import { PostEntity } from '../post.entity';

export const POST_REPOSITORY = Symbol('PostRepository');

export interface PostRepository {
  // Basic CRUD operations
  findById(id: string): Promise<PostEntity | null>;
  findByAuthorId(
    authorId: string,
    page?: number,
    limit?: number,
  ): Promise<{
    data: PostEntity[];
    total: number;
    hasMore: boolean;
  }>;
  save(PostEntity: PostEntity): Promise<PostEntity>;
  delete(id: string): Promise<void>;

  // Query operations
  findMany(options: {
    authorIds?: string[];
    privacy?: string[];
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'updatedAt';
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    data: PostEntity[];
    total: number;
    hasMore: boolean;
  }>;

  searchPosts(
    query: string,
    options: {
      page?: number;
      limit?: number;
      privacy?: string[];
    },
  ): Promise<{
    posts: PostEntity[];
    total: number;
    hasMore: boolean;
  }>;

  // Feed operations
  getFeedForUser(
    userId: string,
    options: {
      followingIds: string[];
      page?: number;
      limit?: number;
    },
  ): Promise<{
    posts: PostEntity[];
    total: number;
    hasMore: boolean;
  }>;

  getPublicFeed(options: { page?: number; limit?: number }): Promise<{
    posts: PostEntity[];
    total: number;
    hasMore: boolean;
  }>;

  // Analytics operations
  getPostsByDateRange(
    startDate: Date,
    endDate: Date,
    authorId?: string,
  ): Promise<PostEntity[]>;

  getMostPopularPosts(options: {
    timeframe?: 'day' | 'week' | 'month';
    limit?: number;
  }): Promise<PostEntity[]>;

  // Bulk operations
  findManyByIds(ids: string[]): Promise<PostEntity[]>;
  updateMany(posts: PostEntity[]): Promise<PostEntity[]>;
  deleteManyByAuthorId(authorId: string): Promise<number>;

  // Existence checks
  existsById(id: string): Promise<boolean>;
  countByAuthorId(authorId: string): Promise<number>;
}
