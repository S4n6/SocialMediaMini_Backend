import { Injectable } from '@nestjs/common';
import {
  PostEntity,
  PostPrivacy,
  PostStatus,
  ReactionType,
} from '../../../domain/entities/post.entity';
import { PostFactory } from '../../../domain/factories/post.factory';
import {
  PostPrivacy as PrismaPostPrivacy,
  PostStatus as PrismaPostStatus,
  MediaType as PrismaMediaType,
} from '../../../../../generated/prisma/enums';

/**
 * Mapper for converting between Prisma data models and Post domain entities.
 * Centralizes all mapping logic to avoid duplication across repositories.
 */
@Injectable()
export class PostMapper {
  constructor(private readonly postFactory: PostFactory) {}

  /**
   * Map a Prisma post record (with includes) to a PostEntity.
   */
  toDomainEntity(data: any): PostEntity {
    const row = this.asRecord(data);

    const hashtags = Array.isArray(row.hashtags)
      ? row.hashtags
          .map((h) => this.asRecord(h).hashtag)
          .map((hh) => this.safeString(this.asRecord(hh).name))
      : [];

    const media = Array.isArray(row.postMedia)
      ? row.postMedia.map((m) => {
          const rr = this.asRecord(m);
          return {
            id: this.safeString(rr.id),
            url: this.safeString(rr.url),
            type: this.safeString(rr.type) as 'image' | 'video',
            order: Number(rr.order) || 0,
          };
        })
      : [];

    const reactions = Array.isArray(row.reactions)
      ? row.reactions.map((r) => {
          const rr = this.asRecord(r);
          return {
            id: this.safeString(rr.id),
            userId: this.safeString(rr.reactorId),
            type: this.safeString(rr.type) as ReactionType,
            createdAt: this.safeDate(rr.createdAt),
          };
        })
      : [];

    const comments = Array.isArray(row.comments)
      ? row.comments.map((c) => {
          const rc = this.asRecord(c);
          return {
            id: this.safeString(rc.id),
            content: this.safeString(rc.content),
            authorId: this.safeString(rc.authorId),
            parentId: this.safeString(rc.parentId) || undefined,
            createdAt: this.safeDate(rc.createdAt),
            updatedAt: this.safeDate(rc.updatedAt),
          };
        })
      : [];

    return this.postFactory.reconstitute({
      id: this.safeString(row.id),
      content: this.safeString(row.content) || undefined,
      authorId: this.safeString(row.authorId),
      privacy: this.safeString(row.privacy) as PostPrivacy,
      status:
        (this.safeString(row.status) as PostStatus) || PostStatus.PUBLISHED,
      hashtags,
      media,
      reactions,
      comments,
      createdAt: this.safeDate(row.createdAt),
      updatedAt: this.safeDate(row.updatedAt),
    });
  }

  /**
   * Map a raw SQL result (snake_case columns) to a PostEntity.
   * Raw queries don't include relations, so media/reactions/comments are empty.
   */
  fromRawSql(rawPost: any): PostEntity {
    return this.postFactory.reconstitute({
      id: rawPost.id,
      content: rawPost.content || undefined,
      authorId: rawPost.author_id,
      privacy: rawPost.privacy as PostPrivacy,
      status: (rawPost.status as PostStatus) || PostStatus.PUBLISHED,
      hashtags: [],
      media: [],
      reactions: [],
      comments: [],
      createdAt: rawPost.created_at,
      updatedAt: rawPost.updated_at,
    });
  }

  /**
   * Convert a PostEntity to plain data suitable for Prisma create/update.
   */
  toPrismaData(post: PostEntity) {
    return {
      id: post.id,
      content: post.content,
      privacy: post.privacy as string as PrismaPostPrivacy,
      status: post.status as string as PrismaPostStatus,
      authorId: post.authorId,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }

  // ===== Private helpers =====

  private asRecord(v: unknown): Record<string, unknown> {
    return v && typeof v === 'object' ? (v as Record<string, unknown>) : {};
  }

  private safeString(v: unknown): string {
    if (v === null || v === undefined) return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    try {
      const json = JSON.stringify(v);
      return json === undefined ? Object.prototype.toString.call(v) : json;
    } catch {
      return Object.prototype.toString.call(v);
    }
  }

  private safeDate(v: unknown): Date {
    if (v instanceof Date) return v;
    const s = this.safeString(v);
    const d = new Date(s);
    return isNaN(d.getTime()) ? new Date() : d;
  }
}
