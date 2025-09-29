import { PostEntity } from '../post.entity';

/**
 * Domain repository interface for Post aggregate
 * This interface defines the contract for post persistence operations
 */
export interface IPostDomainRepository {
  // Basic CRUD operations
  save(post: PostEntity): Promise<PostEntity>;
  findById(id: string): Promise<PostEntity | null>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;

  // Query operations
  findByAuthorId(
    authorId: string,
    page: number,
    limit: number,
  ): Promise<{
    posts: PostEntity[];
    total: number;
  }>;

  findAll(filters: {
    authorId?: string;
    privacy?: string;
    hashtag?: string;
    search?: string;
    page: number;
    limit: number;
    sortBy?: 'newest' | 'oldest' | 'most_liked' | 'most_commented';
  }): Promise<{
    posts: PostEntity[];
    total: number;
  }>;

  // Bulk operations
  findByIds(ids: string[]): Promise<PostEntity[]>;

  // Feed operations
  getUserFeed(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{
    posts: PostEntity[];
    total: number;
  }>;

  getTrendingPosts(
    page: number,
    limit: number,
  ): Promise<{
    posts: PostEntity[];
    total: number;
  }>;

  // Statistics
  getPostStats(postId: string): Promise<{
    likesCount: number;
    commentsCount: number;
  }>;
}
