export interface ExternalUserService {
  findById(userId: string): Promise<{
    id: string;
    username: string;
    fullName: string;
    avatar: string | null;
    bio?: string | null;
  } | null>;

  exists(userId: string): Promise<boolean>;
}

export interface NotificationService {
  createFollowNotification(data: {
    followerId: string;
    followingId: string;
    followerUserName: string;
  }): Promise<void>;
}

export interface EventBus {
  publish(event: any): Promise<void>;
}
