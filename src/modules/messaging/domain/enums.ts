export enum ConversationType {
  PRIVATE = 'private',
  GROUP = 'group',
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  SYSTEM = 'system',
  LOCATION = 'location',
  CONTACT = 'contact',
  STICKER = 'sticker',
  GIF = 'gif',
}

export enum MessageStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

export enum AttachmentType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  OTHER = 'other',
}

export enum ConversationEvent {
  MESSAGE_SENT = 'message_sent',
  MESSAGE_DELIVERED = 'message_delivered',
  MESSAGE_READ = 'message_read',
  MESSAGE_EDITED = 'message_edited',
  MESSAGE_DELETED = 'message_deleted',
  MESSAGE_REACTION_ADDED = 'message_reaction_added',
  MESSAGE_REACTION_REMOVED = 'message_reaction_removed',
  USER_JOINED = 'user_joined',
  USER_LEFT = 'user_left',
  USER_TYPING = 'user_typing',
  USER_STOPPED_TYPING = 'user_stopped_typing',
  CONVERSATION_CREATED = 'conversation_created',
  CONVERSATION_UPDATED = 'conversation_updated',
  CONVERSATION_DELETED = 'conversation_deleted',
}

export enum MessageEvent {
  CREATED = 'message_created',
  UPDATED = 'message_updated',
  DELETED = 'message_deleted',
  DELIVERED = 'message_delivered',
  READ = 'message_read',
  REACTION_ADDED = 'message_reaction_added',
  REACTION_REMOVED = 'message_reaction_removed',
}

export enum ParticipantRole {
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  MEMBER = 'member',
  GUEST = 'guest',
}

export enum ConversationStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  DELETED = 'deleted',
  MUTED = 'muted',
}
