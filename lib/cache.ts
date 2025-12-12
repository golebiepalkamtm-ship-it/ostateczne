import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from './redis';
import { debug } from './logger';

// Prosty in-memory cache (fallback dla Redis)
interface CacheEntry<T> {
  data: T;
  expires: number;
  createdAt: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private maxSize = 1000; // Maksymalna liczba wpisów

  set<T>(key: string, data: T, ttlSeconds: number = 300): void {
    // Wyczyść cache jeśli jest za duży
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }

    const expires = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, {
      data,
      expires,
      createdAt: Date.now(),
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    const entriesToDelete: string[] = [];

    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (now > entry.expires) {
        entriesToDelete.push(key);
      }
    }

    entriesToDelete.forEach(key => this.cache.delete(key));

    // Jeśli nadal za dużo, usuń najstarsze
    if (this.cache.size >= this.maxSize) {
      const sortedEntries = Array.from(this.cache.entries()).sort(
        (a, b) => a[1].createdAt - b[1].createdAt,
      );

      const toDelete = sortedEntries.slice(0, Math.floor(this.maxSize * 0.2));
      toDelete.forEach(([key]) => this.cache.delete(key));
    }
  }

  // Statystyki cache
  getStats() {
    const now = Date.now();
    let expired = 0;
    let active = 0;

    for (const entry of Array.from(this.cache.values())) {
      if (now > entry.expires) {
        expired++;
      } else {
        active++;
      }
    }

    return {
      total: this.cache.size,
      active,
      expired,
      maxSize: this.maxSize,
    };
  }
}

// Redis cache implementation z lazy connection
class RedisCache {
  async get<T>(key: string): Promise<T | null> {
    try {
      const redis = await getRedisClient();
      if (!redis) {
        debug('Redis nie dostępny w RedisCache.get - używam fallback');
        return null;
      }
      const val = await redis.get(key);
      return val ? (JSON.parse(val) as T) : null;
    } catch (err) {
      debug('Błąd Redis w get:', err);
      return null;
    }
  }

  async set<T>(key: string, data: T, ttlSeconds: number = 300): Promise<void> {
    try {
      const redis = await getRedisClient();
      if (!redis) {
        debug('Redis nie dostępny w RedisCache.set - pomijam cache');
        return;
      }
      await redis.set(key, JSON.stringify(data));
      if (ttlSeconds) await redis.expire(key, ttlSeconds);
    } catch (err) {
      debug('Błąd Redis w set:', err);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const redis = await getRedisClient();
      if (!redis) return;
      await redis.del(key);
    } catch (err) {
      debug('Błąd Redis w delete:', err);
    }
  }

  async clear(): Promise<void> {
    // Redis nie ma operacji clear - można użyć flushdb, ale to niebezpieczne
    // Zamiast tego, można oznaczyć wszystkie klucze do usunięcia
    console.warn('Redis clear operation not implemented for safety reasons');
  }

  async getStats() {
    const redis = await getRedisClient();
    return {
      redis: !!redis,
      type: 'redis',
    };
  }
}

// Unified cache interface
interface CacheInterface {
  get<T>(key: string): Promise<T | null> | T | null;
  set<T>(key: string, data: T, ttlSeconds?: number): Promise<void> | void;
  delete(key: string): Promise<void> | void;
  clear(): Promise<void> | void;
  getStats(): Record<string, unknown> | Promise<Record<string, unknown>>;
}

// Factory function to create appropriate cache
async function createCache(): Promise<CacheInterface> {
  // During build time or when Redis is not available, always use memory cache
  if (typeof window !== 'undefined' || process.env.NODE_ENV === 'test') {
    return new MemoryCache();
  }

  const redis = await getRedisClient();
  if (!redis) {
    debug('Redis niedostępny w createCache - używam MemoryCache');
    return new MemoryCache();
  }

  return new RedisCache();
}

// Globalna instancja cache (lazy initialization)
let cacheInstance: CacheInterface | null = null;

async function getCache(): Promise<CacheInterface> {
  if (!cacheInstance) {
    cacheInstance = await createCache();
  }
  return cacheInstance;
}

/**
 * Generuje klucz cache na podstawie requestu
 */
export function generateCacheKey(request: NextRequest, prefix: string = ''): string {
  const url = new URL(request.url);
  const searchParams = url.searchParams.toString();
  const pathname = url.pathname;

  return `${prefix}:${pathname}:${searchParams}`;
}

/**
 * Cache dla GET requestów
 */
export function withCache(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: {
    ttl?: number; // Time to live w sekundach
    keyPrefix?: string;
    skipCache?: (request: NextRequest) => boolean;
  } = {},
) {
  const { ttl = 300, keyPrefix = 'api', skipCache } = options;

  return async (request: NextRequest): Promise<NextResponse> => {
    // Tylko dla GET requestów
    if (request.method !== 'GET') {
      return handler(request);
    }

    // Sprawdź czy cache ma być pominięty
    if (skipCache && skipCache(request)) {
      return handler(request);
    }

    const cacheKey = generateCacheKey(request, keyPrefix);
    const cache = await getCache();

    // Sprawdź cache
    const cachedData = await cache.get<{
      data: unknown;
      status: number;
      headers: Record<string, string>;
    }>(cacheKey);
    if (cachedData) {
      // Dodaj nagłówki cache
      const response = NextResponse.json(cachedData.data, {
        status: cachedData.status,
        headers: {
          ...cachedData.headers,
          'X-Cache': 'HIT',
          'X-Cache-Timestamp': new Date().toISOString(),
        },
      });
      return response;
    }

    // Wykonaj handler
    const response = await handler(request);

    // Cache tylko successful responses
    if (response.status >= 200 && response.status < 300) {
      // Klonuj response aby móc go cache'ować
      const responseClone = response.clone();
      const responseData = await responseClone.json();

      const cacheableData = {
        data: responseData,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
      };

      // Zawsze używaj async version
      await cache.set(cacheKey, cacheableData, ttl);
    }

    // Dodaj nagłówki cache miss
    const responseClone = response.clone();
    const responseData = await responseClone.json();
    const finalResponse = NextResponse.json(responseData, {
      status: response.status,
      headers: {
        ...Object.fromEntries(response.headers.entries()),
        'X-Cache': 'MISS',
        'X-Cache-Timestamp': new Date().toISOString(),
      },
    });

    return finalResponse;
  };
}


/**
 * Middleware do cache'owania API responses
 */
export function createCacheMiddleware(options: {
  ttl?: number;
  keyPrefix?: string;
  skipCache?: (request: NextRequest) => boolean;
}) {
  return (handler: (request: NextRequest) => Promise<NextResponse>) => {
    return withCache(handler, options);
  };
}

/**
 * Helper do tworzenia kluczy cache
 */
export const cacheKeys = {
  auctions: (params: Record<string, string | number | boolean>) => {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    return `auctions:${sortedParams}`;
  },

  auction: (id: string) => `auction:${id}`,

  user: (id: string) => `user:${id}`,

  userAuctions: (userId: string, params: Record<string, string | number | boolean> = {}) => {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    return `user:${userId}:auctions:${sortedParams}`;
  },

  userBids: (userId: string) => `user:${userId}:bids`,

  stats: (type: string) => `stats:${type}`,
};
