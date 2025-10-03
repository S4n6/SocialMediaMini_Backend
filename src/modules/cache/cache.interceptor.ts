import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { RedisCacheService } from './cache.service';
import {
  CACHEABLE_KEY,
  CACHE_EVICT_KEY,
  CACHE_UPDATE_KEY,
  CACHE_WARM_KEY,
  CacheableMetadata,
  CacheEvictMetadata,
  CacheUpdateMetadata,
  CacheWarmMetadata,
  interpolateTemplate,
} from './cache.decorators';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly cacheService: RedisCacheService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const handler = context.getHandler();
    const target = context.getClass();

    // Get method parameter names for template interpolation
    const paramNames = this.getParameterNames(handler);
    const args = context.getArgs();

    // Check for cache decorators
    const cacheableMetadata = this.reflector.get<CacheableMetadata>(
      CACHEABLE_KEY,
      handler,
    );
    const cacheEvictMetadata = this.reflector.get<CacheEvictMetadata>(
      CACHE_EVICT_KEY,
      handler,
    );
    const cacheUpdateMetadata = this.reflector.get<CacheUpdateMetadata>(
      CACHE_UPDATE_KEY,
      handler,
    );
    const cacheWarmMetadata = this.reflector.get<CacheWarmMetadata>(
      CACHE_WARM_KEY,
      handler,
    );

    // Handle cache eviction before method execution
    if (cacheEvictMetadata?.beforeInvocation) {
      await this.handleCacheEviction(cacheEvictMetadata, args, paramNames);
    }

    // Handle cacheable operations
    if (cacheableMetadata) {
      return this.handleCacheable(cacheableMetadata, args, paramNames, next);
    }

    // Execute the method
    const result = next.handle();

    return result.pipe(
      tap(async (methodResult) => {
        // Handle cache operations after method execution

        // Cache eviction after execution
        if (cacheEvictMetadata && !cacheEvictMetadata.beforeInvocation) {
          await this.handleCacheEviction(cacheEvictMetadata, args, paramNames);
        }

        // Cache update operations
        if (cacheUpdateMetadata) {
          await this.handleCacheUpdate(
            cacheUpdateMetadata,
            args,
            paramNames,
            methodResult,
          );
        }

        // Cache warm operations
        if (cacheWarmMetadata) {
          await this.handleCacheWarm(
            cacheWarmMetadata,
            args,
            paramNames,
            methodResult,
          );
        }
      }),
    );
  }

  private async handleCacheable(
    metadata: CacheableMetadata,
    args: any[],
    paramNames: string[],
    next: CallHandler,
  ): Promise<Observable<any>> {
    try {
      const cacheKey = interpolateTemplate(
        metadata.keyTemplate,
        args,
        paramNames,
      );

      // Try to get from cache first
      const cachedResult = await this.cacheService.get(
        cacheKey,
        metadata.config,
      );

      if (cachedResult !== null) {
        this.logger.debug(`Cache hit for key: ${cacheKey}`);
        return of(cachedResult);
      }

      // Cache miss - execute method and cache result
      this.logger.debug(`Cache miss for key: ${cacheKey}`);

      return next.handle().pipe(
        tap(async (result) => {
          if (result !== null && result !== undefined) {
            await this.cacheService.set(cacheKey, result, metadata.config);
            this.logger.debug(`Cached result for key: ${cacheKey}`);
          }
        }),
      );
    } catch (error) {
      this.logger.error('Error in cacheable operation', error);
      return next.handle();
    }
  }

  private async handleCacheEviction(
    metadata: CacheEvictMetadata,
    args: any[],
    paramNames: string[],
  ): Promise<void> {
    try {
      if (metadata.allEntries) {
        await this.cacheService.clear();
        this.logger.debug('Cleared all cache entries');
        return;
      }

      for (const keyPattern of metadata.keys) {
        const resolvedPattern = interpolateTemplate(
          keyPattern,
          args,
          paramNames,
        );

        if (resolvedPattern.includes('*')) {
          // Pattern-based eviction
          await this.cacheService.invalidateByPattern(resolvedPattern);
          this.logger.debug(`Evicted cache pattern: ${resolvedPattern}`);
        } else {
          // Single key eviction
          await this.cacheService.del(resolvedPattern);
          this.logger.debug(`Evicted cache key: ${resolvedPattern}`);
        }
      }
    } catch (error) {
      this.logger.error('Error in cache eviction', error);
    }
  }

  private async handleCacheUpdate(
    metadata: CacheUpdateMetadata,
    args: any[],
    paramNames: string[],
    result: any,
  ): Promise<void> {
    try {
      // Cache the updated result
      const cacheKey = interpolateTemplate(
        metadata.keyTemplate,
        args,
        paramNames,
      );
      await this.cacheService.set(cacheKey, result, metadata.config);
      this.logger.debug(`Updated cache for key: ${cacheKey}`);

      // Evict related cache entries
      if (metadata.evictPatterns) {
        for (const pattern of metadata.evictPatterns) {
          const resolvedPattern = interpolateTemplate(
            pattern,
            args,
            paramNames,
          );
          await this.cacheService.invalidateByPattern(resolvedPattern);
          this.logger.debug(
            `Evicted related cache pattern: ${resolvedPattern}`,
          );
        }
      }
    } catch (error) {
      this.logger.error('Error in cache update', error);
    }
  }

  private async handleCacheWarm(
    metadata: CacheWarmMetadata,
    args: any[],
    paramNames: string[],
    result: any,
  ): Promise<void> {
    try {
      const cacheKey = interpolateTemplate(
        metadata.keyTemplate,
        args,
        paramNames,
      );
      await this.cacheService.set(cacheKey, result, metadata.config);
      this.logger.debug(`Warmed cache for key: ${cacheKey}`);
    } catch (error) {
      this.logger.error('Error in cache warming', error);
    }
  }

  private getParameterNames(func: Function): string[] {
    // Extract parameter names from function signature
    const funcStr = func.toString();
    const match = funcStr.match(/\(([^)]*)\)/);

    if (!match || !match[1].trim()) {
      return [];
    }

    return match[1]
      .split(',')
      .map((param) => param.trim().split(/[\s=]/)[0])
      .filter((name) => name && !name.startsWith('...'));
  }
}
