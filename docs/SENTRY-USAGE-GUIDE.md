# Przewodnik użycia Sentry

Sentry jest już skonfigurowane w projekcie. Ten przewodnik pokazuje jak używać Sentry do monitorowania błędów i wydajności.

## 📚 Spis treści

1. [Podstawowe użycie](#podstawowe-użycie)
2. [W API Routes](#w-api-routes)
3. [W Server Components](#w-server-components)
4. [W Client Components](#w-client-components)
5. [Monitoring wydajności](#monitoring-wydajności)
6. [Kontekst użytkownika](#kontekst-użytkownika)
7. [Breadcrumbs (ślady)](#breadcrumbs-ślady)
8. [Tagi i filtry](#tagi-i-filtry)

---

## Podstawowe użycie

### Import helperów

```typescript
import { captureError, captureMessage, setUserContext } from '@/lib/sentry-helpers';
import * as Sentry from '@sentry/nextjs';
```

### Wysyłanie błędów

```typescript
// Automatycznie przez ErrorLogger (w API routes)
import { errorLogger } from '@/lib/error-handling';

try {
  // kod
} catch (error) {
  errorLogger.log(error, { userId: '123', action: 'create-auction' });
}

// Ręcznie
import { captureError } from '@/lib/sentry-helpers';

try {
  // kod
} catch (error) {
  captureError(error, {
    userId: user.id,
    auctionId: auction.id,
    action: 'bid-placement',
  });
}
```

### Wysyłanie wiadomości (logi)

```typescript
import { captureMessage } from '@/lib/sentry-helpers';

// Logowanie zdarzeń
captureMessage('User completed profile verification', 'info', {
  userId: user.id,
  timestamp: new Date().toISOString(),
});

// Ostrzeżenia
captureMessage('Rate limit approaching threshold', 'warning', {
  userId: user.id,
  requestsCount: 95,
  limit: 100,
});
```

---

## W API Routes

### Automatyczne przez middleware

```typescript
import { withErrorHandling } from '@/lib/error-handling';
import { NextRequest, NextResponse } from 'next/server';

export const GET = withErrorHandling(async (request: NextRequest) => {
  // Wszystkie błędy są automatycznie logowane do Sentry
  const data = await fetchData();
  return NextResponse.json(data);
});
```

### Ręczne użycie

```typescript
import { captureError, addBreadcrumb } from '@/lib/sentry-helpers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Dodaj breadcrumb przed ważną operacją
    addBreadcrumb('Starting auction creation', 'api', 'info', {
      userId: user.id,
    });

    const body = await request.json();
    const auction = await createAuction(body);

    return NextResponse.json(auction);
  } catch (error) {
    // Wysyłaj do Sentry z pełnym kontekstem
    captureError(error as Error, {
      endpoint: '/api/auctions/create',
      userId: user?.id,
      requestBody: body,
    });

    return NextResponse.json({ error: 'Failed to create auction' }, { status: 500 });
  }
}
```

### Z walidacją

```typescript
import { withErrorHandling } from '@/lib/error-handling';
import { AppErrors, handleZodError } from '@/lib/error-handling';
import { z } from 'zod';

const schema = z.object({
  title: z.string().min(1),
  price: z.number().positive(),
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();

  try {
    const validated = schema.parse(body);
    // ... kod
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Błędy walidacji są automatycznie obsługiwane
      throw handleZodError(error);
    }
    throw error;
  }
});
```

---

## W Server Components

```typescript
import { captureError } from '@/lib/sentry-helpers'

export default async function AuctionPage({ params }: { params: { id: string } }) {
  try {
    const auction = await getAuction(params.id)
    return <AuctionDetails auction={auction} />
  } catch (error) {
    captureError(error as Error, {
      page: 'auction',
      auctionId: params.id,
    })

    return <div>Error loading auction</div>
  }
}
```

---

## W Client Components

```typescript
'use client'

import { captureError, addBreadcrumb } from '@/lib/sentry-helpers'
import { useState } from 'react'

export function BidButton({ auctionId }: { auctionId: string }) {
  const [loading, setLoading] = useState(false)

  async function handleBid() {
    setLoading(true)

    try {
      addBreadcrumb('User clicked bid button', 'user-action', 'info', {
        auctionId,
      })

      const response = await fetch('/api/auctions/bid', {
        method: 'POST',
        body: JSON.stringify({ auctionId, amount: 100 }),
      })

      if (!response.ok) {
        throw new Error('Bid failed')
      }
    } catch (error) {
      captureError(error as Error, {
        component: 'BidButton',
        auctionId,
        action: 'bid',
      })

      alert('Failed to place bid')
    } finally {
      setLoading(false)
    }
  }

  return <button onClick={handleBid}>Place Bid</button>
}
```

### Error Boundaries (automatycznie przez global-error.tsx)

Błędy w Client Components są automatycznie przechwytywane przez `app/global-error.tsx` i wysyłane do Sentry.

---

## Monitoring wydajności

### Śledzenie operacji

```typescript
import { withSentrySpan } from '@/lib/sentry-helpers';

// W API Route
export async function GET(request: NextRequest) {
  return withSentrySpan('fetch-auctions', 'db.query', async () => {
    const auctions = await prisma.auction.findMany();
    return NextResponse.json(auctions);
  });
}
```

### Śledzenie żądań API

```typescript
'use client';

import { withSentrySpan } from '@/lib/sentry-helpers';

async function fetchUserData(userId: string) {
  return withSentrySpan('fetch-user-data', 'http.client', async () => {
    const response = await fetch(`/api/users/${userId}`);
    return response.json();
  });
}
```

---

## Kontekst użytkownika

### Ustawienie kontekstu po zalogowaniu

```typescript
import { setUserContext } from '@/lib/sentry-helpers';

// Po zalogowaniu
function onLoginSuccess(user: User) {
  setUserContext({
    id: user.id,
    email: user.email,
    username: user.displayName,
  });
}
```

### Czyszczenie kontekstu po wylogowaniu

```typescript
import { clearUserContext } from '@/lib/sentry-helpers';

function onLogout() {
  clearUserContext();
}
```

### W middleware/auth

```typescript
// lib/auth-middleware.ts
import { setUserContext } from '@/lib/sentry-helpers';

export async function withAuth(handler: Function) {
  return async (request: NextRequest) => {
    const user = await getCurrentUser(request);

    if (user) {
      setUserContext({
        id: user.id,
        email: user.email,
      });
    }

    return handler(request);
  };
}
```

---

## Breadcrumbs (ślady)

Breadcrumbs pomagają zrozumieć sekwencję zdarzeń prowadzących do błędu.

```typescript
import { addBreadcrumb } from '@/lib/sentry-helpers';

// Przy ważnych akcjach
addBreadcrumb('User started checkout', 'checkout', 'info', {
  userId: user.id,
  cartItems: cart.items.length,
});

addBreadcrumb('Payment method selected', 'checkout', 'info', {
  paymentMethod: 'credit-card',
});

addBreadcrumb('Payment processing started', 'checkout', 'info');

// Jeśli wystąpi błąd, Sentry zobaczy całą sekwencję
```

### Przykład: proces licytacji

```typescript
async function placeBid(auctionId: string, amount: number) {
  addBreadcrumb('Bid placement started', 'auction', 'info', {
    auctionId,
    amount,
  });

  const auction = await getAuction(auctionId);
  addBreadcrumb('Auction fetched', 'auction', 'info', {
    currentBid: auction.currentBid,
  });

  if (amount <= auction.currentBid) {
    addBreadcrumb('Bid amount too low', 'auction', 'warning', {
      amount,
      currentBid: auction.currentBid,
    });
    throw new Error('Bid too low');
  }

  const bid = await createBid(auctionId, amount);
  addBreadcrumb('Bid created successfully', 'auction', 'info', {
    bidId: bid.id,
  });

  return bid;
}
```

---

## Tagi i filtry

Tagi pozwalają filtrować błędy w Sentry dashboard.

```typescript
import { setTag, setContext } from '@/lib/sentry-helpers';

// W API route
export async function GET(request: NextRequest) {
  setTag('environment', process.env.NODE_ENV);
  setTag('api-version', 'v1');

  setContext('request', {
    path: request.nextUrl.pathname,
    method: request.method,
  });

  // ... kod
}
```

### Automatyczne tagi przez captureError

`captureError` automatycznie dodaje tagi:

- `errorType` - typ błędu (VALIDATION_ERROR, DATABASE_ERROR, etc.)
- `statusCode` - kod HTTP

---

## Przykłady praktyczne

### 1. API Route z pełnym monitoringiem

```typescript
import { withErrorHandling } from '@/lib/error-handling';
import { addBreadcrumb, withSentrySpan } from '@/lib/sentry-helpers';
import { NextRequest, NextResponse } from 'next/server';

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();

  addBreadcrumb('Auction creation started', 'api', 'info', {
    userId: user.id,
  });

  return withSentrySpan('create-auction', 'db.write', async () => {
    const auction = await prisma.auction.create({
      data: {
        title: body.title,
        price: body.price,
        userId: user.id,
      },
    });

    addBreadcrumb('Auction created', 'api', 'info', {
      auctionId: auction.id,
    });

    return NextResponse.json(auction);
  });
});
```

### 2. Client Component z error handling

```typescript
'use client'

import { captureError, addBreadcrumb } from '@/lib/sentry-helpers'
import { useState } from 'react'

export function AuctionForm() {
  const [loading, setLoading] = useState(false)

  async function handleSubmit(data: FormData) {
    setLoading(true)

    try {
      addBreadcrumb('Form submission started', 'form', 'info')

      const response = await fetch('/api/auctions/create', {
        method: 'POST',
        body: JSON.stringify(data),
      })

      addBreadcrumb('API response received', 'form', 'info', {
        status: response.status,
      })

      if (!response.ok) {
        throw new Error('Failed to create auction')
      }

      const result = await response.json()
      addBreadcrumb('Auction created successfully', 'form', 'info', {
        auctionId: result.id,
      })

      router.push(`/auctions/${result.id}`)
    } catch (error) {
      captureError(error as Error, {
        component: 'AuctionForm',
        formData: data,
      })
    } finally {
      setLoading(false)
    }
  }

  return <form onSubmit={handleSubmit}>...</form>
}
```

### 3. Async operation w Server Component

```typescript
import { captureError, withSentrySpan } from '@/lib/sentry-helpers'

async function getAuctions() {
  return withSentrySpan('fetch-auctions', 'db.query', async () => {
    return await prisma.auction.findMany({
      where: { status: 'ACTIVE' },
    })
  })
}

export default async function AuctionsPage() {
  try {
    const auctions = await getAuctions()
    return <AuctionsList auctions={auctions} />
  } catch (error) {
    captureError(error as Error, {
      page: 'auctions',
      action: 'fetch-list',
    })
    return <ErrorPage />
  }
}
```

---

## Dashboard Sentry

Błędy będą widoczne w: https://mtmpalka.sentry.io/issues/

### Przydatne funkcje dashboard:

1. **Issues** - lista wszystkich błędów
2. **Performance** - monitoring wydajności
3. **Releases** - wersje aplikacji
4. **User Feedback** - opinie użytkowników
5. **Alerts** - powiadomienia o błędach

---

## Najlepsze praktyki

1. ✅ **Nie loguj błędów walidacji (400)** - `captureError` automatycznie to pomija
2. ✅ **Dodawaj kontekst** - userId, requestId, action itp.
3. ✅ **Używaj breadcrumbs** - dla złożonych operacji
4. ✅ **Monitoruj wydajność** - dla krytycznych operacji
5. ✅ **Ustawiaj kontekst użytkownika** - po zalogowaniu
6. ✅ **Czytaj dashboard** - regularnie sprawdzaj błędy

---

## Troubleshooting

### Błędy nie są widoczne w Sentry?

1. Sprawdź czy `SENTRY_DSN` jest ustawione w zmiennych środowiskowych
2. Sprawdź czy nie blokujesz requestów do Sentry (ad-blocker)
3. Sprawdź `sentry.client.config.ts` i `sentry.server.config.ts`
4. Uruchom test: `/sentry-example-page`

### Zbyt wiele błędów?

Użyj `tracesSampleRate` w konfiguracji Sentry (już ustawione na 1.0 - możesz zmniejszyć w produkcji).

---

## Więcej informacji

- [Dokumentacja Sentry Next.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Dashboard projektu](https://mtmpalka.sentry.io/issues/?project=4510277341151312)
- [Przykładowa strona testowa](/sentry-example-page)
