// Cache Module - Fresher Version
// Export tất cả components cần thiết

export { RedisCacheModule } from './cache.module';
export { RedisCacheService } from './cache.service';
export { CacheUtils } from './cache.utils';
export {
  SimpleCacheConfig,
  CacheConfigName,
  CACHE_CONFIGS,
  generateCacheKey,
  getCacheTTL,
} from './cache.interfaces';

// Optional: Export example service để học cách sử dụng
export { CacheExampleService } from './cache-example.service';
