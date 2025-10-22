import { PostEntity } from '../../domain/post.entity';

export interface ITimelineRepository {
  getTimelineFeed(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ posts: PostEntity[]; total: number }>;

  getSmartTimelineFeed?(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ posts: PostEntity[]; total: number }>;

  getDiversifiedTimelineFeed?(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ posts: PostEntity[]; total: number }>;
}

export const TIMELINE_REPOSITORY_TOKEN = Symbol('ITimelineRepository');
