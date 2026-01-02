export const WEBSOCKET_CONFIG = {
  // Connection settings
  MAX_CONNECTIONS_PER_USER: 5,
  CONNECTION_TIMEOUT: 30000, // 30 seconds
  HEARTBEAT_INTERVAL: 25000, // 25 seconds

  // Room settings
  MAX_ROOM_SIZE: 1000,
  ROOM_CLEANUP_INTERVAL: 60000, // 1 minute

  // Rate limiting
  MAX_EVENTS_PER_MINUTE: 60,
  MAX_EVENTS_PER_SECOND: 10,

  // Message size limits
  MAX_PAYLOAD_SIZE: 1024 * 1024, // 1MB
  MAX_EVENT_NAME_LENGTH: 100,

  // Cleanup settings
  INACTIVE_CONNECTION_CLEANUP_INTERVAL: 5 * 60 * 1000, // 5 minutes
  MAX_CONNECTION_IDLE_TIME: 30 * 60 * 1000, // 30 minutes

  // Redis settings
  REDIS_KEY_PREFIX: 'websocket:',
  REDIS_CONNECTION_TTL: 24 * 60 * 60, // 24 hours in seconds
} as const;

export const WEBSOCKET_NAMESPACES = {
  DEFAULT: '/',
  ADMIN: '/admin',
  API: '/api',
} as const;
