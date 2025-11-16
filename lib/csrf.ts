import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from './redis';
import { debug, error, isDev } from './logger';

// Interface dla różnych implementacji store
interface CSRFTokenStore {
  get(key: string): Promise<{ token: string; expires: number } | null>;
  set(key: string, value: { token: string; expires: number }, ttl: number): Promise<void>;
  delete(key: string): Promise<void>;
  cleanup(): Promise<void>;
}

// In-memory store dla development
class MemoryCSRFTokenStore implements CSRFTokenStore {
  private store = new Map<string, { token: string; expires: number }>();

  async get(key: string) {
    const value = this.store.get(key);
    if (!value || value.expires < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return value;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async set(key: string, value: { token: string; expires: number }, _ttl: number) {
    this.store.set(key, value);
  }

  async delete(key: string) {
    this.store.delete(key);
  }

  async cleanup() {
    const now = Date.now();
    for (const [key, value] of Array.from(this.store.entries())) {
      if (value.expires < now) {
        this.store.delete(key);
      }
    }
  }
}

// Redis store dla production z lazy connection
class RedisCSRFTokenStore implements CSRFTokenStore {
  // Use redisManager if available, otherwise fallback to in-memory
  private fallbackStore = new MemoryCSRFTokenStore();

  async get(key: string): Promise<{ token: string; expires: number } | null> {
    try {
      const redis = await getRedisClient();
      if (redis) {
        const val = await redis.get(key);
        if (!val) return null;
        const data = JSON.parse(val) as { token: string; expires: number };
        if (!data || typeof data !== 'object' || !('token' in data) || !('expires' in data)) {
          return null;
        }
        // Expiration handled by Redis TTL; verify timestamp as safety
        if (data.expires < Date.now()) {
          await this.delete(key);
          return null;
        }
        return data;
      }
    } catch (err) {
      // Fall back to memory store on errors
      if (isDev) debug('RedisCSRFTokenStore.get error, falling back to memory:', err);
    }
    return this.fallbackStore.get(key);
  }

  async set(key: string, value: { token: string; expires: number }, ttl: number) {
    try {
      const redis = await getRedisClient();
      if (redis) {
        // Store JSON with TTL
        await redis.set(key, JSON.stringify(value), { EX: ttl });
        return;
      }
    } catch (err) {
      if (isDev) debug('RedisCSRFTokenStore.set error, falling back to memory:', err);
    }
    return this.fallbackStore.set(key, value, ttl);
  }

  async delete(key: string) {
    try {
      const redis = await getRedisClient();
      if (redis) {
        await redis.del(key);
        return;
      }
    } catch (err) {
      if (isDev) debug('RedisCSRFTokenStore.delete error, falling back to memory:', err);
    }
    return this.fallbackStore.delete(key);
  }

  async cleanup() {
    // Redis has TTL; memory fallback needs cleanup
    try {
      const redis = await getRedisClient();
      if (redis) return;
      return this.fallbackStore.cleanup();
    } catch (err) {
      if (isDev) debug('RedisCSRFTokenStore.cleanup error:', err);
    }
  }
}

// Factory function do tworzenia odpowiedniego store
function createCSRFTokenStore(): CSRFTokenStore {
  if (process.env.NODE_ENV === 'production' && process.env.REDIS_URL) {
    return new RedisCSRFTokenStore();
  }
  return new MemoryCSRFTokenStore();
}

// Global store instance
const csrfTokenStore = createCSRFTokenStore();

// Generuj CSRF token
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Sprawdź CSRF token
export async function validateCSRFToken(request: NextRequest, token: string): Promise<boolean> {
  try {
    // Sprawdź token w cookie
    const cookieToken = request.cookies.get('csrf-token')?.value;
    if (!cookieToken) {
      return false;
    }

    // Sprawdź czy token jest w store
    const storedToken = await csrfTokenStore.get(cookieToken);
    if (!storedToken) {
      return false;
    }

    // Sprawdź czy tokeny się zgadzają
    return storedToken.token === token;
  } catch (err) {
    error('CSRF validation error:', err instanceof Error ? err.message : err);
    return false;
  }
}

// Ustaw CSRF token w cookie
export async function setCSRFCookie(response: NextResponse, token: string): Promise<void> {
  const expires = Date.now() + 60 * 60 * 24 * 1000; // 24 godziny
  const ttl = 60 * 60 * 24; // 24 godziny w sekundach

  // Zapisz token w store
  await csrfTokenStore.set(token, { token, expires }, ttl);

  response.cookies.set('csrf-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 godziny
    path: '/',
  });
}

// Middleware CSRF dla API routes
export function withCSRF(handler: Function) {
  return async (request: NextRequest, ...args: unknown[]) => {
    // Sprawdź czy to POST, PUT, DELETE request
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
      try {
        let csrfToken: string | null = null;

        const contentType = request.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
          const clonedRequest = request.clone();
          const body = await clonedRequest.json();
          csrfToken = body.csrfToken;
        } else if (contentType.includes('multipart/form-data')) {
          const clonedRequest = request.clone();
          const formData = await clonedRequest.formData();
          csrfToken = formData.get('csrfToken') as string;
        }

        if (!csrfToken || !(await validateCSRFToken(request, csrfToken))) {
          return NextResponse.json({ error: 'Nieprawidłowy CSRF token' }, { status: 403 });
        }
      } catch (err) {
        error('CSRF middleware error:', err instanceof Error ? err.message : err);
        return NextResponse.json({ error: 'Błąd walidacji CSRF' }, { status: 400 });
      }
    }

    return handler(request, ...args);
  };
}

// Wyczyść wygasłe tokeny
export async function cleanupExpiredTokens(): Promise<void> {
  try {
    await csrfTokenStore.cleanup();
  } catch (err) {
    error('CSRF cleanup error:', err instanceof Error ? err.message : err);
  }
}

// Export helper to start periodic cleanup in long-running environments (do not call in serverless edge workers)
export function startCSRFCleanup(intervalMs: number = 5 * 60 * 1000) {
  if (typeof setInterval === 'undefined') return null;
  // Caller should call this from a long-running process (server, worker)
  return setInterval(cleanupExpiredTokens, intervalMs);
}

// Export store dla testów i debugowania
export { csrfTokenStore };
