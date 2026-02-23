/**
 * Redis Caching Layer for CityOS Commerce
 * 
 * Provides caching for frequently accessed data:
 * - Product catalogs
 * - Vendor information
 * - Commission rules
 * - Store configurations
 */

import { Redis } from "ioredis"
import { appConfig } from "../../lib/config"
import { createLogger } from "../../lib/logger"
const logger = createLogger("lib:cache")

// Cache key prefixes for different entity types
export const CACHE_KEYS = {
  PRODUCT: "cityos:product:",
  VENDOR: "cityos:vendor:",
  STORE: "cityos:store:",
  TENANT: "cityos:tenant:",
  COMMISSION_RULE: "cityos:commission:",
  QUOTE: "cityos:quote:",
  PAYOUT: "cityos:payout:",
} as const

// Default TTL values (in seconds)
export const CACHE_TTL = {
  PRODUCT: 300, // 5 minutes
  VENDOR: 600, // 10 minutes
  STORE: 3600, // 1 hour
  TENANT: 3600, // 1 hour
  COMMISSION_RULE: 1800, // 30 minutes
  QUOTE: 300, // 5 minutes
  PAYOUT: 300, // 5 minutes
} as const

export interface CacheConfig {
  host: string
  port: number
  password?: string
  db?: number
  keyPrefix?: string
}

export class CityOSCache {
  private redis: Redis | null = null
  private enabled: boolean = false

  constructor(config?: CacheConfig) {
    if (config || appConfig.redis.isConfigured) {
      try {
        this.redis = config
          ? new Redis({
              host: config.host,
              port: config.port,
              password: config.password,
              db: config.db || 0,
              keyPrefix: config.keyPrefix || "cityos:",
            })
          : new Redis(appConfig.redis.url)

        this.enabled = true
        logger.info("[CityOS Cache] Redis cache initialized")
      } catch (error) {
        logger.warn("[CityOS Cache] Redis connection failed, caching disabled:", error)
        this.enabled = false
      }
    } else {
      logger.info("[CityOS Cache] No Redis config, caching disabled")
    }
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.enabled || !this.redis) return null

    try {
      const value = await this.redis.get(key)
      if (value) {
        return JSON.parse(value) as T
      }
      return null
    } catch (error) {
      logger.warn(`[CityOS Cache] Error getting ${key}:`, error)
      return null
    }
  }

  /**
   * Set a value in cache with optional TTL
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    if (!this.enabled || !this.redis) return

    try {
      const serialized = JSON.stringify(value)
      if (ttl) {
        await this.redis.setex(key, ttl, serialized)
      } else {
        await this.redis.set(key, serialized)
      }
    } catch (error) {
      logger.warn(`[CityOS Cache] Error setting ${key}:`, error)
    }
  }

  /**
   * Delete a value from cache
   */
  async del(key: string): Promise<void> {
    if (!this.enabled || !this.redis) return

    try {
      await this.redis.del(key)
    } catch (error) {
      logger.warn(`[CityOS Cache] Error deleting ${key}:`, error)
    }
  }

  /**
   * Delete all keys matching a pattern
   */
  async delPattern(pattern: string): Promise<void> {
    if (!this.enabled || !this.redis) return

    try {
      const keys = await this.redis.keys(pattern)
      if (keys.length > 0) {
        await this.redis.del(...keys)
      }
    } catch (error) {
      logger.warn(`[CityOS Cache] Error deleting pattern ${pattern}:`, error)
    }
  }

  /**
   * Get or set a value with automatic caching
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    // Fetch fresh data
    const fresh = await fetcher()

    // Cache the result
    await this.set(key, fresh, ttl)

    return fresh
  }

  /**
   * Invalidate product cache
   */
  async invalidateProduct(productId: string): Promise<void> {
    await this.del(`${CACHE_KEYS.PRODUCT}${productId}`)
    await this.delPattern(`${CACHE_KEYS.PRODUCT}list:*`)
  }

  /**
   * Invalidate vendor cache
   */
  async invalidateVendor(vendorId: string): Promise<void> {
    await this.del(`${CACHE_KEYS.VENDOR}${vendorId}`)
    await this.delPattern(`${CACHE_KEYS.VENDOR}list:*`)
  }

  /**
   * Invalidate store cache
   */
  async invalidateStore(storeId: string): Promise<void> {
    await this.del(`${CACHE_KEYS.STORE}${storeId}`)
    await this.delPattern(`${CACHE_KEYS.STORE}*`)
  }

  /**
   * Invalidate tenant cache
   */
  async invalidateTenant(tenantId: string): Promise<void> {
    await this.del(`${CACHE_KEYS.TENANT}${tenantId}`)
    await this.delPattern(`${CACHE_KEYS.TENANT}*`)
  }

  /**
   * Clear all CityOS cache
   */
  async clearAll(): Promise<void> {
    if (!this.enabled || !this.redis) return

    try {
      const keys = await this.redis.keys("cityos:*")
      if (keys.length > 0) {
        await this.redis.del(...keys)
      }
      logger.info(`[CityOS Cache] Cleared ${keys.length} keys`)
    } catch (error) {
      logger.warn("[CityOS Cache] Error clearing cache:", error)
    }
  }

  /**
   * Check if cache is healthy
   */
  async healthCheck(): Promise<boolean> {
    if (!this.enabled || !this.redis) return false

    try {
      await this.redis.ping()
      return true
    } catch {
      return false
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{ keys: number; memory: string } | null> {
    if (!this.enabled || !this.redis) return null

    try {
      const keys = await this.redis.keys("cityos:*")
      const info = await this.redis.info("memory")
      const memoryMatch = info.match(/used_memory_human:(\S+)/)
      return {
        keys: keys.length,
        memory: memoryMatch ? memoryMatch[1] : "unknown",
      }
    } catch {
      return null
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit()
      this.redis = null
      this.enabled = false
    }
  }
}

// Singleton instance
let cacheInstance: CityOSCache | null = null

export function getCache(): CityOSCache {
  if (!cacheInstance) {
    cacheInstance = new CityOSCache()
  }
  return cacheInstance
}

export function initCache(config?: CacheConfig): CityOSCache {
  cacheInstance = new CityOSCache(config)
  return cacheInstance
}
