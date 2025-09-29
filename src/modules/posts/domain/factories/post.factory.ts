import { Injectable } from '@nestjs/common';
import { PostEntity, PostPrivacy, ReactionType } from '../post.entity';
import { PostDomainService } from '../services/post-domain.service';

export interface CreatePostProps {
  content?: string;
  authorId: string;
  privacy?: PostPrivacy;
  media?: Array<{
    url: string;
    type: 'image' | 'video';
    order: number;
  }>;
  hashtags?: string[];
}

/**
 * Factory for creating Post entities
 * Encapsulates the complex logic of post creation
 */
@Injectable()
export class PostFactory {
  constructor(private readonly postDomainService: PostDomainService) {}

  /**
   * Creates a new post entity
   */
  createPost(props: CreatePostProps): PostEntity {
    // Auto-extract hashtags if not provided
    const hashtags =
      props.hashtags || this.postDomainService.extractHashtags(props.content);

    // Validate content before creation
    this.postDomainService.validatePostContent(
      props.content,
      props.media?.length || 0,
    );

    // Check for inappropriate content
    if (this.postDomainService.containsInappropriateContent(props.content)) {
      throw new Error('Content contains inappropriate material');
    }

    return new PostEntity({
      content: props.content,
      authorId: props.authorId,
      privacy: props.privacy || PostPrivacy.PUBLIC,
      hashtags,
      media:
        props.media?.map((m) => ({
          id: this.generateId(),
          url: m.url,
          type: m.type,
          order: m.order,
        })) || [],
      reactions: [],
      comments: [],
    });
  }

  /**
   * Recreates a post entity from stored data (for repository operations)
   */
  reconstitute(data: {
    id: string;
    content?: string;
    authorId: string;
    privacy: PostPrivacy;
    hashtags: string[];
    media: Array<{
      id: string;
      url: string;
      type: 'image' | 'video';
      order: number;
    }>;
    reactions: Array<{
      id: string;
      userId: string;
      type: ReactionType;
      createdAt: Date;
    }>;
    comments: Array<{
      id: string;
      content: string;
      authorId: string;
      parentId?: string;
      createdAt: Date;
      updatedAt: Date;
    }>;
    createdAt: Date;
    updatedAt: Date;
  }): PostEntity {
    return new PostEntity({
      id: data.id,
      content: data.content,
      authorId: data.authorId,
      privacy: data.privacy,
      hashtags: data.hashtags,
      media: data.media,
      reactions: data.reactions,
      comments: data.comments,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  /**
   * Creates a post from external data source (e.g., social media import)
   */
  createFromImport(importData: {
    externalId: string;
    content?: string;
    authorId: string;
    originalCreatedAt: Date;
    mediaUrls?: string[];
  }): PostEntity {
    const media =
      importData.mediaUrls?.map((url, index) => ({
        id: this.generateId(),
        url,
        type: this.detectMediaType(url),
        order: index,
      })) || [];

    return new PostEntity({
      content: importData.content,
      authorId: importData.authorId,
      privacy: PostPrivacy.PUBLIC, // Default for imports
      hashtags: this.postDomainService.extractHashtags(importData.content),
      media,
      reactions: [],
      comments: [],
      createdAt: importData.originalCreatedAt,
      updatedAt: importData.originalCreatedAt,
    });
  }

  /**
   * Creates a draft post (for saving incomplete posts)
   */
  createDraft(
    props: Partial<CreatePostProps> & { authorId: string },
  ): PostEntity {
    return new PostEntity({
      content: props.content || '',
      authorId: props.authorId,
      privacy: props.privacy || PostPrivacy.PRIVATE, // Drafts are private by default
      hashtags: props.hashtags || [],
      media:
        props.media?.map((m) => ({
          id: this.generateId(),
          url: m.url,
          type: m.type,
          order: m.order,
        })) || [],
      reactions: [],
      comments: [],
    });
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  private detectMediaType(url: string): 'image' | 'video' {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.webm'];

    const lowerUrl = url.toLowerCase();

    if (imageExtensions.some((ext) => lowerUrl.includes(ext))) {
      return 'image';
    }

    if (videoExtensions.some((ext) => lowerUrl.includes(ext))) {
      return 'video';
    }

    // Default to image if can't determine
    return 'image';
  }
}
