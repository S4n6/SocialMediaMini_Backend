import { PostEntity } from '../../domain/post.entity';

/**
 * Repository interface for Post aggregate
 * This interface defines the contract for post persistence operations
 * Used by application layer to abstract data access
 */
export interface IPostRepository {
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

  findByHashtag(
    hashtag: string,
    page: number,
    limit: number,
  ): Promise<{
    posts: PostEntity[];
    total: number;
  }>;

  // Bulk operations
  findByIds(ids: string[]): Promise<PostEntity[]>;

  // Feed operations
  getTimelineFeed(
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
    sharesCount: number;
  }>;

  // Reactions
  // Reactions are handled by the reactions module via a dedicated repository

  // Comments
  // Comments are handled by the comments module via a dedicated repository

  // Search operations
  searchPosts(
    query: string,
    filters: {
      authorId?: string;
      hashtag?: string;
      privacy?: string;
      dateFrom?: Date;
      dateTo?: Date;
    },
    page: number,
    limit: number,
  ): Promise<{
    posts: PostEntity[];
    total: number;
  }>;
}
