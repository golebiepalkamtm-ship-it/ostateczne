# Przewodnik użycia Prometheus

Prometheus jest już skonfigurowane w projekcie do monitorowania metryk aplikacji. Ten przewodnik pokazuje jak używać Prometheus do śledzenia wydajności i metryk biznesowych.

## 📚 Spis treści

1. [Konfiguracja](#konfiguracja)
2. [Dostępne metryki](#dostępne-metryki)
3. [Automatyczne śledzenie](#automatyczne-śledzenie)
4. [Metryki biznesowe](#metryki-biznesowe)
5. [Monitoring bazy danych](#monitoring-bazy-danych)
6. [Monitoring zewnętrznych serwisów](#monitoring-zewnętrznych-serwisów)
7. [Dostęp do metryk](#dostęp-do-metryk)
8. [Grafana Dashboard](#grafana-dashboard)

---

## Konfiguracja

### Endpoint metryk

Prometheus zbiera metryki z endpointu:

```
GET /api/metrics
```

### Prometheus Configuration

Plik `prometheus.yml` konfiguruje Prometheus do zbierania metryk:

```yaml
global:
  scrape_interval: 10s
scrape_configs:
  - job_name: 'nextjs_app'
    static_configs:
      - targets: ['host.docker.internal:3000']
```

### Docker Compose

Uruchom Prometheus i Grafana:

```bash
docker-compose up -d prometheus grafana
```

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:4000 (admin/changeme)

---

## Dostępne metryki

### HTTP Request Metrics (automatyczne)

Wszystkie requesty do API routes są automatycznie śledzone przez middleware:

- `http_requests_total` - łączna liczba requestów (method, route, status_code)
- `http_request_duration_seconds` - czas odpowiedzi (histogram)
- `http_request_errors_total` - liczba błędów (method, route, error_type)

### Business Metrics

- `auctions_created_total` - liczba stworzonych aukcji
- `bids_placed_total` - liczba złożonych bidów
- `auctions_active` - aktualna liczba aktywnych aukcji (gauge)
- `bid_amount_pln` - wartości bidów (histogram)
- `users_registered_total` - liczba rejestracji
- `users_active` - liczba aktywnych użytkowników (gauge)
- `messages_sent_total` - liczba wysłanych wiadomości

### Database Metrics

- `database_query_duration_seconds` - czas zapytań do bazy
- `database_errors_total` - błędy bazy danych

### External Services Metrics

- `firebase_request_duration_seconds` - czas requestów do Firebase
- `firebase_errors_total` - błędy Firebase
- `sms_request_duration_seconds` - czas wysyłania SMS
- `sms_sent_total` - liczba wysłanych SMS

### System Metrics (domyślne)

Prometheus automatycznie zbiera metryki systemowe:

- `process_cpu_user_seconds_total` - użycie CPU
- `process_resident_memory_bytes` - użycie pamięci
- `nodejs_heap_size_total_bytes` - rozmiar heap Node.js
- I wiele innych...

---

## Automatyczne śledzenie

### HTTP Requests

Wszystkie API routes używające `createApiMiddleware` automatycznie śledzą metryki:

```typescript
import { createApiMiddleware } from '@/lib/api-middleware';

export const GET = createApiMiddleware()(async request => {
  // Metryki są automatycznie zbierane:
  // - http_requests_total
  // - http_request_duration_seconds
  // - http_request_errors_total (jeśli błąd)
  return NextResponse.json({ data: 'test' });
});
```

### Przykład z pełną konfiguracją

```typescript
import { createApiMiddleware, middlewareConfigs } from '@/lib/api-middleware';

export const POST = createApiMiddleware(middlewareConfigs.protected)(async (
  request: NextRequest
) => {
  // Request jest automatycznie śledzony
  const body = await request.json();
  // ... kod
});
```

---

## Metryki biznesowe

### Tracking aukcji

```typescript
import { trackAuctionCreated, trackAuctionEnded } from '@/lib/prometheus-helpers';

// Przy tworzeniu aukcji
export async function createAuction(data: CreateAuctionData, userId: string) {
  const auction = await prisma.auction.create({
    data: { ...data, userId },
  });

  // Track w Prometheus
  trackAuctionCreated(userId);

  return auction;
}

// Przy końcu aukcji
export async function endAuction(auctionId: string) {
  await prisma.auction.update({
    where: { id: auctionId },
    data: { status: 'ENDED' },
  });

  trackAuctionEnded();
}
```

### Tracking bidów

```typescript
import { trackBidPlaced } from '@/lib/prometheus-helpers';

export async function placeBid(auctionId: string, userId: string, amount: number) {
  const bid = await prisma.bid.create({
    data: {
      auctionId,
      userId,
      amount,
    },
  });

  // Track w Prometheus
  trackBidPlaced(auctionId, userId, amount);

  return bid;
}
```

### Tracking użytkowników

```typescript
import { trackUserRegistered, trackUserLogin, trackUserLogout } from '@/lib/prometheus-helpers';

// Przy rejestracji
export async function registerUser(data: RegisterData, method: 'phone' | 'email') {
  const user = await createUser(data);
  trackUserRegistered(method);
  return user;
}

// Przy logowaniu (w API route lub middleware)
import { setUserContext } from '@/lib/sentry-helpers';
import { trackUserLogin } from '@/lib/prometheus-helpers';

export async function onUserLogin(user: User) {
  setUserContext({ id: user.id, email: user.email });
  trackUserLogin();
}

// Przy wylogowaniu
export async function onUserLogout() {
  clearUserContext();
  trackUserLogout();
}
```

### Tracking wiadomości

```typescript
import { trackMessageSent } from '@/lib/prometheus-helpers';

export async function sendMessage(conversationId: string, userId: string, content: string) {
  const message = await prisma.message.create({
    data: {
      conversationId,
      userId,
      content,
    },
  });

  trackMessageSent(conversationId);
  return message;
}
```

---

## Monitoring bazy danych

### Tracking zapytań Prisma

```typescript
import { trackDatabaseQuery, trackDatabaseError } from '@/lib/prometheus-helpers';

export async function getAuctions() {
  const startTime = Date.now();

  try {
    const auctions = await prisma.auction.findMany({
      where: { status: 'ACTIVE' },
    });

    const duration = Date.now() - startTime;
    trackDatabaseQuery('findMany', 'auction', duration);

    return auctions;
  } catch (error) {
    const duration = Date.now() - startTime;
    trackDatabaseQuery('findMany', 'auction', duration);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      trackDatabaseError('findMany', error.code);
    }

    throw error;
  }
}
```

### Helper dla automatycznego trackingu

```typescript
import { trackDatabaseQuery } from '@/lib/prometheus-helpers';

export async function withDbTracking<T>(
  operation: string,
  table: string,
  query: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  try {
    const result = await query();
    const duration = Date.now() - startTime;
    trackDatabaseQuery(operation, table, duration);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    trackDatabaseQuery(operation, table, duration);
    throw error;
  }
}

// Użycie
const auctions = await withDbTracking('findMany', 'auction', () => prisma.auction.findMany());
```

---

## Monitoring zewnętrznych serwisów

### Firebase

```typescript
import { trackFirebaseOperation, trackFirebaseError } from '@/lib/prometheus-helpers';

export async function verifyFirebaseToken(token: string) {
  const startTime = Date.now();

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    const duration = Date.now() - startTime;
    trackFirebaseOperation('verifyIdToken', duration);
    return decoded;
  } catch (error) {
    const duration = Date.now() - startTime;
    trackFirebaseOperation('verifyIdToken', duration);

    const errorCode = error.code || 'unknown';
    trackFirebaseError('verifyIdToken', errorCode);
    throw error;
  }
}
```

### SMS Service

```typescript
import { trackSMSSent, trackSMSSending } from '@/lib/prometheus-helpers';

export async function sendSMS(phoneNumber: string, message: string) {
  const startTime = Date.now();

  try {
    const result = await smsService.send(phoneNumber, message);
    const duration = Date.now() - startTime;

    trackSMSSending(duration);
    trackSMSSent('success');

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    trackSMSSending(duration);
    trackSMSSent('error');

    throw error;
  }
}
```

---

## Dostęp do metryk

### Endpoint Prometheus

```bash
curl http://localhost:3000/api/metrics
```

Zwraca metryki w formacie Prometheus:

```
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",route="/api/auctions",status_code="200"} 42

# HELP http_request_duration_seconds Duration of HTTP requests in seconds
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{method="GET",route="/api/auctions",le="0.1"} 30
http_request_duration_seconds_bucket{method="GET",route="/api/auctions",le="0.5"} 40
...
```

### PromQL Queries (w Prometheus UI)

**Średni czas odpowiedzi:**

```promql
rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])
```

**Liczba requestów na sekundę:**

```promql
rate(http_requests_total[5m])
```

**Współczynnik błędów:**

```promql
rate(http_request_errors_total[5m]) / rate(http_requests_total[5m])
```

**Liczba aktywnych aukcji:**

```promql
auctions_active
```

**Top 10 endpointów pod względem czasu odpowiedzi:**

```promql
topk(10, rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m]))
```

**Liczba bidów w ostatniej godzinie:**

```promql
increase(bids_placed_total[1h])
```

**Średnia wartość bidu:**

```promql
rate(bid_amount_pln_sum[5m]) / rate(bid_amount_pln_count[5m])
```

---

## Grafana Dashboard

### Konfiguracja Prometheus jako źródła danych

1. Otwórz Grafana: http://localhost:4000
2. Zaloguj się (admin/changeme)
3. Configuration → Data Sources → Add data source
4. Wybierz Prometheus
5. URL: `http://prometheus:9090`
6. Save & Test

### Przykładowy Dashboard

Utwórz nowy dashboard z poniższymi panelami:

#### 1. HTTP Request Rate

```
rate(http_requests_total[5m])
```

#### 2. Response Time (p95)

```
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

#### 3. Error Rate

```
rate(http_request_errors_total[5m]) / rate(http_requests_total[5m])
```

#### 4. Active Auctions

```
auctions_active
```

#### 5. Bids per Hour

```
increase(bids_placed_total[1h])
```

#### 6. Database Query Duration

```
rate(database_query_duration_seconds_sum[5m]) / rate(database_query_duration_seconds_count[5m])
```

#### 7. CPU Usage

```
rate(process_cpu_user_seconds_total[5m])
```

#### 8. Memory Usage

```
process_resident_memory_bytes
```

---

## Przykłady praktyczne

### 1. API Route z trackingiem biznesowym

```typescript
import { createApiMiddleware } from '@/lib/api-middleware';
import { trackAuctionCreated } from '@/lib/prometheus-helpers';
import { trackDatabaseQuery } from '@/lib/prometheus-helpers';
import { NextRequest, NextResponse } from 'next/server';

export const POST = createApiMiddleware()(async (request: NextRequest) => {
  const body = await request.json();
  const userId = await getCurrentUserId(request);

  // Track database query
  const startTime = Date.now();
  const auction = await prisma.auction.create({
    data: {
      title: body.title,
      price: body.price,
      userId,
    },
  });
  trackDatabaseQuery('create', 'auction', Date.now() - startTime);

  // Track business metric
  trackAuctionCreated(userId);

  return NextResponse.json(auction);
});
```

### 2. Tracking w middleware autoryzacji

```typescript
// lib/auth-middleware.ts
import { trackUserLogin } from '@/lib/prometheus-helpers';

export async function withAuth(handler: Function) {
  return async (request: NextRequest) => {
    const user = await getCurrentUser(request);

    if (user) {
      // Track login event
      trackUserLogin();
      // ... reszta logiki
    }

    return handler(request);
  };
}
```

### 3. Tracking w service layer

```typescript
// services/auction.service.ts
import { trackBidPlaced, trackAuctionEnded } from '@/lib/prometheus-helpers';

export class AuctionService {
  async placeBid(auctionId: string, userId: string, amount: number) {
    const bid = await this.createBid(auctionId, userId, amount);
    trackBidPlaced(auctionId, userId, amount);

    // Sprawdź czy aukcja się zakończyła
    const auction = await this.getAuction(auctionId);
    if (auction.status === 'ENDED') {
      trackAuctionEnded();
    }

    return bid;
  }
}
```

---

## Najlepsze praktyki

1. ✅ **Używaj automatycznego trackingu HTTP** - przez middleware
2. ✅ **Trackuj ważne zdarzenia biznesowe** - aukcje, bidy, rejestracje
3. ✅ **Używaj Gauge dla wartości aktualnych** - aktywni użytkownicy, aktywne aukcje
4. ✅ **Używaj Counter dla wartości rosnących** - liczba aukcji, bidów
5. ✅ **Używaj Histogram dla rozkładów** - czas odpowiedzi, wartości bidów
6. ✅ **Dodawaj labelNames** - dla lepszego filtrowania
7. ✅ **Nie trackuj wrażliwych danych** - unikaj PII w metrykach

---

## Alerting w Prometheus

Możesz skonfigurować alerty w Prometheus:

```yaml
# prometheus.yml
rule_files:
  - alerts.yml

# alerts.yml
groups:
  - name: api_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_request_errors_total[5m]) / rate(http_requests_total[5m]) > 0.05
        for: 5m
        annotations:
          summary: 'High error rate detected'

      - alert: SlowResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 5m
        annotations:
          summary: 'Response time p95 is above 2 seconds'
```

---

## Troubleshooting

### Metryki nie są widoczne w Prometheus?

1. Sprawdź czy endpoint `/api/metrics` działa
2. Sprawdź konfigurację `prometheus.yml`
3. Sprawdź czy Prometheus może się połączyć z aplikacją
4. Sprawdź logi Prometheus

### Za dużo metryk?

Użyj `labelNames` do grupowania i redukcji liczby unikalnych metryk.

### Wysokie użycie pamięci?

Prometheus przechowuje metryki w pamięci. W produkcji rozważ:

- Retencję metryk (retention period)
- Agregację metryk (recording rules)
- Przechowywanie w zewnętrznym storage

---

## Więcej informacji

- [Prometheus Documentation](https://prometheus.io/docs/)
- [prom-client Documentation](https://github.com/siimon/prom-client)
- [PromQL Guide](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [Grafana Dashboard Examples](https://grafana.com/grafana/dashboards/)
