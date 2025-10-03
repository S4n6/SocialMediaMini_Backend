import { Injectable } from '@nestjs/common';

// Cache configuration interfaces
export interface CacheConfig {
  ttl?: number; // Time to live in seconds
  prefix?: string; // Key prefix
  tags?: string[]; // Tags for invalidation
  serialize?: boolean; // Whether to serialize data
  compress?: boolean; // Whether to compress data
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalOperations: number;
  lastReset: Date;
}

export enum CacheEvent {
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',
  POST_CREATED = 'post.created',
  POST_UPDATED = 'post.updated',
  POST_DELETED = 'post.deleted',
  FOLLOW_CREATED = 'follow.created',
  FOLLOW_DELETED = 'follow.deleted',
}

// Predefined cache configurations for common use cases
export const DEFAULT_CACHE_CONFIGS = {
  USER_PROFILE: {
    ttl: 1800, // 30 minutes
    prefix: 'user:profile',
    tags: ['user'],
    serialize: true,
  } as CacheConfig,

  POST: {
    ttl: 600, // 10 minutes
    prefix: 'post',
    tags: ['post'],
    serialize: true,
  } as CacheConfig,

  USER_FEED: {
    ttl: 300, // 5 minutes
    prefix: 'user:feed',
    tags: ['user', 'feed'],
    serialize: true,
    compress: true, // Feeds can be large
  } as CacheConfig,

  POST_LIST: {
    ttl: 600, // 10 minutes
    prefix: 'post:list',
    tags: ['post', 'list'],
    serialize: true,
    compress: true,
  } as CacheConfig,

  USER_LIST: {
    ttl: 900, // 15 minutes
    prefix: 'user:list',
    tags: ['user', 'list'],
    serialize: true,
  } as CacheConfig,

  SEARCH_RESULTS: {
    ttl: 600, // 10 minutes
    prefix: 'search',
    tags: ['search'],
    serialize: true,
    compress: true,
  } as CacheConfig,

  AUTH_STATE: {
    ttl: 300, // 5 minutes
    prefix: 'auth:state',
    tags: ['auth'],
    serialize: true,
  } as CacheConfig,

  NOTIFICATION_LIST: {
    ttl: 180, // 3 minutes
    prefix: 'notifications',
    tags: ['notification'],
    serialize: true,
  } as CacheConfig,
} as const;

export type CacheConfigName = keyof typeof DEFAULT_CACHE_CONFIGS;
