/**
 * Dependency Injection Tokens for Posts Module
 */

// Repository Interface Tokens
export const POST_REPOSITORY_TOKEN = 'POST_REPOSITORY';
export const TIMELINE_REPOSITORY_TOKEN = 'TIMELINE_REPOSITORY';

// Adapter/Port Interface Tokens
export const USER_ADAPTER_TOKEN = 'USER_ADAPTER';

// Redis Feed (Fan-out on Write)
export const FEED_REDIS_CLIENT_TOKEN = 'FEED_REDIS_CLIENT';
export const FEED_CACHE_PORT_TOKEN = 'FEED_CACHE_PORT';
