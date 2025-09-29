import { Injectable } from '@nestjs/common';
import { CreatePostUseCase } from './use-cases/create-post.use-case';
import { UpdatePostUseCase } from './use-cases/update-post.use-case';
import { DeletePostUseCase } from './use-cases/delete-post.use-case';
import {
  GetPostByIdUseCase,
  GetPostsUseCase,
  GetUserFeedUseCase,
} from './use-cases/get-post.use-case';
import {
  AddReactionUseCase,
  RemoveReactionUseCase,
  ToggleReactionUseCase,
} from './use-cases/react-post.use-case';
import {
  AddCommentUseCase,
  UpdateCommentUseCase,
  DeleteCommentUseCase,
} from './use-cases/comment-post.use-case';
import {
  CreatePostDto,
  UpdatePostDto,
  GetPostsQueryDto,
  CreateReactionDto,
  CreateCommentDto,
  UpdateCommentDto,
  GetFeedDto,
  PostResponseDto,
  PostDetailResponseDto,
  PostListResponseDto,
  PostCommentResponseDto,
} from './dto/post.dto';

/**
 * Application Service for Post domain
 * Coordinates use cases and provides a clean interface for controllers
 */
@Injectable()
export class PostApplicationService {
  constructor(
    // Post management use cases
    private readonly createPostUseCase: CreatePostUseCase,
    private readonly updatePostUseCase: UpdatePostUseCase,
    private readonly deletePostUseCase: DeletePostUseCase,

    // Post retrieval use cases
    private readonly getPostByIdUseCase: GetPostByIdUseCase,
    private readonly getPostsUseCase: GetPostsUseCase,
    private readonly getUserFeedUseCase: GetUserFeedUseCase,

    // Reaction use cases
    private readonly addReactionUseCase: AddReactionUseCase,
    private readonly removeReactionUseCase: RemoveReactionUseCase,
    private readonly toggleReactionUseCase: ToggleReactionUseCase,

    // Comment use cases
    private readonly addCommentUseCase: AddCommentUseCase,
    private readonly updateCommentUseCase: UpdateCommentUseCase,
    private readonly deleteCommentUseCase: DeleteCommentUseCase,
  ) {}

  // ===== POST MANAGEMENT =====

  async createPost(
    authorId: string,
    dto: CreatePostDto,
  ): Promise<PostResponseDto> {
    const result = await this.createPostUseCase.execute(authorId, dto);
    return this.enrichPostResponse(result);
  }

  async updatePost(
    postId: string,
    userId: string,
    dto: UpdatePostDto,
  ): Promise<PostResponseDto> {
    const result = await this.updatePostUseCase.execute(postId, userId, dto);
    return this.enrichPostResponse(result);
  }

  async deletePost(
    postId: string,
    userId: string,
    userRole?: string,
  ): Promise<void> {
    return this.deletePostUseCase.execute(postId, userId, userRole);
  }

  // ===== POST RETRIEVAL =====

  async getPostById(
    postId: string,
    viewerId?: string,
    isFollowing?: boolean,
  ): Promise<PostDetailResponseDto> {
    const result = await this.getPostByIdUseCase.execute(
      postId,
      viewerId,
      isFollowing,
    );
    return this.enrichPostDetailResponse(result);
  }

  async getPosts(
    query: GetPostsQueryDto,
    viewerId?: string,
  ): Promise<PostListResponseDto> {
    const result = await this.getPostsUseCase.execute(query, viewerId);

    // Enrich each post with user information
    const enrichedPosts = await Promise.all(
      result.posts.map((post) => this.enrichPostResponse(post)),
    );

    return {
      ...result,
      posts: enrichedPosts,
    };
  }

  async getUserFeed(
    userId: string,
    dto: GetFeedDto,
  ): Promise<PostListResponseDto> {
    const result = await this.getUserFeedUseCase.execute(
      userId,
      dto.page || 1,
      dto.limit || 10,
    );

    // Enrich each post with user information
    const enrichedPosts = await Promise.all(
      result.posts.map((post) => this.enrichPostResponse(post)),
    );

    return {
      ...result,
      posts: enrichedPosts,
    };
  }

  // ===== REACTIONS =====

  async addReaction(
    postId: string,
    userId: string,
    dto: CreateReactionDto,
  ): Promise<void> {
    return this.addReactionUseCase.execute(postId, userId, dto);
  }

  async removeReaction(postId: string, userId: string): Promise<void> {
    return this.removeReactionUseCase.execute(postId, userId);
  }

  async toggleReaction(
    postId: string,
    userId: string,
    dto: CreateReactionDto,
  ): Promise<{
    action: 'added' | 'removed' | 'changed';
    reactionType?: string;
  }> {
    return this.toggleReactionUseCase.execute(postId, userId, dto);
  }

  // ===== COMMENTS =====

  async addComment(
    postId: string,
    authorId: string,
    dto: CreateCommentDto,
  ): Promise<PostCommentResponseDto> {
    const result = await this.addCommentUseCase.execute(postId, authorId, dto);
    return this.enrichCommentResponse(result);
  }

  async updateComment(
    postId: string,
    commentId: string,
    userId: string,
    dto: UpdateCommentDto,
  ): Promise<PostCommentResponseDto> {
    const result = await this.updateCommentUseCase.execute(
      postId,
      commentId,
      userId,
      dto,
    );
    return this.enrichCommentResponse(result);
  }

  async deleteComment(
    postId: string,
    commentId: string,
    userId: string,
    userRole?: string,
  ): Promise<void> {
    return this.deleteCommentUseCase.execute(
      postId,
      commentId,
      userId,
      userRole,
    );
  }

  // ===== PRIVATE HELPER METHODS =====

  /**
   * Enriches post response with additional user information
   * In a real implementation, this would fetch user data from UserApplicationService
   */
  private async enrichPostResponse(
    post: PostResponseDto,
  ): Promise<PostResponseDto> {
    // TODO: Integrate with UserApplicationService to fetch user details
    // For now, return the post as-is
    return {
      ...post,
      author: {
        ...post.author,
        fullName: 'User ' + post.author.id.substring(0, 8), // Placeholder
        username: '@user' + post.author.id.substring(0, 4), // Placeholder
      },
    };
  }

  /**
   * Enriches post detail response with additional user information
   */
  private async enrichPostDetailResponse(
    post: PostDetailResponseDto,
  ): Promise<PostDetailResponseDto> {
    // TODO: Integrate with UserApplicationService to fetch user details
    const enrichedComments = post.comments.map((comment) => ({
      ...comment,
      authorFullName: 'User ' + comment.authorId.substring(0, 8), // Placeholder
    }));

    const enrichedReactions = post.reactions.map((reaction) => ({
      ...reaction,
      userFullName: 'User ' + reaction.userId.substring(0, 8), // Placeholder
    }));

    return {
      ...post,
      author: {
        ...post.author,
        fullName: 'User ' + post.author.id.substring(0, 8), // Placeholder
        username: '@user' + post.author.id.substring(0, 4), // Placeholder
      },
      comments: enrichedComments,
      reactions: enrichedReactions,
    };
  }

  /**
   * Enriches comment response with additional user information
   */
  private async enrichCommentResponse(
    comment: PostCommentResponseDto,
  ): Promise<PostCommentResponseDto> {
    // TODO: Integrate with UserApplicationService to fetch user details
    return {
      ...comment,
      authorFullName: 'User ' + comment.authorId.substring(0, 8), // Placeholder
    };
  }
}
