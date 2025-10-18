/**
 * Interface đơn giản cho cache configuration
 * Phù hợp cho fresher level
 */
export interface SimpleCacheConfig {
  /** Thời gian sống của cache tính bằng giây */
  ttl?: number;
  /** Prefix cho cache key để tránh conflict */
  prefix?: string;
}

/**
 * Các config cache thường dùng trong social media app
 */
export const CACHE_CONFIGS = {
  // Cache cho user profile - 30 phút
  USER_PROFILE: {
    ttl: 1800, // 30 minutes
    prefix: 'user:profile',
  } as SimpleCacheConfig,

  // Cache cho posts - 10 phút
  POST: {
    ttl: 600, // 10 minutes
    prefix: 'post',
  } as SimpleCacheConfig,

  // Cache cho feed - 5 phút (cần fresh data)
  USER_FEED: {
    ttl: 300, // 5 minutes
    prefix: 'user:feed',
  } as SimpleCacheConfig,

  // Cache cho search results - 10 phút
  SEARCH: {
    ttl: 600, // 10 minutes
    prefix: 'search',
  } as SimpleCacheConfig,

  // Cache cho notifications - 3 phút
  NOTIFICATIONS: {
    ttl: 180, // 3 minutes
    prefix: 'notifications',
  } as SimpleCacheConfig,
} as const;

/**
 * Type helper cho cache config names
 */
export type CacheConfigName = keyof typeof CACHE_CONFIGS;

/**
 * Helper function để generate cache key với prefix
 */
export function generateCacheKey(
  configName: CacheConfigName,
  identifier: string,
): string {
  const config = CACHE_CONFIGS[configName];
  return `${config.prefix}:${identifier}`;
}

/**
 * Helper function để lấy TTL từ config
 */
export function getCacheTTL(configName: CacheConfigName): number {
  return CACHE_CONFIGS[configName].ttl || 3600; // Default 1 hour
}
