export const WEBSOCKET_EVENTS = {
  // Core events
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  AUTHENTICATE: 'authenticate',

  // Module events namespace
  NOTIFICATION: {
    NEW_NOTIFICATION: 'notification:new',
    MARK_READ: 'notification:mark_read',
    MARK_ALL_READ: 'notification:mark_all_read',
    SUBSCRIBE: 'notification:subscribe',
    UNSUBSCRIBE: 'notification:unsubscribe',
  },

  MESSAGING: {
    NEW_MESSAGE: 'messaging:new_message',
    TYPING_START: 'messaging:typing_start',
    TYPING_STOP: 'messaging:typing_stop',
    MESSAGE_READ: 'messaging:message_read',
    MESSAGE_DELIVERED: 'messaging:message_delivered',
    JOIN_CONVERSATION: 'messaging:join_conversation',
    LEAVE_CONVERSATION: 'messaging:leave_conversation',
    CONVERSATION_UPDATED: 'messaging:conversation_updated',
  },

  POSTS: {
    // Subscription events
    SUBSCRIBE_POST: 'posts:subscribe',
    UNSUBSCRIBE_POST: 'posts:unsubscribe',
    SUBSCRIBE_FEED: 'posts:subscribe_feed',
    UNSUBSCRIBE_FEED: 'posts:unsubscribe_feed',

    // Real-time updates
    NEW_POST: 'posts:new_post',
    POST_UPDATED: 'posts:post_updated',
    POST_DELETED: 'posts:post_deleted',

    // Reactions
    REACT_POST: 'posts:react',
    UNREACT_POST: 'posts:unreact',
    POST_REACTION_UPDATE: 'posts:reaction_update',

    // Comments
    ADD_COMMENT: 'posts:add_comment',
    UPDATE_COMMENT: 'posts:update_comment',
    DELETE_COMMENT: 'posts:delete_comment',
    NEW_COMMENT: 'posts:new_comment',
    COMMENT_UPDATED: 'posts:comment_updated',
    COMMENT_DELETED: 'posts:comment_deleted',

    // Feed updates
    FEED_UPDATE: 'posts:feed_update',
    POST_ANALYTICS: 'posts:analytics',
  },
} as const;

export type WebSocketEventType = typeof WEBSOCKET_EVENTS;
export type WebSocketEvent = WebSocketEventType[keyof WebSocketEventType];
