export interface PostService {
  exists(postId: string): Promise<boolean>;
  belongsToUser(postId: string, userId: string): Promise<boolean>;
}
