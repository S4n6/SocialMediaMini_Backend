import { PostMediaType } from '../../../domain/post-media.entity';

export interface CreatePostMediasFromUrlsCommand {
  medias: {
    url: string;
    type: PostMediaType;
    order?: number;
    /** Raw S3 object key (e.g. "uploads/1708000000-photo.jpg"). Required for worker processing. */
    s3Key: string;
  }[];
  postId: string;
  userId: string;
  maxMediaPerPost?: number;
}
