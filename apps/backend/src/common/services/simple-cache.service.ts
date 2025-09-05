import { Injectable, Logger } from '@nestjs/common';

interface CacheEntry {
  data: unknown;
  expires: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

/**
 * Simple in-memory cache service for performance optimization
 * Tracer bullet implementation - can be swapped with Redis later
 */
@Injectable()
export class SimpleCacheService {
  private readonly logger = new Logger(SimpleCacheService.name);
  private readonly cache = new Map<string, CacheEntry>();
  private hits = 0;
  private misses = 0;

  /**
   * Get a value from cache
   * Returns null if key doesn't exist or has expired
   */
  public get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.misses++;
      this.logger.debug(`Cache MISS for key: ${key}`);
      return null;
    }
    
    // Check if expired
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      this.misses++;
      this.logger.debug(`Cache EXPIRED for key: ${key}`);
      return null;
    }
    
    this.hits++;
    this.logger.debug(`Cache HIT for key: ${key}`);
    return entry.data as T;
  }

  /**
   * Set a value in cache with optional TTL
   * @param key Cache key
   * @param data Data to cache
   * @param ttlSeconds Time to live in seconds (default: 300 = 5 minutes)
   */
  public set(key: string, data: unknown, ttlSeconds = 300): void {
    const expires = Date.now() + ttlSeconds * 1000;
    
    this.cache.set(key, { data, expires });
    this.logger.debug(`Cache SET for key: ${key}, TTL: ${ttlSeconds}s`);
    
    // Simple memory protection - if cache gets too large, clear old entries
    if (this.cache.size > 1000) {
      this.evictOldest();
    }
  }

  /**
   * Delete a specific key from cache
   */
  public delete(key: string): boolean {
    const result = this.cache.delete(key);
    if (result) {
      this.logger.debug(`Cache DELETE for key: ${key}`);
    }
    return result;
  }

  /**
   * Clear entire cache
   */
  public clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.logger.log(`Cache CLEARED - removed ${size} entries`);
  }

  /**
   * Clear all keys matching a pattern
   * @param pattern Pattern to match (e.g., 'asset:*')
   */
  public clearPattern(pattern: string): number {
    const regex = new RegExp(pattern.replace('*', '.*'));
    let cleared = 0;
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        cleared++;
      }
    }
    
    if (cleared > 0) {
      this.logger.debug(`Cache CLEARED ${cleared} keys matching pattern: ${pattern}`);
    }
    
    return cleared;
  }

  /**
   * Get cache statistics
   */
  public getStats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.cache.size,
      hitRate: total > 0 ? this.hits / total : 0,
    };
  }

  /**
   * Check if a key exists and is not expired
   */
  public has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Get cache size
   */
  public get size(): number {
    return this.cache.size;
  }

  /**
   * Evict oldest entries when cache is too large
   */
  private evictOldest(): void {
    // Simple strategy: remove first 100 entries (oldest in insertion order)
    const keysToRemove: string[] = [];
    let count = 0;
    
    for (const key of this.cache.keys()) {
      keysToRemove.push(key);
      count++;
      if (count >= 100) break;
    }
    
    for (const key of keysToRemove) {
      this.cache.delete(key);
    }
    
    this.logger.warn(`Cache eviction: removed ${keysToRemove.length} oldest entries`);
  }
}