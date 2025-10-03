import { PostMediaEntity } from '../post-media.entity';

export interface PostMediaRepository {
  /**
   * Save a post media entity
   */
  save(postMedia: PostMediaEntity): Promise<PostMediaEntity>;

  /**
   * Save multiple post media entities
   */
  saveMany(postMedias: PostMediaEntity[]): Promise<PostMediaEntity[]>;

  /**
   * Find post media by ID
   */
  findById(id: string): Promise<PostMediaEntity | null>;

  /**
   * Find all post medias for a specific post
   */
  findByPostId(postId: string): Promise<PostMediaEntity[]>;

  /**
   * Find post medias with pagination
   */
  findWithPagination(
    page: number,
    limit: number,
  ): Promise<{
    items: PostMediaEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;

  /**
   * Delete post media by ID
   */
  deleteById(id: string): Promise<void>;

  /**
   * Delete all post medias for a specific post
   */
  deleteByPostId(postId: string): Promise<void>;

  /**
   * Check if post media exists
   */
  exists(id: string): Promise<boolean>;

  /**
   * Count post medias for a specific post
   */
  countByPostId(postId: string): Promise<number>;

  /**
   * Update post media order for a specific post
   */
  updateOrdersByPostId(
    postId: string,
    orders: Array<{ id: string; order: number }>,
  ): Promise<void>;

  /**
   * Find post medias by URLs (useful for duplicate checking)
   */
  findByUrls(urls: string[]): Promise<PostMediaEntity[]>;
}
