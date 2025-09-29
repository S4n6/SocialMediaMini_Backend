import { PostEntity } from '../../domain/post.entity';
import {
  GetPostsQueryDto,
  PostListResponseDto,
  PostResponseDto,
} from '../dto/post.dto';

export interface IPostRepository {
  // Create & Update
  save(post: PostEntity): Promise<PostEntity>;

  // Read operations
  findById(id: string): Promise<PostEntity | null>;
  findByAuthorId(
    authorId: string,
    page: number,
    limit: number,
  ): Promise<{
    posts: PostEntity[];
    total: number;
  }>;
  findAll(query: GetPostsQueryDto): Promise<{
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

  // Delete
  delete(id: string): Promise<void>;

  // Reactions
  addReaction(
    postId: string,
    userId: string,
    reactionType: string,
  ): Promise<void>;
  removeReaction(postId: string, userId: string): Promise<void>;
  getUserReaction(postId: string, userId: string): Promise<string | null>;

  // Comments
  addComment(
    postId: string,
    commentId: string,
    content: string,
    authorId: string,
    parentId?: string,
  ): Promise<void>;
  removeComment(postId: string, commentId: string): Promise<void>;
  updateComment(commentId: string, content: string): Promise<void>;

  // Statistics
  getPostStats(postId: string): Promise<{
    likesCount: number;
    commentsCount: number;
    sharesCount: number;
  }>;

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

  // Existence checks
  exists(id: string): Promise<boolean>;

  // Bulk operations
  findByIds(ids: string[]): Promise<PostEntity[]>;
}
