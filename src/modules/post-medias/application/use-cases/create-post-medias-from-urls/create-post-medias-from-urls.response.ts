import { PostMediaEntity } from '../../../domain/post-media.entity';

export interface CreatePostMediasFromUrlsResponse {
  medias: PostMediaEntity[];
  totalCreated: number;
}
