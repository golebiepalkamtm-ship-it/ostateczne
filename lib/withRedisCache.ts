import { getRedisClient } from './redis';
import { debug } from './logger';

/**
 * Redis Cache Wrapper z Graceful Fallback
 *
 * Automatycznie używa Redis cache jeśli dostępny, w przeciwnym razie
 * wykonuje funkcję bez cache'owania.
 *
 * @param cacheKey Klucz cache (namespace:resource:id)
 * @param fetchFn Funkcja pobierająca dane (wywołana gdy brak w cache)
 * @param ttl Time-to-live w sekundach (domyślnie 60s)
 * @returns Dane z cache lub z fetchFn
 *
 * @example
 * const auctions = await withRedisCache(
 *   'auctions:active',
 *   async () => await prisma.auction.findMany({ where: { status: 'ACTIVE' } }),
 *   120 // 2 minuty TTL
 * );
 */
export async function withRedisCache<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  ttl = 60
): Promise<T> {
  try {
    // Lazy connection - pobierz klienta Redis
    const redis = await getRedisClient();

    if (!redis) {
      // Redis nie skonfigurowany lub niedostępny - wykonaj bez cache
      debug(`⚠️ Redis niedostępny dla klucza: ${cacheKey} - pomijam cache`);
      return await fetchFn();
    }

    // Sprawdź cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      debug(`✅ Cache HIT: ${cacheKey}`);
      return JSON.parse(cached) as T;
    }

    // Cache miss - pobierz dane
    debug(`❌ Cache MISS: ${cacheKey} - pobieram dane`);
    const data = await fetchFn();

    // Zapisz w cache
    await redis.set(cacheKey, JSON.stringify(data), { EX: ttl });
    debug(`💾 Zapisano w cache: ${cacheKey} (TTL: ${ttl}s)`);

    return data;
  } catch (error) {
    // Błąd Redis - graceful fallback do no-cache
    debug('⚠️ Błąd Redis, wykonuję bez cache:', error instanceof Error ? error.message : error);
    return await fetchFn();
  }
}
