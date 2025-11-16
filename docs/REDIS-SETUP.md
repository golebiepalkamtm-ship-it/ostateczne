# Redis Setup Guide

## 📋 Przegląd

Redis jest **opcjonalnym** komponentem aplikacji Pałka MTM używanym do cache'owania danych i zwiększenia wydajności. Aplikacja **działa bez problemu bez Redis** - automatycznie przełącza się na in-memory cache.

## 🎯 Kiedy Redis jest Potrzebny?

**NIE POTRZEBA Redis dla:**

- Lokalnego developmentu (in-memory cache wystarczy)
- Małych aplikacji (< 1000 użytkowników)
- Środowisk testowych

**Redis jest ZALECANY dla:**

- Środowiska produkcyjnego
- Wysokiego ruchu (> 1000 requestów/min)
- Wielu instancji aplikacji (horizontal scaling)
- Współdzielenia cache między procesami

## 🚀 Instalacja Redis (Windows)

### Opcja 1: Docker (Zalecane)

**Najprostsza metoda** - używamy Docker Compose z repozytorium:

```powershell
# Uruchom Redis z docker-compose
docker-compose up -d redis

# Sprawdź status
docker ps | Select-String redis

# Zatrzymaj
docker-compose down redis
```

Redis będzie dostępny na `localhost:6379`.

### Opcja 2: WSL2 (Windows Subsystem for Linux)

1. **Zainstaluj WSL2** (jeśli nie masz):

```powershell
wsl --install
```

2. **Zainstaluj Redis w Ubuntu (WSL)**:

```bash
sudo apt-get update
sudo apt-get install redis-server

# Uruchom Redis
sudo service redis-server start

# Sprawdź status
redis-cli ping
# Powinno zwrócić: PONG
```

3. **Auto-start przy bootowaniu** (opcjonalnie):
   Dodaj do `~/.bashrc`:

```bash
sudo service redis-server start
```

### Opcja 3: Redis dla Windows (Nieoficjalna)

⚠️ **Nie zalecane** - Microsoft nie wspiera oficjalnie Redis na Windows.

Pobierz z: https://github.com/microsoftarchive/redis/releases

## ⚙️ Konfiguracja Aplikacji

### 1. Włącz Redis w Aplikacji

Edytuj `.env.local`:

```bash
# Uncomment tę linię:
REDIS_URL="redis://localhost:6379"
```

### 2. Zrestartuj Dev Server

```powershell
npm run dev
```

### 3. Weryfikacja

Sprawdź logi aplikacji - powinieneś zobaczyć:

```
[DEBUG] 🔌 Łączenie z Redis: redis://localhost:6379
[DEBUG] ✅ Redis połączony pomyślnie
```

Jeśli Redis nie działa, zobaczysz:

```
[DEBUG] ⚙️ Redis nie skonfigurowany (brak REDIS_URL) - cache wyłączony
```

Lub (jeśli REDIS_URL jest ustawiony ale Redis nie działa):

```
[ERROR] ❌ Nie można połączyć z Redis - cache wyłączony
```

**Aplikacja będzie działać normalnie** - automatycznie przełączy się na in-memory cache.

## 🔧 Konfiguracja Zaawansowana

### Connection String Options

```bash
# Podstawowe połączenie
REDIS_URL="redis://localhost:6379"

# Z hasłem
REDIS_URL="redis://:password@localhost:6379"

# Z bazą danych (domyślnie 0)
REDIS_URL="redis://localhost:6379/1"

# TLS/SSL (production)
REDIS_URL="rediss://username:password@production-redis:6380"
```

### Production (Redis Cloud/AWS ElastiCache)

1. **Redis Cloud** (https://redis.com/cloud):
   - Darmowy tier: 30MB
   - Managed service
   - Automatyczne backupy

2. **AWS ElastiCache**:
   - Zintegrowane z AWS
   - Auto-scaling
   - Multi-AZ replication

Przykład connection string:

```bash
REDIS_URL="rediss://:your-password@redis-12345.c1.us-east-1-1.ec2.cloud.redislabs.com:12345"
```

## 🧪 Testowanie Redis

### Test 1: Connection

```powershell
# Z linii poleceń (jeśli masz redis-cli)
redis-cli ping
# Powinno zwrócić: PONG
```

### Test 2: W Aplikacji

Odwiedź endpoint cache'ujący (np. lista aukcji) i sprawdź nagłówki:

**Pierwsze żądanie:**

```
X-Cache: MISS
X-Cache-Timestamp: 2025-11-12T10:30:00.000Z
```

**Drugie żądanie (w ciągu TTL):**

```
X-Cache: HIT
X-Cache-Timestamp: 2025-11-12T10:30:00.000Z
```

### Test 3: Cache Invalidation

```typescript
// W kodzie
import { getRedisClient } from '@/lib/redis';

const redis = await getRedisClient();
if (redis) {
  // Wyczyść konkretny klucz
  await redis.del('auctions:active');

  // Wyczyść wszystkie klucze z pattern
  const keys = await redis.keys('auctions:*');
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
```

## 📊 Monitoring Redis

### Redis CLI Commands

```bash
# Statystyki
redis-cli INFO stats

# Liczba kluczy
redis-cli DBSIZE

# Pamięć
redis-cli INFO memory

# Wyświetl wszystkie klucze
redis-cli KEYS '*'

# Sprawdź wartość klucza
redis-cli GET 'auctions:active'
```

### W Aplikacji

Sprawdź logi aplikacji:

```
[DEBUG] ✅ Cache HIT: auctions:active
[DEBUG] ❌ Cache MISS: auction:123 - pobieram dane
[DEBUG] 💾 Zapisano w cache: auction:123 (TTL: 60s)
```

## 🐛 Troubleshooting

### Problem: "Redis Client Error: connect ECONNREFUSED"

**Przyczyna:** Redis nie działa lub niewłaściwy port/host

**Rozwiązanie:**

1. Sprawdź czy Redis działa:

   ```powershell
   docker ps | Select-String redis  # Docker
   # lub
   sudo service redis-server status  # WSL
   ```

2. Sprawdź port (domyślnie 6379):

   ```powershell
   netstat -an | Select-String 6379
   ```

3. Jeśli nie chcesz używać Redis - zakomentuj `REDIS_URL` w `.env.local`

### Problem: Aplikacja powolna mimo Redis

**Sprawdź:**

1. TTL (Time-To-Live) - czy nie za krótki?
2. Cache hit ratio - czy cache działa?
3. Rozmiar danych - czy nie za duże obiekty w cache?

**Analiza:**

```typescript
// Dodaj logging w withRedisCache
import { debug } from '@/lib/logger';

// Sprawdź cache hit ratio
debug(`Cache HIT: ${cacheKey}`); // Powinno być > 80%
debug(`Cache MISS: ${cacheKey}`); // Powinno być < 20%
```

### Problem: Out of Memory (Redis)

**Konfiguracja maxmemory** w `redis.conf`:

```conf
maxmemory 256mb
maxmemory-policy allkeys-lru
```

**LRU Policy** - automatycznie usuwa najstarsze klucze gdy pamięć się kończy.

## 📚 Dokumentacja API

### getRedisClient()

Lazy connection do Redis - zwraca klienta lub null jeśli niedostępny.

```typescript
import { getRedisClient } from '@/lib/redis';

const redis = await getRedisClient();
if (redis) {
  // Redis dostępny - użyj cache
  const data = await redis.get('key');
} else {
  // Redis niedostępny - fallback logic
}
```

### withRedisCache()

Wrapper dla funkcji pobierających dane - automatyczne cache'owanie.

```typescript
import { withRedisCache } from '@/lib/withRedisCache';

const auctions = await withRedisCache(
  'auctions:active', // Cache key
  async () =>
    await prisma.auction.findMany({
      /* query */
    }), // Fetcher function
  120 // TTL w sekundach (optional, domyślnie 60)
);
```

### isRedisConfigured()

Sprawdza czy Redis jest skonfigurowany w `.env`.

```typescript
import { isRedisConfigured } from '@/lib/redis';

if (isRedisConfigured()) {
  console.log('Redis włączony');
} else {
  console.log('Redis wyłączony - używam in-memory cache');
}
```

### closeRedisConnection()

Zamyka połączenie Redis (użyj przy shutdown aplikacji).

```typescript
import { closeRedisConnection } from '@/lib/redis';

// W graceful shutdown handler
process.on('SIGTERM', async () => {
  await closeRedisConnection();
  process.exit(0);
});
```

## 🎯 Best Practices

### 1. Cache Key Naming Convention

```typescript
// ✅ DOBRZE - hierarchiczne nazwy
'auctions:active';
'auction:123';
'user:456:auctions';
'stats:daily:2025-11-12';

// ❌ ŹLE - flat structure
'activeAuctions';
'auction123';
'userAuctions456';
```

### 2. TTL Strategy

```typescript
// Dane statyczne - długi TTL (1 godzina)
withRedisCache('categories', fetchCategories, 3600);

// Dane dynamiczne - krótki TTL (1 minuta)
withRedisCache('auctions:active', fetchActiveAuctions, 60);

// Dane real-time - bardzo krótki TTL (10 sekund)
withRedisCache('auction:123:bids', fetchBids, 10);
```

### 3. Cache Invalidation

```typescript
// Po mutacji - invaliduj related cache
async function createAuction(data: AuctionData) {
  const auction = await prisma.auction.create({ data });

  // Invaliduj listy aukcji
  const redis = await getRedisClient();
  if (redis) {
    await redis.del('auctions:active');
    await redis.del(`user:${data.userId}:auctions`);
  }

  return auction;
}
```

### 4. Graceful Degradation

```typescript
// ✅ DOBRZE - zawsze miej fallback
const redis = await getRedisClient();
const data = redis ? await redis.get('key') : await fetchFromDatabase();

// ❌ ŹLE - crashuj gdy Redis nie działa
const data = await redis.get('key'); // Throws error jeśli redis === null
```

## 📦 Docker Compose Configuration

Przykład z repozytorium (`docker-compose.yml`):

```yaml
services:
  redis:
    image: redis:7-alpine
    container_name: palka-mtm-redis
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    restart: unless-stopped
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  redis_data:
```

## 🔗 Dodatkowe Zasoby

- [Redis Documentation](https://redis.io/docs/)
- [Node Redis Client](https://github.com/redis/node-redis)
- [Redis Best Practices](https://redis.io/docs/management/optimization/)
- [Redis CLI Commands](https://redis.io/commands/)

---

**Pytania?** Sprawdź logi aplikacji lub dodaj issue w repozytorium.
