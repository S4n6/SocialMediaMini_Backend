import { PostEntity } from '../../domain/entities/post.entity';
import { PostResponseDto, PostDetailResponseDto } from '../dto/post.dto';

/**
 * Shared mapping utility for converting PostEntity to response DTOs.
 * Eliminates duplication across use cases.
 */
export function mapPostToResponseDto(post: PostEntity): PostResponseDto {
  return {
    id: post.id,
    content: post.content,
    privacy: post.privacy,
    status: post.status,
    author: {
      id: post.authorId,
      fullName: '', // Populated by PostEnrichmentService
      username: '',
      avatar: undefined,
    },
    media: post.media.map((m) => ({
      id: m.id,
      url: m.url,
      type: m.type,
      order: m.order,
    })),
    hashtags: post.hashtags,
    likesCount: post.reactions.length,
    commentsCount: post.comments.length,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  };
}

export function mapPostToDetailResponseDto(
  post: PostEntity,
): PostDetailResponseDto {
  return {
    ...mapPostToResponseDto(post),
    comments: post.comments.map((c) => ({
      id: c.id,
      content: c.content,
      authorId: c.authorId,
      authorFullName: '',
      authorAvatar: undefined,
      parentId: c.parentId,
      repliesCount: 0,
      likesCount: 0,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    })),
    reactions: post.reactions.map((r) => ({
      id: r.id,
      type: r.type,
      userId: r.userId,
      userFullName: '',
      userAvatar: undefined,
      createdAt: r.createdAt,
    })),
  };
}
