export const WEBSOCKET_ROOMS = {
  // User specific rooms
  USER: (userId: string) => `user:${userId}`,
  USER_NOTIFICATIONS: (userId: string) => `user_notifications:${userId}`,

  // Messaging rooms
  CONVERSATION: (conversationId: string) => `conversation:${conversationId}`,
  PRIVATE_CHAT: (userId1: string, userId2: string) => {
    const sortedIds = [userId1, userId2].sort();
    return `private_chat:${sortedIds[0]}:${sortedIds[1]}`;
  },

  // Posts and feed rooms
  GLOBAL_FEED: 'global_feed',
  FOLLOWERS: (userId: string) => `followers:${userId}`,
  POST: (postId: string) => `post:${postId}`,

  // System rooms
  ONLINE_USERS: 'online_users',
  ADMIN: 'admin',
} as const;

export type WebSocketRoomType =
  | 'user'
  | 'conversation'
  | 'global'
  | 'followers'
  | 'post'
  | 'system';

export const ROOM_TYPES = {
  USER: 'user',
  CONVERSATION: 'conversation',
  GLOBAL: 'global',
  FOLLOWERS: 'followers',
  POST: 'post',
  SYSTEM: 'system',
} as const;
