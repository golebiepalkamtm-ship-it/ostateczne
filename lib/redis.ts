import { createClient, RedisClientType } from 'redis';
import { debug, error as logError } from './logger';

/**
 * Redis Client Manager z Lazy Connection i Graceful Fallback
 *
 * Pattern:
 * - Połączenie tylko na żądanie (lazy)
 * - Singleton - jedna instancja w całej aplikacji
 * - Graceful degradation - aplikacja działa bez Redis
 * - Error handling - nie crashuje aplikacji
 *
 * @example
 * const client = await getRedisClient();
 * if (client) {
 *   const data = await client.get('key');
 * } else {
 *   // Fallback logic bez cache
 * }
 */

let redisClient: RedisClientType | null = null;
let connectionAttempted = false;
let isConnecting = false;

/**
 * Sprawdza czy Redis jest skonfigurowany w zmiennych środowiskowych
 */
export function isRedisConfigured(): boolean {
  return !!process.env.REDIS_URL;
}

/**
 * Pobiera aktywnego klienta Redis (lazy connection)
 *
 * @returns Redis client lub null jeśli niedostępny
 */
export async function getRedisClient(): Promise<RedisClientType | null> {
  // Redis nie skonfigurowany - zwróć null od razu
  if (!isRedisConfigured()) {
    if (!connectionAttempted) {
      debug('⚙️ Redis nie skonfigurowany (brak REDIS_URL) - cache wyłączony');
      connectionAttempted = true;
    }
    return null;
  }

  // Jeśli już mamy połączenie - zwróć klienta
  if (redisClient?.isOpen) {
    return redisClient;
  }

  // Już próbujemy się połączyć - czekaj
  if (isConnecting) {
    debug('⏳ Redis connection już w toku, czekam...');
    // Poczekaj max 5s na połączenie
    let attempts = 0;
    while (isConnecting && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    return redisClient?.isOpen ? redisClient : null;
  }

  // Pierwsza próba połączenia
  if (!connectionAttempted) {
    isConnecting = true;
    connectionAttempted = true;

    try {
      debug('🔌 Łączenie z Redis:', process.env.REDIS_URL);

      redisClient = createClient({
        url: process.env.REDIS_URL,
        socket: {
          reconnectStrategy: retries => {
            // Max 3 próby reconnect, potem fallback do no-cache
            if (retries > 3) {
              debug('⚠️ Redis reconnect limit osiągnięty - przechodzę na no-cache mode');
              return false; // Stop reconnecting
            }
            // Exponential backoff: 100ms, 200ms, 400ms
            return Math.min(retries * 100, 500);
          },
          connectTimeout: 5000, // 5s timeout dla initial connection
        },
      });

      // Error handler - nie crashuj aplikacji
      redisClient.on('error', err => {
        logError('❌ Redis Client Error:', err);
        // Graceful degradation - aplikacja działa dalej bez cache
      });

      redisClient.on('connect', () => {
        debug('✅ Redis połączony');
      });

      redisClient.on('reconnecting', () => {
        debug('🔄 Redis reconnecting...');
      });

      redisClient.on('end', () => {
        debug('🔌 Redis connection zamknięte');
      });

      // Próba połączenia z timeout
      await redisClient.connect();

      debug('✅ Redis połączony pomyślnie');
      return redisClient;
    } catch (err) {
      logError('❌ Nie można połączyć z Redis - cache wyłączony:', err);
      redisClient = null;
      return null;
    } finally {
      isConnecting = false;
    }
  }

  // Kolejne wywołania po nieudanej próbie - zwróć null
  return null;
}

/**
 * Zamyka połączenie Redis (użyj przy shutdown aplikacji)
 */
export async function closeRedisConnection(): Promise<void> {
  if (redisClient?.isOpen) {
    try {
      await redisClient.quit();
      debug('👋 Redis connection zamknięte gracefully');
    } catch (err) {
      logError('❌ Błąd zamykania Redis connection:', err);
    }
  }
  redisClient = null;
  connectionAttempted = false;
}

/**
 * Legacy export dla backward compatibility
 * ⚠️ DEPRECATED - używaj getRedisClient() zamiast tego
 *
 * @deprecated Używaj getRedisClient() dla lazy connection
 */
export const redis = new Proxy({} as RedisClientType, {
  get() {
    throw new Error('Używanie redis.* jest deprecated. Użyj await getRedisClient() zamiast tego.');
  },
});
