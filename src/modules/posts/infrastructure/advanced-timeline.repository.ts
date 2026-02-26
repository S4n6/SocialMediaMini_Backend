import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { PostEntity, PostPrivacy } from '../domain/entities/post.entity';
import { ITimelineRepository } from '../domain/repositories/timeline.repository';
import { PostMapper } from './persistence/mappers/post.mapper';

/**
 * Advanced Timeline Algorithm
 * Implements intelligent feed ranking similar to Facebook/Instagram
 */
@Injectable()
export class AdvancedTimelineRepository implements ITimelineRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly postMapper: PostMapper,
  ) {}

  /**
   * Basic chronological timeline (required by interface)
   */
  async getTimelineFeed(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ posts: PostEntity[]; total: number }> {
    const offset = (page - 1) * limit;

    const posts = await this.prisma.post.findMany({
      where: {
        OR: [
          {
            authorId: userId,
            privacy: {
              in: ['PUBLIC', 'FOLLOWERS', 'PRIVATE'],
            },
          },
          {
            author: {
              followers: {
                some: {
                  followerId: userId,
                },
              },
            },
            authorId: { not: userId },
            privacy: {
              in: ['PUBLIC', 'FOLLOWERS'],
            },
          },
        ],
      },
      include: {
        author: true,
        reactions: { include: { reactor: true } },
        comments: { include: { author: true } },
        postMedia: { orderBy: { order: 'asc' } },
        hashtags: { include: { hashtag: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    });

    const totalCount = await this.prisma.post.count({
      where: {
        OR: [
          {
            authorId: userId,
            privacy: {
              in: ['PUBLIC', 'FOLLOWERS', 'PRIVATE'],
            },
          },
          {
            author: {
              followers: { some: { followerId: userId } },
            },
            authorId: { not: userId },
            privacy: { in: ['PUBLIC', 'FOLLOWERS'] },
          },
        ],
      },
    });

    return {
      posts: posts.map((post) => this.postMapper.toDomainEntity(post)),
      total: totalCount,
    };
  }

  /**
   * Smart Timeline Feed với ranking algorithm
   * Factors: recency, engagement, relationship strength, content type
   */
  async getSmartTimelineFeed(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ posts: PostEntity[]; total: number }> {
    const offset = (page - 1) * limit;

    // Calculate engagement boost window (last 24 hours)
    const recentThreshold = new Date();
    recentThreshold.setHours(recentThreshold.getHours() - 24);

    // Use raw SQL for complex ranking algorithm
    const rankedPosts = await this.prisma.$queryRaw`
      WITH timeline_posts AS (
        SELECT 
          p.*,
          u.full_name as author_name,
          u.avatar as author_avatar,
          
          -- Engagement Score (likes + comments + shares)
          COALESCE(reactions_count.count, 0) * 1.0 +
          COALESCE(comments_count.count, 0) * 2.0 +
          COALESCE(shares_count.count, 0) * 3.0 as engagement_score,
          
          -- Recency Score (higher for recent posts)
          CASE 
            WHEN p.created_at > ${recentThreshold} THEN 10.0
            WHEN p.created_at > NOW() - INTERVAL '3 days' THEN 5.0
            WHEN p.created_at > NOW() - INTERVAL '1 week' THEN 2.0
            ELSE 1.0
          END as recency_score,
          
          -- Relationship Score  
          CASE 
            WHEN p.author_id = ${userId} THEN 8.0  -- Own posts get moderate boost
            WHEN follow_rel.created_at > NOW() - INTERVAL '1 month' THEN 6.0 -- New follows
            WHEN interaction_score.score > 5 THEN 5.0 -- High interaction friends
            ELSE 3.0
          END as relationship_score,
          
          -- Content Type Score
          CASE 
            WHEN media_count.count > 0 THEN 4.0 -- Posts with media get boost
            WHEN LENGTH(p.content) > 200 THEN 3.0 -- Longer posts
            ELSE 2.0
          END as content_score
          
        FROM "Post" p
        INNER JOIN "User" u ON p.author_id = u.id
        
        -- Follow relationship
        LEFT JOIN "Follow" follow_rel ON (
          follow_rel.follower_id = ${userId} 
          AND follow_rel.following_id = p.author_id
        )
        
        -- Engagement counts
        LEFT JOIN (
          SELECT post_id, COUNT(*) as count 
          FROM "Reaction" 
          GROUP BY post_id
        ) reactions_count ON reactions_count.post_id = p.id
        
        LEFT JOIN (
          SELECT post_id, COUNT(*) as count 
          FROM "Comment" 
          GROUP BY post_id
        ) comments_count ON comments_count.post_id = p.id
        
        LEFT JOIN (
          SELECT post_id, COUNT(*) as count 
          FROM "Share" 
          GROUP BY post_id  
        ) shares_count ON shares_count.post_id = p.id
        
        -- Media count
        LEFT JOIN (
          SELECT post_id, COUNT(*) as count 
          FROM "PostMedia" 
          GROUP BY post_id
        ) media_count ON media_count.post_id = p.id
        
        -- User interaction history (for relationship scoring)
        LEFT JOIN (
          SELECT 
            target_user_id,
            COUNT(*) * 1.0 as score
          FROM (
            SELECT p2.author_id as target_user_id FROM "Reaction" r2 
            INNER JOIN "Post" p2 ON r2.post_id = p2.id 
            WHERE r2.reactor_id = ${userId}
            UNION ALL
            SELECT p3.author_id FROM "Comment" c2 
            INNER JOIN "Post" p3 ON c2.post_id = p3.id 
            WHERE c2.author_id = ${userId}
          ) interactions
          GROUP BY target_user_id
        ) interaction_score ON interaction_score.target_user_id = p.author_id
        
        WHERE (
          -- User's own posts
          p.author_id = ${userId} 
          OR 
          -- Followed users' posts
          (follow_rel.id IS NOT NULL AND p.privacy IN ('PUBLIC', 'FOLLOWERS'))
        )
        AND p.privacy IN ('PUBLIC', 'FOLLOWERS', 'PRIVATE')
      )
      
      SELECT *,
        -- Final Ranking Score
        (
          engagement_score * 0.3 +
          recency_score * 0.4 +  
          relationship_score * 0.2 +
          content_score * 0.1
        ) as final_score
        
      FROM timeline_posts
      ORDER BY final_score DESC, created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    // Get total count
    const totalCount = await this.prisma.post.count({
      where: {
        OR: [
          { authorId: userId },
          {
            author: {
              followers: { some: { followerId: userId } },
            },
            authorId: { not: userId },
            privacy: { in: ['PUBLIC', 'FOLLOWERS'] },
          },
        ],
      },
    });

    // Map raw results to entities
    const posts = (rankedPosts as any[]).map((rawPost: any) =>
      this.postMapper.fromRawSql(rawPost),
    );

    return { posts, total: totalCount };
  }

  /**
   * Diversified Timeline - Ensures variety in authors
   */
  async getDiversifiedTimelineFeed(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ posts: PostEntity[]; total: number }> {
    const offset = (page - 1) * limit;

    // Strategy: Limit consecutive posts from same author
    const posts = await this.prisma.$queryRaw`
      WITH ranked_posts AS (
        SELECT *,
          ROW_NUMBER() OVER (
            PARTITION BY author_id 
            ORDER BY created_at DESC
          ) as author_rank
        FROM "Post" p
        WHERE (
          p.author_id = ${userId} OR
          p.author_id IN (
            SELECT following_id FROM "Follow" 
            WHERE follower_id = ${userId}
          )
        )
        AND p.privacy IN ('PUBLIC', 'FOLLOWERS', 'PRIVATE')
      )
      
      SELECT * FROM ranked_posts
      WHERE author_rank <= 2  -- Max 2 consecutive posts per author per page
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const totalCount = await this.prisma.post.count({
      where: {
        OR: [
          { authorId: userId },
          {
            author: { followers: { some: { followerId: userId } } },
            authorId: { not: userId },
            privacy: { in: ['PUBLIC', 'FOLLOWERS'] },
          },
        ],
      },
    });

    return {
      posts: (posts as any[]).map((rawPost: any) =>
        this.postMapper.fromRawSql(rawPost),
      ),
      total: totalCount,
    };
  }
}
