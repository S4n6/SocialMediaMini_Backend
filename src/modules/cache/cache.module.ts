import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { RedisCacheService } from './cache.service';
import { createKeyv } from '@keyv/redis';
import { CacheUtils } from './cache.utils';
import { REDIS } from '../../config/redis.config';

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        return {
          stores: [createKeyv(REDIS.URL)],
          // TTL mặc định: 1 giờ (3600 giây)
          ttl: 3600000, // milliseconds
        };
      },
    }),
  ],
  providers: [
    RedisCacheService,
    CacheUtils,
  ],
  exports: [RedisCacheService, CacheUtils],
})
export class RedisCacheModule {}
