import { Injectable, Inject } from '@nestjs/common';
import { IUserAdapter } from '../../domain/repositories/user.adapter';
import { PostResponseDto, PostDetailResponseDto } from '../dto/post.dto';

// Import token from posts module
const USER_ADAPTER_TOKEN = Symbol('IUserAdapter');

/**
 * Service responsible for enriching posts with user information
 * This follows Single Responsibility Principle
 */
@Injectable()
export class PostEnrichmentService {
  constructor(
    @Inject(USER_ADAPTER_TOKEN)
    private readonly userAdapter: IUserAdapter,
  ) {}

  /**
   * Enrich a single post with user information
   */
  async enrichPost(post: PostResponseDto): Promise<PostResponseDto> {
    const user = await this.userAdapter.getUserById(post.author.id);

    return {
      ...post,
      author: {
        ...post.author,
        fullName: user?.fullName || `User ${post.author.id.substring(0, 8)}`,
        username: user?.username || `@user${post.author.id.substring(0, 4)}`,
        avatar: user?.avatar,
      },
    };
  }

  /**
   * Enrich multiple posts with user information (batch operation)
   */
  async enrichPosts(posts: PostResponseDto[]): Promise<PostResponseDto[]> {
    // Get unique author IDs
    const authorIds = [...new Set(posts.map((post) => post.author.id))];

    // Batch fetch user information
    const users = await this.userAdapter.getUsersByIds(authorIds);
    const userMap = new Map(users.map((user) => [user.id, user]));

    // Enrich posts with user data
    return posts.map((post) => {
      const user = userMap.get(post.author.id);
      return {
        ...post,
        author: {
          ...post.author,
          fullName: user?.fullName || `User ${post.author.id.substring(0, 8)}`,
          username: user?.username || `@user${post.author.id.substring(0, 4)}`,
          avatar: user?.avatar,
        },
      };
    });
  }

  /**
   * Enrich detailed post with user information for comments and reactions
   */
  async enrichDetailedPost(
    post: PostDetailResponseDto,
  ): Promise<PostDetailResponseDto> {
    // Get all unique user IDs from post, comments, and reactions
    const userIds = new Set<string>();
    userIds.add(post.author.id);

    post.comments.forEach((comment) => userIds.add(comment.authorId));
    post.reactions.forEach((reaction) => userIds.add(reaction.userId));

    // Batch fetch user information
    const users = await this.userAdapter.getUsersByIds([...userIds]);
    const userMap = new Map(users.map((user) => [user.id, user]));

    // Enrich post author
    const postAuthor = userMap.get(post.author.id);

    // Enrich comments with author info
    const enrichedComments = post.comments.map((comment) => {
      const commentAuthor = userMap.get(comment.authorId);
      return {
        ...comment,
        authorFullName:
          commentAuthor?.fullName || `User ${comment.authorId.substring(0, 8)}`,
        authorAvatar: commentAuthor?.avatar,
      };
    });

    // Enrich reactions with user info
    const enrichedReactions = post.reactions.map((reaction) => {
      const reactionUser = userMap.get(reaction.userId);
      return {
        ...reaction,
        userFullName:
          reactionUser?.fullName || `User ${reaction.userId.substring(0, 8)}`,
        userAvatar: reactionUser?.avatar,
      };
    });

    return {
      ...post,
      author: {
        ...post.author,
        fullName:
          postAuthor?.fullName || `User ${post.author.id.substring(0, 8)}`,
        username:
          postAuthor?.username || `@user${post.author.id.substring(0, 4)}`,
        avatar: postAuthor?.avatar,
      },
      comments: enrichedComments,
      reactions: enrichedReactions,
    };
  }
}
