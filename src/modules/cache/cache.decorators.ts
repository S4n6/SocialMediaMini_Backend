import { SetMetadata } from '@nestjs/common';
import { CacheConfig, CacheConfigName } from './cache.interfaces';

// Metadata keys for decorators
export const CACHEABLE_KEY = 'cacheable';
export const CACHE_EVICT_KEY = 'cache_evict';
export const CACHE_UPDATE_KEY = 'cache_update';
export const CACHE_WARM_KEY = 'cache_warm';

// Decorator metadata interfaces
export interface CacheableMetadata {
  keyTemplate: string;
  config: CacheConfig | CacheConfigName;
  condition?: string; // Optional condition function
}

export interface CacheEvictMetadata {
  keys: string[]; // Array of key patterns to evict
  allEntries?: boolean; // If true, clear all cache
  beforeInvocation?: boolean; // If true, evict before method execution
}

export interface CacheUpdateMetadata {
  keyTemplate: string;
  evictPatterns?: string[]; // Patterns to evict after update
  config: CacheConfig | CacheConfigName;
}

export interface CacheWarmMetadata {
  keyTemplate: string;
  config: CacheConfig | CacheConfigName;
}

// Cache key template interpolation utility
export function interpolateTemplate(
  template: string,
  args: any[],
  paramNames: string[],
): string {
  let result = template;

  // Replace parameter placeholders like {{id}}, {{userId}}
  paramNames.forEach((paramName, index) => {
    const placeholder = `{{${paramName}}}`;
    if (result.includes(placeholder) && args[index] !== undefined) {
      result = result.replace(
        new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'),
        String(args[index]),
      );
    }
  });

  // Replace numeric placeholders like {{0}}, {{1}}
  args.forEach((arg, index) => {
    const placeholder = `{{${index}}}`;
    if (result.includes(placeholder)) {
      result = result.replace(
        new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'),
        String(arg),
      );
    }
  });

  return result;
}

/**
 * Cacheable decorator - automatically caches method results
 * @param keyTemplate Template for cache key (e.g., "user:{{id}}" or "post:{{0}}")
 * @param config Cache configuration name or object
 * @param condition Optional condition to check before caching
 */
export function Cacheable(
  keyTemplate: string,
  config: CacheConfig | CacheConfigName,
  condition?: string,
) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor,
  ) {
    const metadata: CacheableMetadata = {
      keyTemplate,
      config,
      condition,
    };

    SetMetadata(CACHEABLE_KEY, metadata)(target, propertyName, descriptor);

    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // This will be handled by the interceptor
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * CacheEvict decorator - automatically removes cache entries
 * @param keys Array of key patterns to evict
 * @param allEntries If true, clear all cache entries
 * @param beforeInvocation If true, evict before method execution
 */
export function CacheEvict(
  keys: string[],
  allEntries: boolean = false,
  beforeInvocation: boolean = false,
) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor,
  ) {
    const metadata: CacheEvictMetadata = {
      keys,
      allEntries,
      beforeInvocation,
    };

    SetMetadata(CACHE_EVICT_KEY, metadata)(target, propertyName, descriptor);

    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // This will be handled by the interceptor
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * CacheUpdate decorator - caches result and evicts related entries
 * @param keyTemplate Template for cache key
 * @param evictPatterns Array of patterns to evict after update
 * @param config Cache configuration
 */
export function CacheUpdate(
  keyTemplate: string,
  evictPatterns: string[] = [],
  config: CacheConfig | CacheConfigName,
) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor,
  ) {
    const metadata: CacheUpdateMetadata = {
      keyTemplate,
      evictPatterns,
      config,
    };

    SetMetadata(CACHE_UPDATE_KEY, metadata)(target, propertyName, descriptor);

    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // This will be handled by the interceptor
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * CacheWarm decorator - preloads cache with method result
 * @param keyTemplate Template for cache key
 * @param config Cache configuration
 */
export function CacheWarm(
  keyTemplate: string,
  config: CacheConfig | CacheConfigName,
) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor,
  ) {
    const metadata: CacheWarmMetadata = {
      keyTemplate,
      config,
    };

    SetMetadata(CACHE_WARM_KEY, metadata)(target, propertyName, descriptor);

    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // This will be handled by the interceptor
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}
