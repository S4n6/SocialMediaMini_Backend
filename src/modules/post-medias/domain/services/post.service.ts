export interface PostService {
  exists(postId: string): Promise<boolean>;
  belongsToUser(postId: string, userId: string): Promise<boolean>;
  getOwnerUserId(postId: string): Promise<string | null>;
}
