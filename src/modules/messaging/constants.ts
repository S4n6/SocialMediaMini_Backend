// Dependency Injection Tokens
export const MESSAGING_TOKENS = {
  // Repository Tokens
  CONVERSATION_REPOSITORY: 'CONVERSATION_REPOSITORY',
  MESSAGE_REPOSITORY: 'MESSAGE_REPOSITORY',
  MESSAGING_UNIT_OF_WORK: 'MESSAGING_UNIT_OF_WORK',

  // Domain Service Tokens
  CONVERSATION_DOMAIN_SERVICE: 'CONVERSATION_DOMAIN_SERVICE',
  MESSAGE_DOMAIN_SERVICE: 'MESSAGE_DOMAIN_SERVICE',
  MESSAGING_VALIDATION_SERVICE: 'MESSAGING_VALIDATION_SERVICE',

  // Application Service Tokens
  MESSAGING_APPLICATION_SERVICE: 'MESSAGING_APPLICATION_SERVICE',
  CONVERSATION_ENRICHMENT_SERVICE: 'CONVERSATION_ENRICHMENT_SERVICE',
  MESSAGE_ENRICHMENT_SERVICE: 'MESSAGE_ENRICHMENT_SERVICE',

  // Use Case Tokens
  CONVERSATION_USE_CASES: 'CONVERSATION_USE_CASES',
  MESSAGE_USE_CASES: 'MESSAGE_USE_CASES',
} as const;

// Business Constants
export const MESSAGING_CONSTANTS = {
  // Message Limits
  MAX_MESSAGE_LENGTH: 4000,
  MIN_MESSAGE_LENGTH: 1,
  MAX_ATTACHMENT_SIZE_MB: 50,
  MAX_ATTACHMENTS_PER_MESSAGE: 10,

  // Conversation Limits
  MAX_CONVERSATION_PARTICIPANTS: 100,
  MIN_CONVERSATION_PARTICIPANTS: 2,
  MAX_CONVERSATION_TITLE_LENGTH: 255,

  // Time Limits
  MESSAGE_EDIT_TIME_LIMIT_HOURS: 24,
  MESSAGE_DELETE_TIME_LIMIT_HOURS: 48,

  // Pagination
  DEFAULT_MESSAGE_PAGE_SIZE: 50,
  MAX_MESSAGE_PAGE_SIZE: 100,

  // Reactions
  MAX_REACTIONS_PER_MESSAGE: 20,
  MAX_REACTIONS_PER_USER_PER_MESSAGE: 5,

  // Content Types
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  SUPPORTED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/mov'],
  SUPPORTED_AUDIO_TYPES: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
  SUPPORTED_DOCUMENT_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ],
} as const;

// Event Names
export const MESSAGING_EVENTS = {
  // Message Events
  MESSAGE_SENT: 'message.sent',
  MESSAGE_DELIVERED: 'message.delivered',
  MESSAGE_READ: 'message.read',
  MESSAGE_EDITED: 'message.edited',
  MESSAGE_DELETED: 'message.deleted',
  MESSAGE_REACTION_ADDED: 'message.reaction.added',
  MESSAGE_REACTION_REMOVED: 'message.reaction.removed',

  // Conversation Events
  CONVERSATION_CREATED: 'conversation.created',
  CONVERSATION_UPDATED: 'conversation.updated',
  CONVERSATION_PARTICIPANT_JOINED: 'conversation.participant.joined',
  CONVERSATION_PARTICIPANT_LEFT: 'conversation.participant.left',
  CONVERSATION_PARTICIPANT_ROLE_CHANGED:
    'conversation.participant.role.changed',
} as const;

// Error Messages
export const MESSAGING_ERRORS = {
  // Conversation Errors
  CONVERSATION_NOT_FOUND: 'Conversation not found',
  CONVERSATION_ACCESS_DENIED: 'Access to conversation denied',
  CONVERSATION_PARTICIPANT_LIMIT_EXCEEDED:
    'Maximum number of participants exceeded',
  CONVERSATION_TITLE_TOO_LONG: 'Conversation title too long',

  // Message Errors
  MESSAGE_NOT_FOUND: 'Message not found',
  MESSAGE_CONTENT_TOO_LONG: 'Message content too long',
  MESSAGE_CONTENT_EMPTY: 'Message content cannot be empty',
  MESSAGE_EDIT_TIME_EXPIRED: 'Message can no longer be edited',
  MESSAGE_DELETE_TIME_EXPIRED: 'Message can no longer be deleted',
  MESSAGE_EDIT_PERMISSION_DENIED:
    'You do not have permission to edit this message',
  MESSAGE_DELETE_PERMISSION_DENIED:
    'You do not have permission to delete this message',

  // Attachment Errors
  ATTACHMENT_TOO_LARGE: 'Attachment size exceeds limit',
  ATTACHMENT_TYPE_NOT_SUPPORTED: 'Attachment type not supported',
  ATTACHMENT_REQUIRED: 'Attachment is required for this message type',

  // Reaction Errors
  REACTION_LIMIT_EXCEEDED: 'Maximum number of reactions exceeded',
  REACTION_EMOJI_INVALID: 'Invalid emoji for reaction',

  // System Errors
  SYSTEM_MESSAGE_CANNOT_BE_EDITED: 'System messages cannot be edited',
  SYSTEM_MESSAGE_CANNOT_BE_DELETED: 'System messages cannot be deleted',
} as const;
