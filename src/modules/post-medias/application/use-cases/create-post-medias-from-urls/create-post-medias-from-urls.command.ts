import { PostMediaType } from '../../../domain/post-media.entity';

export interface CreatePostMediasFromUrlsCommand {
  medias: {
    url: string;
    type: PostMediaType;
    order?: number;
  }[];
  postId: string;
  userId: string;
  maxMediaPerPost?: number;
}
