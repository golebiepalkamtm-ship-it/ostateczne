# Dokumentacja Architektury Strony Palka MTM Auctions

## Spis Treści

1. [Przegląd Projektu](#przegląd-projektu)
2. [Technologie i Frameworki](#technologie-i-frameworki)
3. [Struktura Projektu](#struktura-projektu)
4. [Baza Danych](#baza-danych)
5. [API i Routing](#api-i-routing)
6. [Komponenty](#komponenty)
7. [Autoryzacja i Bezpieczeństwo](#autoryzacja-i-bezpieczeństwo)
8. [Wdrażanie i Infrastruktura](#wdrażanie-i-infrastruktura)
9. [Monitoring i Obserwowalność](#monitoring-i-obserwowalność)

## Przegląd Projektu

**Palka MTM Auctions** to nowoczesna platforma aukcyjna dedykowana hodowcom gołębi pocztowych. Aplikacja umożliwia organizowanie aukcji, zarządzanie profilami użytkowników oraz komunikację między uczestnikami rynku.

### Główne Funkcjonalności

- **Aukcje**: Tworzenie, przeglądanie i licytowanie aukcji gołębi
- **Użytkownicy**: Rejestracja, weryfikacja email i telefonu
- **Komunikacja**: System wiadomości między użytkownikami
- **Zarządzanie**: Panel administratora do moderacji
- **Referencje**: System opinii i recenzji
- **Spotkania hodowców**: Organizacja wydarzeń branżowych

## Technologie i Frameworki

### Frontend

- **Next.js 14** - React framework z App Router
- **React 18** - Biblioteka UI
- **TypeScript** - Typowany JavaScript
- **Tailwind CSS** - Framework CSS
- **Framer Motion** - Animacje i mikrointerakcje

### Backend & Baza Danych

- **Next.js API Routes** - Serverless API
- **Prisma** - ORM dla PostgreSQL
- **PostgreSQL** - Baza danych
- **Redis** - Cache i sesje

### Autoryzacja & Bezpieczeństwo

- **Firebase Authentication** - Autoryzacja użytkowników
- **NextAuth.js** - Sesje i middleware
- **bcryptjs** - Hashowanie haseł
- **Zod** - Walidacja danych

### Infrastruktura

- **Docker** - Konteneryzacja aplikacji i serwisów
- **Docker Compose** - Orkiestracja wielu kontenerów w dev/staging
- **Nginx** - Reverse proxy, load balancing, SSL termination
- **PostgreSQL** - Baza danych (15-alpine)
- **Redis** - Cache, sesje, pub/sub (7-alpine)
- **Prometheus** - Zbieranie metryk aplikacji i infrastruktury
- **Grafana** - Dashboards i wizualizacja metryk
- **pgAdmin** - GUI do zarządzania PostgreSQL
- **Adminer** - Lekka alternatywa do pgAdmin (obsługuje PostgreSQL, MySQL, etc.)
- **Mailhog** - Testowanie emaili w developmencie (SMTP + Web UI)
- **MinIO** - S3-compatible object storage (zdjęcia, dokumenty)
- **Redis Commander** - Web UI do zarządzania Redis
- **Vercel/Firebase** - Wdrożenie produkcyjne
- **Sentry** - Monitorowanie i tracking błędów
- **Winston** - Strukturalne logowanie aplikacji

### Narzędzia Deweloperskie

- **ESLint/Prettier** - Jakość kodu
- **Vitest** - Testy jednostkowe
- **Playwright** - Testy E2E
- **Prisma Studio** - GUI bazy danych

## Struktura Projektu

```
palka-mtm-auctions/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── auth/              # Strony autoryzacji
│   ├── auctions/          # Strony aukcji
│   ├── dashboard/         # Panele użytkownika
│   └── ...
├── components/            # Komponenty React
│   ├── auth/             # Komponenty autoryzacji
│   ├── auctions/         # Komponenty aukcji
│   ├── layout/           # Layout i nawigacja
│   └── ...
├── lib/                  # Biblioteki i utility
│   ├── auth/            # Funkcje autoryzacji
│   ├── cache/           # Cache Redis
│   ├── firebase/        # Konfiguracja Firebase
│   └── ...
├── prisma/              # Schema bazy danych
├── public/              # Statyczne pliki
├── types/               # Definicje TypeScript
└── utils/               # Funkcje pomocnicze
```

## Baza Danych

### Główne Modele

#### User (Użytkownik)

```prisma
model User {
  id            String    @id @default(cuid())
  firebaseUid   String?   @unique
  firstName     String?
  lastName      String?
  email         String    @unique
  role          Role      @default(USER_REGISTERED)
  isActive      Boolean   @default(false)
  // ... dodatkowe pola
}
```

#### Auction (Aukcja)

```prisma
model Auction {
  id          String        @id @default(cuid())
  title       String
  description String
  pigeonId    String?
  sellerId    String
  startingPrice Float
  currentPrice  Float
  status        AuctionStatus @default(ACTIVE)
  isApproved    Boolean       @default(false)
  // ... relacje z Pigeon, Bid, Transaction
}
```

#### Pigeon (Gołąb)

```prisma
model Pigeon {
  id          String   @id @default(cuid())
  name        String
  ringNumber  String   @unique
  bloodline   String
  gender      String
  birthDate   DateTime
  // ... dodatkowe pola
}
```

### Relacje

- **User** ↔ **Auction** (jeden do wielu)
- **Auction** ↔ **Bid** (jeden do wielu)
- **User** ↔ **Bid** (jeden do wielu)
- **Auction** ↔ **Pigeon** (wiele do jednego)
- **User** ↔ **Conversation** (wiele do wielu przez UserMessage)

### Indeksy

Baza danych zawiera optymalizowane indeksy dla:

- Wyszukiwania aukcji (status, kategoria, cena)
- Licytacji (auctionId, bidderId)
- Komunikacji (conversationId, senderId)

## API i Routing

### Struktura API Routes

```
app/api/
├── admin/              # Endpointy administratora
│   ├── auctions/      # Zarządzanie aukcjami
│   ├── users/         # Zarządzanie użytkownikami
│   └── stats/         # Statystyki
├── auctions/          # Operacje na aukcjach
│   ├── [id]/         # Szczegóły aukcji
│   ├── bid/          # Licytacja
│   └── create/       # Tworzenie aukcji
├── auth/              # Autoryzacja
│   ├── login/        # Logowanie
│   ├── register/     # Rejestracja
│   └── verify/       # Weryfikacja
├── messages/          # Komunikacja
└── profile/           # Profil użytkownika
```

### Middleware

Middleware obsługuje:

- **Autoryzację**: Sprawdzanie tokenów Firebase
- **Poziomy dostępu**: USER_REGISTERED → USER_EMAIL_VERIFIED → USER_FULL_VERIFIED → ADMIN
- **HTTPS**: Wymuszanie bezpiecznego połączenia w produkcji
- **Routing**: Przekierowania na podstawie stanu weryfikacji

### Cache i Optymalizacja

- **Redis**: Cache dla często używanych danych
- **ISR**: Incremental Static Regeneration dla stron aukcji
- **API Cache**: Buforowanie odpowiedzi API

## Komponenty

### Architektura Komponentów

```
components/
├── layout/            # Layout aplikacji
│   ├── UnifiedLayout.tsx
│   ├── Footer.tsx
│   └── LogoGlow.tsx
├── auth/              # Komponenty autoryzacji
│   ├── LoginForm.tsx
│   ├── RegisterForm.tsx
│   └── PhoneVerification.tsx
├── auctions/          # Komponenty aukcji
│   ├── AuctionDetails.tsx
│   ├── CreateAuctionForm.tsx
│   └── AuctionsPage.tsx
├── dashboard/         # Panele użytkownika
│   ├── UserDashboard.tsx
│   ├── AdminDashboard.tsx
│   └── CompleteProfileCard.tsx
└── ui/                # Komponenty UI wielokrotnego użytku
```

### Kluczowe Komponenty

#### UnifiedLayout

Główny layout aplikacji z:

- Nawigacją responsywną
- Obsługą stanów ładowania
- Integracją z systemem powiadomień

#### AuctionDetails

Komponent wyświetlający szczegóły aukcji z:

- Galerią zdjęć
- Licytacją w czasie rzeczywistym
- Komunikacją z sprzedawcą

#### AdminDashboard

Panel administratora z:

- Statystykami platformy
- Moderacją aukcji
- Zarządzaniem użytkownikami

### Stan Aplikacji

- **Zustand**: Globalny stan aplikacji
- **React Query**: Cache i synchronizacja danych
- **Context API**: Udostępnianie danych między komponentami

## Autoryzacja i Bezpieczeństwo

### Poziomy Dostępu

1. **USER_REGISTERED** - Podstawowa rejestracja
2. **USER_EMAIL_VERIFIED** - Zweryfikowany email
3. **USER_FULL_VERIFIED** - Pełna weryfikacja (SMS)
4. **ADMIN** - Administrator platformy

### Mechanizmy Bezpieczeństwa

#### Firebase Authentication

- **Email/Password**: Podstawowa autoryzacja
- **Phone Verification**: SMS dla pełnej weryfikacji
- **Token Management**: JWT tokens z Firebase

#### Middleware Protection

```typescript
// Ochrona tras na podstawie poziomu weryfikacji
const level2Routes = ['/profile'];
const level3Routes = ['/auctions/create', '/seller'];
```

#### API Security

- **Rate Limiting**: Ograniczenie liczby zapytań
- **CSRF Protection**: Ochrona przed atakami CSRF
- **Input Validation**: Zod schemas dla wszystkich danych wejściowych
- **Sanitization**: Czyszczenie danych użytkownika

#### Headers Bezpieczeństwa

- **X-Frame-Options**: DENY
- **X-Content-Type-Options**: nosniff
- **Referrer-Policy**: origin-when-cross-origin
- **Permissions-Policy**: camera=(), microphone=()

## Wdrażanie i Infrastruktura

### Docker

```dockerfile
# Wieloetapowy build dla optymalizacji
FROM node:18-alpine AS base
FROM base AS deps
# ... instalacja zależności

FROM base AS builder
# ... build aplikacji

FROM base AS runner
# ... produkcyjny obraz
```

### Środowiska

- **Development**: Lokalne środowisko z hot-reload
- **Staging**: Testowe środowisko przed produkcją
- **Production**: Wdrożenie na Vercel/Firebase

### Zmienne Środowiskowe

```env
DATABASE_URL=postgresql://...
FIREBASE_PROJECT_ID=...
REDIS_URL=redis://...
SENTRY_DSN=https://...
```

### CI/CD

- **GitHub Actions**: Automatyczne testy i deployment
- **Docker Build**: Konteneryzacja aplikacji
- **Environment Secrets**: Zarządzanie wrażliwymi danymi

## Monitoring i Obserwowalność

### Sentry

- **Error Tracking**: Monitorowanie błędów w czasie rzeczywistym
- **Performance**: Śledzenie wydajności aplikacji
- **Release Tracking**: Wersjonowanie i deployment tracking

### Prometheus/Grafana

- **Metrics**: Zbieranie metryk aplikacji
- **Dashboards**: Wizualizacja danych monitoringowych
- **Alerts**: Automatyczne powiadomienia

### Logging

- **Winston**: Strukturalne logowanie
- **Log Levels**: ERROR, WARN, INFO, DEBUG
- **External Storage**: Przechowywanie logów w chmurze

### Health Checks

- **API Health**: `/api/health` - sprawdzenie dostępności
- **Database Health**: Sprawdzanie połączenia z bazą
- **External Services**: Monitorowanie Firebase, Redis

## Rozwój i Maintenance

### Code Quality

- **ESLint**: Statyczna analiza kodu
- **Prettier**: Formatowanie kodu
- **TypeScript**: Typowanie statyczne
- **Husky**: Git hooks dla jakości

### Testowanie

- **Unit Tests**: Vitest dla funkcji i komponentów
- **Integration Tests**: Testy API routes
- **E2E Tests**: Playwright dla pełnych scenariuszy

### Dokumentacja

- **README**: Instrukcje instalacji i uruchomienia
- **API Docs**: Dokumentacja endpointów
- **Component Docs**: Opis komponentów i ich props

---

**Data ostatniej aktualizacji**: Listopad 2025
**Wersja aplikacji**: 1.0.0
**Autor dokumentacji**: Kilo Code
