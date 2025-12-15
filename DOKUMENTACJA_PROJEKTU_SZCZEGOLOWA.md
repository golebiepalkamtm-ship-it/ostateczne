# 📚 Szczegółowa Dokumentacja Projektu - Pałka MTM Aukcje Gołębi

> **Pałka MTM - Mistrzowie Sprintu** - Profesjonalna platforma aukcyjna dla hodowców gołębi pocztowych

---

## 📋 Spis Treści

1. [Przegląd Projektu](#przegląd-projektu)
2. [Architektura Systemu](#architektura-systemu)
3. [Technologie i Stack](#technologie-i-stack)
4. [Struktura Bazy Danych](#struktura-bazy-danych)
5. [System Autoryzacji](#system-autoryzacji)
6. [API Reference](#api-reference)
7. [Frontend Components](#frontend-components)
8. [Konfiguracja i Setup](#konfiguracja-i-setup)
9. [Deployment](#deployment)
10. [Testowanie](#testowanie)
11. [Monitoring i Obserwowalność](#monitoring-i-obserwowalność)
12. [Bezpieczeństwo](#bezpieczeństwo)
13. [Optymalizacja Wydajności](#optymalizacja-wydajności)
14. [Rozwój i Maintenance](#rozwój-i-maintenance)

---

## 🎯 Przegląd Projektu

### Opis Aplikacji
**Pałka-MTM** to nowoczesna, pełnofunkcjonalna platforma aukcyjna dedykowana hodowcom gołębi rasowych w Polsce. Aplikacja umożliwia organizowanie profesjonalnych aukcji, zarządzanie profilami hodowców, weryfikację użytkowników oraz komunikację między uczestnikami rynku hodowlanego.

### Główne Funkcjonalności

#### 🏆 Aukcje i Licytacje
- **Tworzenie aukcji** z pełnym opisem gołębia (ring number, linia krwi, osiągnięcia)
- **System licytacji** z automatycznym podbijaniem (proxy bidding)
- **Ochrona przed sniping** - automatyczne przedłużanie aukcji
- **Galeria zdjęć i filmów** dla każdego gołębia
- **Kup teraz (Buy Now)** - natychmiastowy zakup

#### 👥 Zarządzanie Użytkownikami
- **3-poziomowa weryfikacja**: Email → Profil → Telefon
- **Profile hodowców** z referencjami i recenzjami
- **System reputacji** oparty na transakcjach
- **Lista obserwowanych** aukcji i sprzedawców

#### 💬 Komunikacja
- **Wiadomości między użytkownikami** w kontekście aukcji
- **Powiadomienia push** o ważnych zdarzeniach
- **System recenzji** po zakończonych transakcjach

#### 🏅 Dodatkowe Funkcje
- **Galeria mistrzów** - prezentacja najlepszych gołębi
- **Spotkania hodowców** - organizacja wydarzeń branżowych
- **Referencje hodowców** - baza sprawdzonych sprzedawców
- **Panel administracyjny** - zarządzanie platformą

### Grupa Docelowa
- **Profesjonalni hodowcy gołębi** - sprzedaż i zakup rasowych gołębi
- **Entuzjaści gołębi pocztowych** - uczestnictwo w aukcjach
- **Kluby hodowców** - organizacja wydarzeń i spotkań

---

## 🏗️ Architektura Systemu

### Architektura Ogólna

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer                           │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Next.js 14 (App Router) + React 18 + TypeScript   │    │
│  │  Tailwind CSS + Framer Motion + PWA                │    │
│  └─────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│                    API Layer                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Next.js API Routes + Firebase Admin SDK           │    │
│  │  Prisma ORM + PostgreSQL                           │    │
│  └─────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│                    Data Layer                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  PostgreSQL (Primary DB)                            │    │
│  │  Redis (Cache)                                      │    │
│  │  Firebase Storage (Media)                           │    │
│  └─────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│                    External Services                       │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Firebase Auth, Storage, Hosting                    │    │
│  │  Sentry (Monitoring), Redis (Cache)                │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Architektura Mikroserwisowa

```
📱 Frontend App (Next.js)
├── 📄 Strony (App Router)
├── 🧩 Komponenty (React)
├── 🔧 Hooki i Utils
└── 📦 Context Providers

🔗 API Gateway (Next.js API Routes)
├── 🔐 Authentication Middleware
├── 🛡️ Security Middleware
├── 📊 Rate Limiting
└── 🗄️ Database Access

🗄️ Database Layer (Prisma + PostgreSQL)
├── 📋 Schema Definition
├── 🔄 Migrations
├── 🌱 Seed Data
└── 📈 Optimizations

🔧 External Services
├── 🔥 Firebase (Auth, Storage)
├── 📧 Email Service
├── 📱 SMS Service
└── 📊 Analytics
```

---

## 🛠️ Technologie i Stack

### Core Technologies

#### Frontend
- **Next.js 14** - React framework z App Router
- **React 18** - UI library z concurrent features
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Lucide React** - Icon library

#### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Firebase Admin SDK** - Backend authentication
- **Prisma ORM** - Database toolkit
- **PostgreSQL** - Primary database
- **Redis** - Caching layer (optional)

#### External Services
- **Firebase Auth** - User authentication
- **Firebase Storage** - Media storage
- **Firebase Hosting** - Frontend hosting
- **Sentry** - Error monitoring
- **Prometheus** - Metrics collection

### Development Tools

#### Testing
- **Vitest** - Unit testing framework
- **Playwright** - E2E testing
- **Testing Library** - React testing utilities

#### Code Quality
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **TypeScript** - Type checking

#### Build Tools
- **Next.js Build System** - Optimized builds
- **Webpack** - Module bundler (via Next.js)
- **PostCSS** - CSS processing

### Package Dependencies

#### Production Dependencies (Wybrane)
```json
{
  "@prisma/client": "^7.1.0",
  "@sentry/nextjs": "10",
  "@tanstack/react-query": "^5.90.5",
  "firebase": "^12.6.0",
  "firebase-admin": "^13.5.0",
  "framer-motion": "^12.23.24",
  "next": "^14.0.0",
  "next-auth": "^4.24.13",
  "next-pwa": "^5.6.0",
  "react": "^18.2.0",
  "react-hook-form": "^7.65.0",
  "redis": "^5.9.0",
  "zod": "^4.1.12"
}
```

#### Development Dependencies (Wybrane)
```json
{
  "@playwright/test": "^1.56.1",
  "@types/node": "^24.10.1",
  "@types/react": "^18.2.0",
  "@typescript-eslint/eslint-plugin": "^8.46.2",
  "eslint": "^9.0.0",
  "prisma": "^7.1.0",
  "tsx": "^4.21.0",
  "vitest": "^4.0.8"
}
```

---

## 🗄️ Struktura Bazy Danych

### Schemat Prisma

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}
```

### Główne Encje

#### 1. User (Użytkownik)
```prisma
model User {
  id                          String             @id @default(cuid())
  firebaseUid                 String             @unique
  firstName                   String?
  lastName                    String?
  email                       String             @unique
  emailVerified               DateTime?
  image                       String?
  role                        Role               @default(USER_REGISTERED)
  isActive                    Boolean            @default(false)
  activationToken             String?
  address                     String?
  city                        String?
  postalCode                  String?
  phoneNumber                 String?
  isPhoneVerified             Boolean            @default(false)
  phoneVerificationCode       String?
  phoneVerificationExpires    DateTime?
  isProfileVerified           Boolean            @default(false)
  twoFactorSecret             String?
  backupCodes                 String?
  is2FAEnabled                Boolean            @default(false)
  lastLogin                   DateTime?
  createdAt                   DateTime           @default(now())
  updatedAt                   DateTime           @updatedAt

  // Relacje
  accounts                    Account[]
  auctions                    Auction[]
  bids                        Bid[]
  breederMeetings             BreederMeeting[]
  conversationsAsParticipant1 Conversation[]     @relation("ConversationParticipant1")
  conversationsAsParticipant2 Conversation[]     @relation("ConversationParticipant2")
  messages                    Message[]
  notifications               Notification[]
  pushSubscriptions           PushSubscription[]
  receivedReviews             Review[]           @relation("ReviewReviewee")
  givenReviews                Review[]           @relation("ReviewReviewer")
  sessions                    Session[]
  buyerTransactions           Transaction[]      @relation("BuyerTransactions")
  sellerTransactions          Transaction[]      @relation("SellerTransactions")
  sentMessages                UserMessage[]      @relation("UserMessageSender")
  userRating                  UserRating?
  watchlist                   WatchlistItem[]

  @@index([email])
  @@index([role])
  @@index([isActive])
  @@index([isPhoneVerified])
  @@index([isProfileVerified])
  @@index([createdAt])
}
```

#### 2. Auction (Aukcja)
```prisma
model Auction {
  id                    String          @id @default(cuid())
  title                 String
  description           String
  category              String
  pigeonId              String?
  sellerId              String
  startingPrice         Float
  currentPrice          Float
  buyNowPrice           Float?
  reservePrice          Float?
  startTime             DateTime
  endTime               DateTime
  originalEndTime       DateTime?       // Oryginalna data zakończenia (przed przedłużeniami)
  snipeExtensionMinutes Int             @default(5)    // Ile minut przedłużyć przy snipe protection
  snipeThresholdMinutes Int             @default(5)    // Próg czasowy do aktywacji snipe protection
  minBidIncrement       Float           @default(100)  // Minimalne podbicie w PLN
  status                AuctionStatus   @default(ACTIVE)
  isApproved            Boolean         @default(false)
  reserveMet            Boolean         @default(false) // Czy cena minimalna została osiągnięta
  createdAt             DateTime        @default(now())
  updatedAt             DateTime        @updatedAt

  // Relacje
  pigeon                Pigeon?         @relation(fields: [pigeonId], references: [id])
  seller                User            @relation(fields: [sellerId], references: [id])
  assets                AuctionAsset[]
  bids                  Bid[]
  messages              Message[]
  transactions          Transaction[]
  watchlist             WatchlistItem[]

  @@index([isApproved])
  @@index([status])
  @@index([category])
  @@index([sellerId])
  @@index([startTime])
  @@index([endTime])
  @@index([currentPrice])
  @@index([createdAt])
  @@index([updatedAt])
  @@index([status, isApproved])
  @@index([category, status])
  @@index([endTime, status])
}
```

#### 3. Pigeon (Gołąb)
```prisma
model Pigeon {
  id           String    @id @default(cuid())
  name         String
  ringNumber   String    @unique
  bloodline    String
  gender       String
  birthDate    DateTime
  color        String
  weight       Float
  breeder      String
  description  String?
  images       String
  videos       String
  pedigree     String?
  achievements String?
  isChampion   Boolean   @default(false)

  // Dodatkowe charakterystyki
  eyeColor     String?
  featherColor String?
  vitality     String?
  length       String?
  endurance    String?
  forkStrength String?
  forkAlignment String?
  muscles      String?
  balance      String?
  back         String?
  purpose      String?   // JSON array of purposes

  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  auctions     Auction[]
}
```

#### 4. Bid (Oferta)
```prisma
model Bid {
  id        String   @id @default(cuid())
  auctionId String
  bidderId  String
  amount    Float
  maxBid    Float?   // Maksymalna kwota do auto-licytacji
  isWinning Boolean  @default(false)
  isAutoBid Boolean  @default(false) // Czy to była automatyczna licytacja
  createdAt DateTime @default(now())

  auction   Auction  @relation(fields: [auctionId], references: [id], onDelete: Cascade)
  bidder    User     @relation(fields: [bidderId], references: [id])

  @@index([auctionId])
  @@index([bidderId])
  @@index([amount])
  @@index([createdAt])
  @@index([auctionId, amount])
  @@index([bidderId, createdAt])
  @@index([auctionId, maxBid]) // Dla szybkiego wyszukiwania auto-bidów
}
```

### Typy Wyliczeniowe (Enums)

```prisma
enum Role {
  USER_REGISTERED      // Zarejestrowany, podstawowy dostęp
  USER_EMAIL_VERIFIED  // Email zweryfikowany, dostęp do profilu
  USER_FULL_VERIFIED   // Pełna weryfikacja, pełny dostęp
  ADMIN                // Administrator systemu
}

enum AuctionStatus {
  ACTIVE    // Aktywna aukcja
  ENDED     // Zakończona aukcja
  CANCELLED // Anulowana aukcja
  PENDING   // Oczekuje na zatwierdzenie
}

enum AssetType {
  IMAGE   // Zdjęcie
  VIDEO   // Film
  DOCUMENT // Dokument
}

enum SettingType {
  STRING
  NUMBER
  BOOLEAN
  JSON
}
```

### Relacje Kluczowe

```
User (1) ↔ (N) Auction (seller)
User (1) ↔ (N) Bid (bidder)
User (1) ↔ (N) Review (reviewer/reviewee)
User (1) ↔ (N) Message
User (1) ↔ (N) Notification

Auction (1) ↔ (1) Pigeon
Auction (1) ↔ (N) Bid
Auction (1) ↔ (N) AuctionAsset
Auction (1) ↔ (N) Transaction

Bid (N) ↔ (1) Auction
Bid (N) ↔ (1) User

Transaction (1) ↔ (1) Auction
Transaction (1) ↔ (1) Buyer (User)
Transaction (1) ↔ (1) Seller (User)
```

### Optymalizacje Bazy Danych

#### Indeksy
- **User**: email, role, isActive, isPhoneVerified, isProfileVerified, createdAt
- **Auction**: isApproved, status, category, sellerId, startTime, endTime, currentPrice, createdAt, updatedAt
- **Bid**: auctionId, bidderId, amount, createdAt
- **Review**: revieweeId, rating, createdAt

#### Strategie Optymalizacji
1. **Connection Pooling** - Prisma automatycznie zarządza połączeniami
2. **Query Optimization** - Zoptymalizowane zapytania z odpowiednimi indeksami
3. **Caching** - Redis dla często używanych danych
4. **Pagination** - Cursor-based pagination dla list aukcji

---

## 🔐 System Autoryzacji

### Architektura Bezpieczeństwa

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Firebase Auth │───▶│  Next.js API    │───▶│   Prisma DB     │
│   (Client)      │    │  (Middleware)   │    │   (Server)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
   Token Validation      Role Checking        Data Access
   Session Management    Permission Control   User Context
```

### Poziomy Dostępu Użytkowników

#### 1. USER_REGISTERED
**Uprawnienia:**
- ✅ Rejestracja i logowanie
- ✅ Przeglądanie aukcji (publiczne)
- ✅ Przeglądanie profili hodowców
- ❌ Tworzenie aukcji
- ❌ Licytowanie
- ❌ Wysyłanie wiadomości

#### 2. USER_EMAIL_VERIFIED
**Wymagania:** Zweryfikowany adres email
**Dodatkowe uprawnienia:**
- ✅ Tworzenie profilu hodowcy
- ✅ Obserwowanie aukcji
- ✅ Dostęp do dashboard użytkownika

#### 3. USER_FULL_VERIFIED
**Wymagania:** Email + kompletny profil + weryfikacja telefonu
**Dodatkowe uprawnienia:**
- ✅ Tworzenie aukcji
- ✅ Licytowanie w aukcjach
- ✅ Wysyłanie wiadomości
- ✅ Oceny i recenzje
- ✅ Pełny dostęp do funkcji

#### 4. ADMIN
**Uprawnienia:** Pełny dostęp administracyjny
- ✅ Zarządzanie użytkownikami
- ✅ Moderacja aukcji
- ✅ Zarządzanie referencjami
- ✅ Statystyki systemu
- ✅ Konfiguracja systemu

### Flow Rejestracji i Weryfikacji

```mermaid
graph TD
    A[Rejestracja] --> B{Weryfikacja Email}
    B -->|Sukces| C[Uzupełnienie Profilu]
    B -->|Niepowodzenie| A
    C --> D{Weryfikacja Telefonu}
    D -->|Sukces| E[USER_FULL_VERIFIED]
    D -->|Niepowodzenie| C
    C --> F[USER_EMAIL_VERIFIED]
```

### Middleware Bezpieczeństwa

#### Firebase Authentication Middleware
```typescript
// lib/middleware/auth.ts
export async function requireFirebaseAuth(request: NextRequest) {
  const token = await getTokenFromRequest(request);
  if (!token) throw new Error('No authentication token');

  const decodedToken = await admin.auth().verifyIdToken(token);
  return decodedToken;
}
```

#### Role-based Access Control
```typescript
// lib/middleware/roles.ts
export function requireRole(requiredRole: Role) {
  return async (request: NextRequest) => {
    const user = await getCurrentUser(request);
    if (!user || !hasRequiredRole(user.role, requiredRole)) {
      throw new Error('Insufficient permissions');
    }
    return user;
  };
}
```

#### API Protection Layers
1. **Firebase Token Verification** - Walidacja JWT tokenu
2. **Role-based Authorization** - Sprawdzanie uprawnień
3. **Rate Limiting** - Ochrona przed nadużyciami
4. **Input Validation** - Walidacja danych wejściowych (Zod)
5. **CSRF Protection** - Ochrona przed atakami CSRF

### Mechanizmy Bezpieczeństwa

#### JWT Token Management
- **Access Tokens**: Krótkotrwałe (15 min), używane do API calls
- **Refresh Tokens**: Długotrwałe, przechowywane bezpiecznie
- **Token Rotation**: Automatyczna rotacja dla bezpieczeństwa

#### Session Security
- **Secure Cookies**: HttpOnly, Secure, SameSite
- **Session Timeout**: Automatyczne wylogowanie po bezczynności
- **Device Tracking**: Monitorowanie urządzeń użytkownika

#### Password Security
- **Firebase Auth**: Wbudowane mechanizmy bezpieczeństwa
- **Password Requirements**: Minimum 8 znaków, złożoność
- **Account Lockout**: Blokada po wielokrotnych nieudanych próbach

---

## 🔗 API Reference

### Struktura API

```
app/api/
├── auth/           # Autoryzacja i weryfikacja
├── auctions/       # Zarządzanie aukcjami
├── users/          # Zarządzanie użytkownikami
├── messages/       # Komunikacja
├── admin/          # Panel administracyjny
├── images/         # Upload obrazów
├── health/         # Health checks
└── metrics/        # Metryki Prometheus
```

### Authentication Endpoints

#### POST `/api/auth/register`
**Rejestracja nowego użytkownika**
```typescript
// Request
{
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

// Response
{
  user: User;
  message: string;
}
```

#### POST `/api/auth/verify-email`
**Weryfikacja adresu email**
```typescript
// Request
{
  token: string; // Token z linku weryfikacyjnego
}

// Response
{
  success: boolean;
  message: string;
}
```

#### POST `/api/auth/verify-sms`
**Weryfikacja numeru telefonu**
```typescript
// Request
{
  code: string; // 6-cyfrowy kod SMS
}

// Response
{
  success: boolean;
  message: string;
}
```

### Auction Endpoints

#### GET `/api/auctions`
**Lista aukcji z filtrowaniem**
```typescript
// Query Parameters
{
  status?: AuctionStatus;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'endTime' | 'currentPrice' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

// Response
{
  auctions: Auction[];
  totalCount: number;
  hasNextPage: boolean;
}
```

#### POST `/api/auctions/create`
**Tworzenie nowej aukcji**
```typescript
// Request
{
  title: string;
  description: string;
  category: string;
  pigeonId?: string;
  startingPrice: number;
  buyNowPrice?: number;
  reservePrice?: number;
  startTime: Date;
  endTime: Date;
  images?: File[];
  videos?: File[];
}

// Response
{
  auction: Auction;
  message: string;
}
```

#### POST `/api/auctions/bid`
**Składanie oferty w aukcji**
```typescript
// Request
{
  auctionId: string;
  amount: number;
  maxBid?: number; // Dla automatycznej licytacji
}

// Response
{
  bid: Bid;
  auction: Auction;
  message: string;
}
```

### User Management Endpoints

#### GET `/api/users/profile`
**Pobieranie profilu użytkownika**
```typescript
// Response
{
  user: User;
  auctions: Auction[];
  reviews: Review[];
  rating: UserRating;
}
```

#### PUT `/api/users/profile`
**Aktualizacja profilu użytkownika**
```typescript
// Request
{
  firstName?: string;
  lastName?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  phoneNumber?: string;
}

// Response
{
  user: User;
  message: string;
}
```

### Admin Endpoints

#### GET `/api/admin/users`
**Lista użytkowników (tylko admin)**
```typescript
// Query Parameters
{
  role?: Role;
  isActive?: boolean;
  search?: string;
  page?: number;
}

// Response
{
  users: User[];
  totalCount: number;
}
```

#### POST `/api/admin/references`
**Dodawanie referencji hodowcy**
```typescript
// Request
{
  breederName: string;
  location: string;
  experience: string;
  testimonial: string;
  rating: number;
  achievements: string;
}

// Response
{
  reference: Reference;
  message: string;
}
```

### Message Endpoints

#### GET `/api/messages`
**Lista konwersacji użytkownika**
```typescript
// Response
{
  conversations: Conversation[];
}
```

#### POST `/api/messages/start`
**Rozpoczęcie nowej konwersacji**
```typescript
// Request
{
  participant2Id: string;
  auctionId?: string; // Opcjonalne, jeśli w kontekście aukcji
  initialMessage: string;
}

// Response
{
  conversation: Conversation;
  message: Message;
}
```

### Utility Endpoints

#### GET `/api/health`
**Sprawdzenie zdrowia aplikacji**
```typescript
// Response
{
  status: 'ok' | 'error';
  timestamp: string;
  version: string;
  database: 'connected' | 'disconnected';
  redis?: 'connected' | 'disconnected';
}
```

#### GET `/api/metrics`
**Metryki dla Prometheus**
```
# HELP api_requests_total Total number of API requests
# TYPE api_requests_total counter
api_requests_total{method="GET",endpoint="/api/auctions",status="200"} 12543

# HELP auction_created_total Total number of auctions created
# TYPE auction_created_total counter
auction_created_total 156
```

### Error Handling

#### Standardowy Format Błędów
```typescript
// Error Response
{
  error: {
    code: string;        // Kod błędu (np. 'VALIDATION_ERROR')
    message: string;     // Czytelny opis błędu
    details?: any;       // Dodatkowe szczegóły
    timestamp: string;   // Czas wystąpienia błędu
  }
}
```

#### Kody Błędów
- `VALIDATION_ERROR` - Błąd walidacji danych
- `AUTHENTICATION_ERROR` - Błąd autoryzacji
- `AUTHORIZATION_ERROR` - Brak uprawnień
- `NOT_FOUND_ERROR` - Zasób nie znaleziony
- `CONFLICT_ERROR` - Konflikt danych
- `RATE_LIMIT_ERROR` - Przekroczony limit zapytań
- `INTERNAL_ERROR` - Błąd wewnętrzny serwera

---

## 🎨 Frontend Components

### Struktura Komponentów

```
app/components/
├── layout/              # Layout aplikacji
│   ├── UnifiedLayout.tsx
│   ├── Footer.tsx
│   ├── Header.tsx
│   └── Navigation.tsx
├── home/                # Strona główna
│   ├── HeroSection.tsx
│   ├── AuctionsPreview.tsx
│   └── ChampionsGallery.tsx
├── auctions/            # Komponenty aukcji
│   ├── AuctionsList.tsx
│   ├── AuctionCard.tsx
│   ├── AuctionDetails.tsx
│   ├── BidForm.tsx
│   └── AuctionFilters.tsx
├── auth/                # Autoryzacja
│   ├── AuthFlipCard.tsx
│   ├── LoginForm.tsx
│   ├── RegisterForm.tsx
│   └── VerificationForms.tsx
├── dashboard/           # Panel użytkownika
│   ├── DashboardLayout.tsx
│   ├── UserAuctions.tsx
│   ├── UserBids.tsx
│   └── Watchlist.tsx
├── admin/               # Panel administratora
│   ├── AdminLayout.tsx
│   ├── UserManagement.tsx
│   ├── AuctionModeration.tsx
│   └── SystemStats.tsx
├── ui/                  # Komponenty wielokrotnego użytku
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Modal.tsx
│   ├── Toast.tsx
│   ├── Loading.tsx
│   └── Pagination.tsx
├── providers/           # Context providers
│   ├── AuthProvider.tsx
│   ├── AuctionProvider.tsx
│   └── NotificationProvider.tsx
└── forms/               # Formularze
    ├── AuctionForm.tsx
    ├── ProfileForm.tsx
    └── ContactForm.tsx
```

### Kluczowe Komponenty

#### AuthFlipCard
**Interaktywny formularz rejestracji/logowania**
```tsx
// components/auth/AuthFlipCard.tsx
interface AuthFlipCardProps {
  initialMode?: 'login' | 'register';
  onSuccess?: (user: User) => void;
}

export function AuthFlipCard({ initialMode, onSuccess }: AuthFlipCardProps) {
  // Implementacja z animacjami Framer Motion
}
```

#### AuctionsList
**Lista aukcji z filtrowaniem i paginacją**
```tsx
// components/auctions/AuctionsList.tsx
interface AuctionsListProps {
  filters: AuctionFilters;
  onFilterChange: (filters: AuctionFilters) => void;
  sortOptions: SortOption[];
  onSortChange: (sort: SortOption) => void;
}

export function AuctionsList({ filters, onFilterChange, sortOptions, onSortChange }: AuctionsListProps) {
  // Implementacja z infinite scroll i caching
}
```

#### BidForm
**Formularz składania ofert**
```tsx
// components/auctions/BidForm.tsx
interface BidFormProps {
  auction: Auction;
  currentUser: User;
  onBidPlaced: (bid: Bid) => void;
  minIncrement: number;
}

export function BidForm({ auction, currentUser, onBidPlaced, minIncrement }: BidFormProps) {
  // Implementacja z walidacją i auto-bidding
}
```

### UI/UX Features

#### Responsive Design
- **Mobile-first approach** z Tailwind CSS
- **Breakpoint system**: sm, md, lg, xl, 2xl
- **Touch-friendly** interfejsy na urządzeniach mobilnych

#### Animacje i Mikrointerakcje
```tsx
// Przykład animacji z Framer Motion
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  <AuctionCard auction={auction} />
</motion.div>
```

#### Accessibility (WCAG 2.1 AA)
- **Semantic HTML** - odpowiednie tagi HTML
- **ARIA labels** - etykiety dla czytników ekranowych
- **Keyboard navigation** - nawigacja klawiszami
- **Color contrast** - odpowiedni kontrast kolorów
- **Focus management** - zarządzanie focusem

#### PWA Features
- **Service Worker** - cache'owanie offline
- **Web App Manifest** - instalacja jako aplikacja
- **Push Notifications** - powiadomienia push
- **Background Sync** - synchronizacja w tle

### State Management

#### React Query (TanStack Query)
```tsx
// hooks/useAuctions.ts
export function useAuctions(filters: AuctionFilters) {
  return useQuery({
    queryKey: ['auctions', filters],
    queryFn: () => fetchAuctions(filters),
    staleTime: 5 * 60 * 1000, // 5 minut
    cacheTime: 10 * 60 * 1000, // 10 minut
  });
}
```

#### Zustand Stores
```tsx
// stores/authStore.ts
interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Implementacja store
}));
```

---

## ⚙️ Konfiguracja i Setup

### Wymagania Systemowe

#### Minimalne Wymagania
- **Node.js**: 18.0.0 lub nowszy
- **PostgreSQL**: 14.0 lub nowszy
- **Redis**: 7.0 lub nowszy (opcjonalny)
- **RAM**: 2GB
- **Dysk**: 5GB wolnego miejsca

#### Zalecane Wymagania Produkcyjne
- **Node.js**: 20.x LTS
- **PostgreSQL**: 15.x
- **Redis**: 7.x
- **RAM**: 4GB+
- **CPU**: 2+ cores
- **Dysk**: SSD 20GB+

### Instalacja i Konfiguracja

#### 1. Klonowanie Repozytorium
```bash
git clone https://github.com/golebiepalkamtm-ship-it/ostateczne.git
cd ostateczne
```

#### 2. Instalacja Zależności
```bash
npm install
```

#### 3. Konfiguracja Bazy Danych

**Utworzenie bazy danych PostgreSQL:**
```sql
CREATE DATABASE palka_mtm;
CREATE USER palka_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE palka_mtm TO palka_user;
```

**Konfiguracja zmiennych środowiskowych:**
```env
# .env.local
DATABASE_URL="postgresql://palka_user:secure_password@localhost:5432/palka_mtm"
```

#### 4. Migracje Bazy Danych
```bash
# Generowanie Prisma klienta
npm run db:generate

# Uruchomienie migracji
npm run db:migrate

# Seed danych (opcjonalnie)
npm run db:seed
```

#### 5. Konfiguracja Firebase

**Pobranie credentials:**
1. Przejdź do [Firebase Console](https://console.firebase.google.com/)
2. Wybierz projekt `m-t-m-62972`
3. Settings → Service Accounts → Generate new private key
4. Zapisz plik jako `firebase-key.json`

**Konfiguracja zmiennych:**
```env
# Firebase Client (Publiczne)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCrGcWptUnRgcNnAQl01g5RjPdMfZ2tJCA
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=m-t-m-62972.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=m-t-m-62972
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=m-t-m-62972.appspot.com

# Firebase Admin (Prywatne)
FIREBASE_PROJECT_ID=m-t-m-62972
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@m-t-m-62972.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

#### 6. Konfiguracja NextAuth
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-here
```

#### 7. Uruchomienie Aplikacji
```bash
# Development
npm run dev:windows

# Production build
npm run build
npm start
```

### Konfiguracja Produkcyjna

#### Environment Variables
```env
# Produkcja
NODE_ENV=production
NEXT_PUBLIC_BASE_URL=https://palkamtm.pl

# Bezpieczeństwo
NEXTAUTH_SECRET=<secure-random-string>

# Baza danych (produkcyjna)
DATABASE_URL=postgresql://user:password@prod-host:5432/prod-db

# Redis (cache)
REDIS_URL=redis://prod-redis:6379

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_AUTH_TOKEN=your-sentry-auth-token

# Email
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-app-password
```

#### Next.js Configuration
```javascript
// next.config.cjs
const config = {
  // Produkcyjne optymalizacje
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // PWA
  experimental: {
    scrollRestoration: true,
  },

  // Bezpieczeństwo
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};
```

### Docker Setup

#### Dockerfile
```dockerfile
FROM node:20-alpine AS base

# Instalacja zależności
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Build aplikacji
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]
```

#### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/palka_mtm
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=palka_mtm
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

---

## 🚀 Deployment

### Strategie Deploymentu

#### 1. Vercel (Zalecane)
**Najlepszy wybór dla Next.js aplikacji**

**Zalety:**
- ✅ Natywna obsługa Next.js
- ✅ Automatyczne skalowanie
- ✅ Wbudowane CDN
- ✅ Łatwa konfiguracja CI/CD

**Konfiguracja:**
```javascript
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["fra1"],
  "functions": {
    "app/api/**/*.js": {
      "maxDuration": 30
    }
  }
}
```

#### 2. Firebase App Hosting
**Dobry wybór jeśli używasz Firebase ecosystem**

**Konfiguracja:**
```yaml
# .apphosting.production.yaml
runConfig:
  environmentVariables:
    NODE_ENV: production
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
    NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}

  secrets:
    - key: DATABASE_URL
      value: postgresql://...
    - key: NEXTAUTH_SECRET
      value: ...

  cpu: 2
  memoryMiB: 4096
  concurrency: 100
```

#### 3. Docker + Cloud Run
**Dla pełnej kontroli nad infrastrukturą**

```yaml
# cloud-run.yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: palka-mtm
spec:
  template:
    spec:
      containers:
      - image: gcr.io/project-id/palka-mtm:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: DATABASE_URL
```

### CI/CD Pipeline

#### GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm run deploy:vercel
```

### Environment Management

#### Environment Variables Structure
```
├── .env.local          # Development (nie commitować)
├── .env.production     # Produkcja
├── .env.staging        # Staging
└── .env.example        # Szablon (commitować)
```

#### Secrets Management
- **Vercel**: Environment Variables w dashboardzie
- **Firebase**: Secret Manager
- **Docker**: Docker secrets lub external files
- **Cloud**: Cloud Secret Manager

### Monitoring Deploymentu

#### Health Checks
```typescript
// app/api/health/route.ts
export async function GET() {
  const dbStatus = await checkDatabase();
  const redisStatus = await checkRedis();

  const status = dbStatus && redisStatus ? 'ok' : 'error';

  return Response.json({
    status,
    timestamp: new Date().toISOString(),
    services: {
      database: dbStatus ? 'healthy' : 'unhealthy',
      redis: redisStatus ? 'healthy' : 'unhealthy',
    },
  });
}
```

#### Deployment Verification
```bash
# Sprawdzenie po deployment
curl https://palkamtm.pl/api/health
curl https://palkamtm.pl/api/metrics

# Sprawdzenie logów
vercel logs --follow
firebase functions:log
```

---

## 🧪 Testowanie

### Strategia Testowania

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Unit Tests    │    │ Integration     │    │   E2E Tests     │
│   (Vitest)      │───▶│   Tests         │───▶│   (Playwright)  │
│                 │    │   (Vitest)      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
   Component Logic      API Integration        User Flows
   Business Logic       Database Access        UI Interactions
   Utilities            External Services      Cross-browser
```

### Unit Tests (Vitest)

#### Konfiguracja
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./__tests__/setup.ts'],
    globals: true,
  },
});
```

#### Przykład Testu Komponentu
```typescript
// __tests__/components/AuctionCard.test.tsx
import { render, screen } from '@testing-library/react';
import { AuctionCard } from '@/components/auctions/AuctionCard';

const mockAuction = {
  id: '1',
  title: 'Mistrz Sprintu',
  currentPrice: 1500,
  endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
};

describe('AuctionCard', () => {
  it('renders auction information correctly', () => {
    render(<AuctionCard auction={mockAuction} />);

    expect(screen.getByText('Mistrz Sprintu')).toBeInTheDocument();
    expect(screen.getByText('1 500 zł')).toBeInTheDocument();
  });

  it('shows time remaining', () => {
    render(<AuctionCard auction={mockAuction} />);

    expect(screen.getByText(/pozostało/)).toBeInTheDocument();
  });
});
```

#### Przykład Testu API
```typescript
// __tests__/api/auctions.test.ts
import { createMocks } from 'node-mocks-http';
import handler from '@/app/api/auctions/route';

describe('/api/auctions', () => {
  it('returns auctions list', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(Array.isArray(data.auctions)).toBe(true);
  });
});
```

### E2E Tests (Playwright)

#### Konfiguracja
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
```

#### Przykład Testu E2E
```typescript
// e2e/auth.e2e.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('user can register and login', async ({ page }) => {
    // Rejestracja
    await page.goto('/auth');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Hasło').fill('TestPassword123!');
    await page.getByRole('button', { name: 'Zarejestruj się' }).click();

    // Weryfikacja email (symulacja)
    await page.waitForURL('**/dashboard');

    // Sprawdzenie czy użytkownik jest zalogowany
    await expect(page.getByText('Witaj w systemie!')).toBeVisible();
  });

  test('user can create auction after verification', async ({ page }) => {
    // Logowanie
    await page.goto('/auth');
    await page.getByLabel('Email').fill('verified@example.com');
    await page.getByLabel('Hasło').fill('TestPassword123!');
    await page.getByRole('button', { name: 'Zaloguj się' }).click();

    // Przejście do tworzenia aukcji
    await page.getByRole('link', { name: 'Dodaj aukcję' }).click();

    // Wypełnienie formularza
    await page.getByLabel('Tytuł').fill('Test Auction');
    await page.getByLabel('Cena początkowa').fill('1000');
    await page.getByRole('button', { name: 'Utwórz aukcję' }).click();

    // Sprawdzenie sukcesu
    await expect(page.getByText('Aukcja została utworzona')).toBeVisible();
  });
});
```

### Testy Integracyjne

#### Database Tests
```typescript
// __tests__/integration/database.test.ts
import { prisma } from '@/lib/prisma';

describe('Database Integration', () => {
  beforeEach(async () => {
    await prisma.auction.deleteMany();
    await prisma.user.deleteMany();
  });

  it('creates auction with valid data', async () => {
    const user = await prisma.user.create({
      data: {
        firebaseUid: 'test-uid',
        email: 'test@example.com',
        role: 'USER_FULL_VERIFIED',
      },
    });

    const auction = await prisma.auction.create({
      data: {
        title: 'Test Auction',
        description: 'Test Description',
        category: 'Sprint',
        sellerId: user.id,
        startingPrice: 1000,
        currentPrice: 1000,
        startTime: new Date(),
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    expect(auction.id).toBeDefined();
    expect(auction.title).toBe('Test Auction');
  });
});
```

### Test Coverage

#### Konfiguracja Coverage
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '__tests__/',
        '**/*.d.ts',
        '**/*.config.*',
        'lib/stubs/',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
});
```

#### Uruchamianie Testów
```bash
# Wszystkie testy
npm test

# Z coverage
npm run test:coverage

# Watch mode
npm run test:watch

# E2E tests
npx playwright test

# E2E z UI
npx playwright test --ui
```

### Test Data Management

#### Factory Pattern dla Testów
```typescript
// __tests__/factories/userFactory.ts
export function createUser(overrides: Partial<User> = {}): User {
  return {
    id: 'test-user-id',
    firebaseUid: 'test-firebase-uid',
    email: 'test@example.com',
    role: 'USER_REGISTERED',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}
```

#### Seed Data dla E2E
```typescript
// e2e/helpers/seedData.ts
export async function seedTestData() {
  const user = await prisma.user.create({
    data: createUser({ role: 'USER_FULL_VERIFIED' }),
  });

  const auction = await prisma.auction.create({
    data: createAuction({ sellerId: user.id }),
  });

  return { user, auction };
}
```

---

## 📊 Monitoring i Obserwowalność

### Architektura Monitoringu

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Application   │───▶│   Sentry        │───▶│   Error Logs    │
│   (Next.js)     │    │   (Errors)      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Prometheus    │    │   Winston       │    │   Analytics     │
│   (Metrics)     │    │   (Logs)        │    │   (Usage)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Sentry (Error Tracking)

#### Konfiguracja
```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,

  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
```

```typescript
// sentry.server.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,

  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Prisma({ useMongoClient: false }),
  ],
});
```

#### Error Boundary
```tsx
// components/ErrorBoundary.tsx
import * as Sentry from '@sentry/nextjs';

export class ErrorBoundary extends Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });
  }

  render() {
    // Implementacja fallback UI
  }
}
```

### Prometheus Metrics

#### Konfiguracja
```typescript
// lib/metrics.ts
import promClient from 'prom-client';

const register = new promClient.Registry();

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
});

register.registerMetric(httpRequestDuration);

export { register, httpRequestDuration };
```

#### API Metrics Endpoint
```typescript
// app/api/metrics/route.ts
import { register } from '@/lib/metrics';

export async function GET() {
  const metrics = await register.metrics();
  return new Response(metrics, {
    headers: {
      'Content-Type': register.contentType,
    },
  });
}
```

#### Middleware Metrics
```typescript
// middleware/metrics.ts
import { httpRequestDuration } from '@/lib/metrics';

export function withMetrics(handler: NextApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const start = Date.now();

    try {
      await handler(req, res);
    } finally {
      const duration = (Date.now() - start) / 1000;

      httpRequestDuration
        .labels(req.method || 'UNKNOWN', req.url || 'UNKNOWN', res.statusCode.toString())
        .observe(duration);
    }
  };
}
```

### Winston Logger

#### Konfiguracja
```typescript
// lib/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),

  defaultMeta: { service: 'palka-mtm' },

  transports: [
    // Console transport dla development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),

    // File transport dla production
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),

    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

export { logger };
```

#### Użycie Logger'a
```typescript
// W API routes
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    logger.info('Auction created', { auctionId: data.id, userId: data.sellerId });

    // Logika biznesowa

    return Response.json({ success: true });
  } catch (error) {
    logger.error('Failed to create auction', {
      error: error.message,
      stack: error.stack,
      userId: data?.sellerId,
    });

    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### Custom Metrics

#### Business Metrics
```typescript
// lib/metrics/business.ts
import promClient from 'prom-client';

const auctionsCreated = new promClient.Counter({
  name: 'auctions_created_total',
  help: 'Total number of auctions created',
  labelNames: ['category', 'user_type'],
});

const bidsPlaced = new promClient.Counter({
  name: 'bids_placed_total',
  help: 'Total number of bids placed',
  labelNames: ['auction_category'],
});

const userRegistrations = new promClient.Counter({
  name: 'user_registrations_total',
  help: 'Total number of user registrations',
  labelNames: ['verification_status'],
});

export { auctionsCreated, bidsPlaced, userRegistrations };
```

#### Performance Metrics
```typescript
// lib/metrics/performance.ts
const auctionLoadTime = new promClient.Histogram({
  name: 'auction_load_duration_seconds',
  help: 'Time taken to load auction details',
  buckets: [0.1, 0.5, 1, 2, 5],
});

const apiResponseTime = new promClient.Histogram({
  name: 'api_response_time_seconds',
  help: 'API response time by endpoint',
  labelNames: ['endpoint', 'method'],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

export { auctionLoadTime, apiResponseTime };
```

### Alerting

#### Prometheus Alert Rules
```yaml
# alert_rules.yml
groups:
  - name: palka-mtm-alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status_code=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }}%"

      - alert: AuctionCreationFailed
        expr: increase(auction_creation_errors_total[5m]) > 5
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "Auction creation failures"
          description: "Failed to create {{ $value }} auctions in 5 minutes"
```

### Dashboard (Grafana)

#### Key Metrics Dashboard
- **Error Rate**: Procent błędnych żądań
- **Response Time**: Czas odpowiedzi API
- **Active Users**: Liczba aktywnych użytkowników
- **Auction Activity**: Statystyki aukcji i ofert
- **Database Performance**: Czas wykonania zapytań
- **System Resources**: CPU, pamięć, dysk

---

## 🔒 Bezpieczeństwo

### Architektura Bezpieczeństwa

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Side   │    │   API Layer     │    │   Data Layer    │
│   (Browser)     │───▶│   (Next.js)     │───▶│   (Database)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
   Input Validation      Authentication       Access Control
   XSS Protection         Authorization        Data Sanitization
   CSRF Protection        Rate Limiting        Encryption
```

### Content Security Policy (CSP)

#### Next.js CSP Configuration
```javascript
// next.config.cjs
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'unsafe-hashes' https://js.sentry-cdn.com",
  "script-src-attr 'unsafe-hashes'",
  "script-src-elem 'self' 'unsafe-inline' https://js.sentry-cdn.com",
  "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
  "style-src-elem 'self' 'unsafe-inline' fonts.googleapis.com",
  "img-src 'self' data: blob: https://storage.googleapis.com https://firebasestorage.googleapis.com",
  "connect-src 'self' https://sentry.io https://pigeon-4fba2.firebaseapp.com https://storage.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "worker-src 'self' blob:",
  "frame-src 'self' https://www.youtube.com",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
].join('; ');

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), fullscreen=self' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
        ],
      },
    ];
  },
};
```

### Input Validation & Sanitization

#### Zod Schemas
```typescript
// lib/validations/auction.ts
import { z } from 'zod';

export const createAuctionSchema = z.object({
  title: z.string()
    .min(3, 'Tytuł musi mieć minimum 3 znaki')
    .max(100, 'Tytuł nie może przekraczać 100 znaków')
    .regex(/^[^<>&"']*$/, 'Tytuł zawiera niedozwolone znaki'),

  description: z.string()
    .min(10, 'Opis musi mieć minimum 10 znaków')
    .max(2000, 'Opis nie może przekraczać 2000 znaków'),

  category: z.enum(['Sprint', 'Middle', 'Long', 'Pigeon'], {
    errorMap: () => ({ message: 'Nieprawidłowa kategoria' }),
  }),

  startingPrice: z.number()
    .min(1, 'Cena początkowa musi być większa od 0')
    .max(1000000, 'Cena początkowa nie może przekraczać 1,000,000 zł'),

  buyNowPrice: z.number()
    .optional()
    .refine((val, ctx) => {
      if (val && val <= ctx.parent.startingPrice) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Cena kup teraz musi być wyższa od ceny początkowej',
        });
      }
      return true;
    }),

  startTime: z.date()
    .min(new Date(), 'Czas rozpoczęcia nie może być w przeszłości'),

  endTime: z.date()
    .refine((val, ctx) => {
      const minDuration = 60 * 60 * 1000; // 1 godzina
      if (val.getTime() - ctx.parent.startTime.getTime() < minDuration) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Aukcja musi trwać minimum 1 godzinę',
        });
      }
      return true;
    }),
});

export type CreateAuctionInput = z.infer<typeof createAuctionSchema>;
```

#### API Input Validation
```typescript
// lib/api/validation.ts
import { z } from 'zod';

export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, errors: result.error };
  }
}

// Użycie w API route
export async function POST(request: Request) {
  const body = await request.json();

  const validation = validateInput(createAuctionSchema, body);
  if (!validation.success) {
    return Response.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Dane wejściowe są nieprawidłowe',
          details: validation.errors.format(),
        },
      },
      { status: 400 }
    );
  }

  // Użyj validation.data do dalszego przetwarzania
}
```

### Rate Limiting

#### API Rate Limiting
```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { redis } from '@/lib/redis';

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 h'), // 100 requests per hour
  analytics: true,
});

export async function rateLimit(identifier: string) {
  const { success, limit, reset, remaining } = await ratelimit.limit(identifier);

  return {
    success,
    limit,
    reset: new Date(reset),
    remaining,
  };
}

// Middleware
export function withRateLimit(handler: NextApiHandler, options?: { limit?: number; window?: string }) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const identifier = req.headers['x-forwarded-for'] || 'anonymous';
    const { success, limit, reset, remaining } = await rateLimit(identifier);

    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', reset.getTime());

    if (!success) {
      return res.status(429).json({
        error: {
          code: 'RATE_LIMIT_ERROR',
          message: 'Przekroczono limit zapytań',
          retryAfter: reset.getTime(),
        },
      });
    }

    return handler(req, res);
  };
}
```

### Authentication & Authorization

#### Firebase Auth Security
```typescript
// lib/auth/firebase.ts
import { auth } from '@/lib/firebase-admin';

export async function verifyFirebaseToken(token: string) {
  try {
    const decodedToken = await auth.verifyIdToken(token, true); // Check revoked

    // Dodatkowe sprawdzenia bezpieczeństwa
    if (decodedToken.exp * 1000 < Date.now()) {
      throw new Error('Token expired');
    }

    // Sprawdź czy użytkownik jest aktywny w bazie danych
    const user = await prisma.user.findUnique({
      where: { firebaseUid: decodedToken.uid },
      select: { isActive: true, role: true },
    });

    if (!user || !user.isActive) {
      throw new Error('User account disabled');
    }

    return {
      ...decodedToken,
      role: user.role,
    };
  } catch (error) {
    throw new Error('Invalid authentication token');
  }
}
```

#### Role-based Access Control
```typescript
// lib/auth/permissions.ts
export enum Permission {
  CREATE_AUCTION = 'create_auction',
  PLACE_BID = 'place_bid',
  SEND_MESSAGE = 'send_message',
  VIEW_ADMIN_PANEL = 'view_admin_panel',
  MANAGE_USERS = 'manage_users',
}

const rolePermissions: Record<Role, Permission[]> = {
  USER_REGISTERED: [],
  USER_EMAIL_VERIFIED: [Permission.SEND_MESSAGE],
  USER_FULL_VERIFIED: [
    Permission.CREATE_AUCTION,
    Permission.PLACE_BID,
    Permission.SEND_MESSAGE,
  ],
  ADMIN: [
    Permission.CREATE_AUCTION,
    Permission.PLACE_BID,
    Permission.SEND_MESSAGE,
    Permission.VIEW_ADMIN_PANEL,
    Permission.MANAGE_USERS,
  ],
};

export function hasPermission(userRole: Role, permission: Permission): boolean {
  return rolePermissions[userRole]?.includes(permission) ?? false;
}

export function requirePermission(permission: Permission) {
  return (user: { role: Role }) => {
    if (!hasPermission(user.role, permission)) {
      throw new Error(`Missing permission: ${permission}`);
    }
  };
}
```

### Data Protection

#### Database Encryption
```typescript
// lib/encryption.ts
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

export class EncryptionService {
  private key: Buffer;

  constructor(secretKey: string) {
    this.key = crypto.scryptSync(secretKey, 'salt', KEY_LENGTH);
  }

  encrypt(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipher(ALGORITHM, this.key);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  decrypt(encryptedText: string): string {
    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = crypto.createDecipher(ALGORITHM, this.key);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}

// Użycie dla wrażliwych danych
const encryption = new EncryptionService(process.env.ENCRYPTION_KEY);

const encryptedPhone = encryption.encrypt(user.phoneNumber);
const decryptedPhone = encryption.decrypt(encryptedPhone);
```

#### Secure Headers
```javascript
// next.config.cjs - rozszerzone nagłówki bezpieczeństwa
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        // Standard security headers
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), fullscreen=self' },
        { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },

        // CSP (Content Security Policy)
        { key: 'Content-Security-Policy', value: csp },

        // Additional security headers
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        { key: 'X-DNS-Prefetch-Control', value: 'on' },
        { key: 'Cross-Origin-Embedder-Policy', value: 'credentialless' },
        { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
        { key: 'Cross-Origin-Resource-Policy', value: 'cross-origin' },
      ],
    },
  ];
}
```

### Security Monitoring

#### Suspicious Activity Detection
```typescript
// lib/security/monitoring.ts
import { logger } from '@/lib/logger';

export class SecurityMonitor {
  private suspiciousActivities = new Map<string, number>();

  async logSuspiciousActivity(
    userId: string,
    activity: string,
    details: Record<string, any>
  ) {
    const key = `${userId}:${activity}`;
    const count = (this.suspiciousActivities.get(key) || 0) + 1;

    this.suspiciousActivities.set(key, count);

    logger.warn('Suspicious activity detected', {
      userId,
      activity,
      count,
      details,
      timestamp: new Date().toISOString(),
    });

    // Alert if threshold exceeded
    if (count >= 5) {
      await this.alertSecurityTeam(userId, activity, count);
    }
  }

  private async alertSecurityTeam(
    userId: string,
    activity: string,
    count: number
  ) {
    // Implementacja wysyłania alertów (email, Slack, itp.)
    logger.error('Security alert triggered', {
      userId,
      activity,
      count,
      severity: 'HIGH',
    });
  }
}

export const securityMonitor = new SecurityMonitor();
```

#### Failed Login Tracking
```typescript
// lib/auth/login-attempts.ts
import { redis } from '@/lib/redis';

const FAILED_LOGIN_KEY = 'failed_login';
const LOCKOUT_DURATION = 15 * 60; // 15 minut
const MAX_ATTEMPTS = 5;

export class LoginAttemptManager {
  async recordFailedAttempt(email: string): Promise<boolean> {
    const key = `${FAILED_LOGIN_KEY}:${email}`;
    const attempts = await redis.incr(key);

    if (attempts === 1) {
      await redis.expire(key, LOCKOUT_DURATION);
    }

    if (attempts >= MAX_ATTEMPTS) {
      await securityMonitor.logSuspiciousActivity(
        email,
        'multiple_failed_logins',
        { attempts, locked: true }
      );
      return true; // Account locked
    }

    return false;
  }

  async isLocked(email: string): Promise<boolean> {
    const key = `${FAILED_LOGIN_KEY}:${email}`;
    const attempts = await redis.get(key);
    return parseInt(attempts || '0') >= MAX_ATTEMPTS;
  }

  async clearFailedAttempts(email: string): Promise<void> {
    const key = `${FAILED_LOGIN_KEY}:${email}`;
    await redis.del(key);
  }
}

export const loginAttemptManager = new LoginAttemptManager();
```

---

## ⚡ Optymalizacja Wydajności

### Frontend Performance

#### Next.js Optimizations

**App Router Benefits:**
- Server Components - Mniej JavaScript po stronie klienta
- Streaming SSR - Progresywne ładowanie strony
- Parallel Routes - Równoległe ładowanie segmentów

**Image Optimization:**
```typescript
// components/OptimizedImage.tsx
import Image from 'next/image';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  quality?: number;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  quality = 75
}: OptimizedImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      quality={quality}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."
    />
  );
}
```

#### Code Splitting & Lazy Loading
```tsx
// components/LazyAuctionList.tsx
import { lazy, Suspense } from 'react';

const AuctionList = lazy(() => import('./AuctionList'));

export function LazyAuctionList() {
  return (
    <Suspense fallback={<AuctionListSkeleton />}>
      <AuctionList />
    </Suspense>
  );
}
```

#### Bundle Analysis
```javascript
// next.config.cjs
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // ... inne konfiguracje
});
```

Uruchomienie analizy:
```bash
ANALYZE=true npm run build
```

### Backend Performance

#### Database Optimizations

**Prisma Optimizations:**
```typescript
// Optymalne zapytania z select i include
const auctions = await prisma.auction.findMany({
  select: {
    id: true,
    title: true,
    currentPrice: true,
    endTime: true,
    seller: {
      select: {
        id: true,
        firstName: true,
        lastName: true,
        rating: true,
      },
    },
  },
  where: {
    status: 'ACTIVE',
    endTime: {
      gt: new Date(),
    },
  },
  orderBy: {
    endTime: 'asc',
  },
  take: 20,
});
```

**Connection Pooling:**
```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

#### Caching Strategy

**Redis Caching:**
```typescript
// lib/cache.ts
import { redis } from '@/lib/redis';

export class CacheService {
  private prefix = 'palka_mtm';

  async get<T>(key: string): Promise<T | null> {
    const data = await redis.get(`${this.prefix}:${key}`);
    return data ? JSON.parse(data) : null;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttl) {
      await redis.setex(`${this.prefix}:${key}`, ttl, serialized);
    } else {
      await redis.set(`${this.prefix}:${key}`, serialized);
    }
  }

  async invalidate(pattern: string): Promise<void> {
    const keys = await redis.keys(`${this.prefix}:${pattern}`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
}

export const cache = new CacheService();
```

**API Response Caching:**
```typescript
// lib/api/cached-response.ts
import { cache } from '@/lib/cache';

export function withCache<T>(
  handler: () => Promise<T>,
  cacheKey: string,
  ttl: number = 300 // 5 minut
) {
  return async (): Promise<T> => {
    // Sprawdź cache
    const cached = await cache.get<T>(cacheKey);
    if (cached) {
      return cached;
    }

    // Wykonaj handler
    const result = await handler();

    // Zapisz w cache
    await cache.set(cacheKey, result, ttl);

    return result;
  };
}

// Użycie
export async function getAuctions(filters: AuctionFilters) {
  const cacheKey = `auctions:${JSON.stringify(filters)}`;

  return withCache(
    () => prisma.auction.findMany({ where: filters }),
    cacheKey,
    300
  )();
}
```

### CDN & Static Assets

#### Firebase Storage Optimization
```typescript
// lib/storage/firebase.ts
import { getStorage, ref, getDownloadURL, getMetadata } from 'firebase/storage';

export class OptimizedStorageService {
  async getOptimizedUrl(path: string, options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpg' | 'png';
  } = {}): Promise<string> {
    const storage = getStorage();
    const fileRef = ref(storage, path);

    // Sprawdź czy to obraz
    const metadata = await getMetadata(fileRef);
    if (!metadata.contentType?.startsWith('image/')) {
      return getDownloadURL(fileRef);
    }

    // Dla obrazów, zastosuj optymalizację
    const { width, height, quality = 80, format = 'webp' } = options;

    // Użyj ImageKit, Cloudinary lub podobnego serwisu
    // Tutaj przykładowa implementacja z ImageKit
    const baseUrl = await getDownloadURL(fileRef);
    const params = new URLSearchParams({
      w: width?.toString(),
      h: height?.toString(),
      q: quality.toString(),
      f: format,
    });

    return `${baseUrl}?${params}`;
  }
}
```

### Performance Monitoring

#### Core Web Vitals
```typescript
// lib/performance/web-vitals.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

export function reportWebVitals(metric: any) {
  // Wyślij do analytics
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', metric.name, {
      event_category: 'Web Vitals',
      event_label: metric.id,
      value: Math.round(metric.value),
      custom_map: { metric_value: metric.value },
    });
  }

  // Wyślij do Sentry
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    // Implementacja wysyłania do Sentry
  }
}

// Inicjalizacja w _app.tsx
if (typeof window !== 'undefined') {
  getCLS(reportWebVitals);
  getFID(reportWebVitals);
  getFCP(reportWebVitals);
  getLCP(reportWebVitals);
  getTTFB(reportWebVitals);
}
```

#### Database Performance Monitoring
```typescript
// lib/performance/db-monitoring.ts
import { prisma } from '@/lib/prisma';

export class DatabaseMonitor {
  async logSlowQuery(query: string, duration: number, params?: any) {
    if (duration > 1000) { // Log queries slower than 1s
      logger.warn('Slow database query detected', {
        query: query.substring(0, 500), // Truncate long queries
        duration,
        params,
        timestamp: new Date().toISOString(),
      });

      // Increment Prometheus metric
      slowQueriesTotal.inc({
        table: this.extractTableName(query),
      });
    }
  }

  private extractTableName(query: string): string {
    const match = query.match(/FROM\s+(\w+)/i);
    return match ? match[1] : 'unknown';
  }
}

export const dbMonitor = new DatabaseMonitor();

// Middleware dla Prisma
prisma.$use(async (params, next) => {
  const start = Date.now();
  const result = await next(params);
  const duration = Date.now() - start;

  dbMonitor.logSlowQuery(params.model || 'unknown', duration, params.args);

  return result;
});
```

### Scalability Considerations

#### Horizontal Scaling
- **Stateless API**: Wszystkie instancje identyczne
- **Shared Database**: PostgreSQL z connection pooling
- **Redis Cluster**: Rozproszony cache
- **CDN**: Firebase Storage dla mediów

#### Vertical Scaling
- **Memory Optimization**: Efektywne zarządzanie pamięcią
- **CPU Optimization**: Asynchroniczne operacje
- **I/O Optimization**: Batch operations i pagination

#### Auto-scaling Triggers
- CPU utilization > 70%
- Memory usage > 80%
- Request queue length > 100
- Response time > 2s

---

## 🔧 Rozwój i Maintenance

### Code Quality Standards

#### ESLint Configuration
```javascript
// .eslintrc.json
{
  "extends": [
    "next/core-web-vitals",
    "eslint:recommended",
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint", "prettier"],
  "rules": {
    "prettier/prettier": "error",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/explicit-function-return-type": "off",
    "react-hooks/exhaustive-deps": "warn",
    "no-console": process.env.NODE_ENV === "production" ? "error" : "warn"
  },
  "overrides": [
    {
      "files": ["__tests__/**/*.ts", "__tests__/**/*.tsx"],
      "env": {
        "jest": true
      },
      "rules": {
        "@typescript-eslint/no-explicit-any": "off"
      }
    }
  ]
}
```

#### Prettier Configuration
```javascript
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid"
}
```

#### Husky Git Hooks
```bash
npm install --save-dev husky lint-staged

# Inicjalizacja
npx husky install

# Pre-commit hook
npx husky add .husky/pre-commit "npx lint-staged"
```

```javascript
// package.json
{
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,css,md}": [
      "prettier --write"
    ]
  }
}
```

### Version Control Strategy

#### Git Flow
```
main (produkcja)
├── develop (główny branch development)
│   ├── feature/authentication-improvements
│   ├── feature/auction-filters
│   └── bugfix/bid-validation
├── release/v1.2.0
└── hotfix/security-patch
```

#### Commit Convention
```
type(scope): description

Types:
- feat: nowa funkcjonalność
- fix: poprawka błędu
- docs: zmiana dokumentacji
- style: formatowanie kodu
- refactor: refaktoryzacja
- test: dodanie/usunięcie testów
- chore: zmiana konfiguracji

Examples:
- feat(auth): add phone verification
- fix(auction): resolve bidding race condition
- docs(api): update auction endpoints
```

### CI/CD Pipeline

#### GitHub Actions Workflow
```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run type check
        run: npx tsc --noEmit

      - name: Run tests
        run: npm run test:ci
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

      - name: Build
        run: npm run build

  e2e:
    runs-on: ubuntu-latest
    needs: test

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install

      - name: Run E2E tests
        run: npx playwright test
        env:
          BASE_URL: http://localhost:3000
```

### Release Management

#### Semantic Versioning
```
MAJOR.MINOR.PATCH

- MAJOR: Breaking changes
- MINOR: New features (backward compatible)
- PATCH: Bug fixes (backward compatible)
```

#### Release Process
```bash
# 1. Update version
npm version minor

# 2. Update changelog
npx standard-changelog

# 3. Create release branch
git checkout -b release/v1.2.0

# 4. Final testing
npm run test
npm run test:e2e

# 5. Merge to main
git checkout main
git merge release/v1.2.0

# 6. Create GitHub release
git tag v1.2.0
git push origin v1.2.0

# 7. Deploy to production
npm run deploy:production
```

### Documentation Maintenance

#### API Documentation
```typescript
// lib/docs/api-docs.ts
interface EndpointDoc {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  description: string;
  authRequired: boolean;
  body?: object;
  response?: object;
  errors?: string[];
}

const apiDocs: EndpointDoc[] = [
  {
    path: '/api/auctions',
    method: 'GET',
    description: 'Lista aukcji z filtrowaniem',
    authRequired: false,
    response: {
      auctions: 'Auction[]',
      totalCount: 'number',
      hasNextPage: 'boolean',
    },
  },
  // ... więcej endpointów
];

export { apiDocs };
```

#### Component Documentation
```tsx
// components/AuctionCard.tsx
interface AuctionCardProps {
  /** Obiekt aukcji do wyświetlenia */
  auction: Auction;
  /** Czy pokazać przycisk obserwowania */
  showWatchButton?: boolean;
  /** Callback wywoływany przy kliknięciu */
  onClick?: (auction: Auction) => void;
  /** Dodatkowe klasy CSS */
  className?: string;
}

/**
 * Komponent wyświetlający kartę aukcji
 *
 * @example
 * ```tsx
 * <AuctionCard
 *   auction={auction}
 *   showWatchButton={true}
 *   onClick={(auction) => console.log(auction)}
 * />
 * ```
 */
export function AuctionCard({
  auction,
  showWatchButton = false,
  onClick,
  className,
}: AuctionCardProps) {
  // Implementacja komponentu
}
```

### Performance Budget

#### Bundle Size Limits
```javascript
// next.config.cjs
module.exports = {
  // ... inne konfiguracje

  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    if (!dev && !isServer) {
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          enforce: true,
        },
      };
    }

    return config;
  },
};
```

#### Lighthouse Scores Target
- **Performance**: > 90
- **Accessibility**: > 95
- **Best Practices**: > 95
- **SEO**: > 90
- **PWA**: > 90

### Security Updates

#### Dependency Management
```bash
# Regularne aktualizacje
npm audit
npm audit fix

# Major updates
npm update --save
npx npm-check-updates -u

# Security audits
npm audit --audit-level=moderate
```

#### Automated Security Scanning
```yaml
# .github/workflows/security.yml
name: Security Scan

on:
  schedule:
    - cron: '0 0 * * 1'  # Co tydzień
  push:
    branches: [main]

jobs:
  security:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Run security audit
        run: npm audit --audit-level=high

      - name: Run Snyk
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

      - name: CodeQL Analysis
        uses: github/codeql-action/init@v3
        with:
          languages: javascript
```

### Backup Strategy

#### Database Backups
```bash
# Automatyczne backup'y PostgreSQL
pg_dump palka_mtm > backup_$(date +%Y%m%d_%H%M%S).sql

# Przechowywanie przez 30 dni
find /backups -name "backup_*.sql" -mtime +30 -delete
```

#### Application Backups
- **Code**: Git repository
- **Assets**: Firebase Storage replication
- **Configuration**: Environment variables versioning

### Incident Response

#### Incident Response Plan
1. **Detection**: Monitoring alerts
2. **Assessment**: Severity evaluation
3. **Communication**: Team notification
4. **Containment**: Isolate affected systems
5. **Recovery**: Restore from backup
6. **Lessons Learned**: Post-mortem analysis

#### Communication Channels
- **Internal**: Slack/Discord
- **External**: Status page, email notifications
- **Customers**: In-app notifications, email

---

## 📞 Wsparcie i Kontakt

### Zespół Projektowy

#### Główny Developer
- **Kontakt**: [email/github]
- **Specjalizacja**: Full-stack development, architektura systemu

#### Business Owner
- **Kontakt**: [email]
- **Odpowiedzialność**: Wymagania biznesowe, strategia produktu

### Dokumentacja Techniczna

#### Źródła Dokumentacji
- **README.md**: Podstawowy opis projektu
- **PROJECT_DOCUMENTATION.md**: Szczegółowa dokumentacja techniczna
- **SYSTEM_AUTORYZACJI.md**: Szczegóły systemu autoryzacji
- **DEPLOYMENT_GUIDE.md**: Instrukcje deploymentu

#### API Documentation
- **Swagger/OpenAPI**: `/api/docs` (planowane)
- **Postman Collection**: W repozytorium

### Zgłaszanie Problemów

#### Bug Reports
```markdown
**Tytuł**: [BUG] Krótki opis problemu

**Środowisko:**
- Browser: Chrome 120.0
- OS: Windows 11
- URL: https://palkamtm.pl/auctions/123

**Opis:**
Szczegółowy opis problemu

**Kroki do reprodukcji:**
1. Przejdź do...
2. Kliknij...
3. Zobacz błąd...

**Oczekiwane zachowanie:**
Co powinno się stać

**Aktualne zachowanie:**
Co się dzieje zamiast tego

**Screenshot/Video:**
[załączniki]
```

#### Feature Requests
```markdown
**Tytuł**: [FEATURE] Nazwa nowej funkcjonalności

**Opis:**
Szczegółowy opis proponowanej funkcji

**Uzasadnienie:**
Dlaczego ta funkcja jest potrzebna

**Szkic rozwiązania:**
Jak powinna działać

**Alternatywy:**
Inne możliwe rozwiązania
```

### Roadmap i Plan Rozwoju

#### Q1 2025 - Stabilizacja
- [ ] Refaktoryzacja komponentów
- [ ] Optymalizacja wydajności
- [ ] Rozszerzone testy E2E
- [ ] Dokumentacja API

#### Q2 2025 - Rozwój Funkcjonalności
- [ ] System powiadomień push
- [ ] Zaawansowane filtry aukcji
- [ ] Galeria zdjęć mistrzów
- [ ] Integracja z mapami

#### Q3 2025 - Skalowalność
- [ ] Mikroserwisy (opcja)
- [ ] CDN dla obrazów
- [ ] Cache warstwowy
- [ ] Monitoring zaawansowany

#### Q4 2025 - Międzynarodowa Ekspansja
- [ ] Wielojęzyczność (i18n)
- [ ] Waluty międzynarodowe
- [ ] Lokalne regulacje prawne

### Licencja i Prawa Autorskie

#### Licencja
ISC License - pozwala na komercyjne i prywatne użytkowanie z minimalnymi ograniczeniami.

#### Prawa Autorskie
© 2025 Pałka MTM - Wszystkie prawa zastrzeżone.

#### Zastrzeżenia
- Projekt jest własnością firmy Pałka MTM
- Kod źródłowy może być używany zgodnie z licencją ISC
- Logo i nazwa są zastrzeżonymi znakami towarowymi

---

## 📊 Podsumowanie

### Kluczowe Wskaźniki Sukcesu

#### Techniczne KPI
- **Uptime**: > 99.5%
- **Response Time**: < 500ms (średnio)
- **Error Rate**: < 0.1%
- **Test Coverage**: > 80%
- **Bundle Size**: < 200KB (initial)

#### Biznesowe KPI
- **Daily Active Users**: Cel 1000+ użytkowników dziennie
- **Auction Conversion**: > 15% aukcji kończy się sprzedażą
- **User Retention**: > 60% powracających użytkowników
- **Revenue Growth**: 20% miesięczny wzrost przychodów

### Architektura Długoterminowa

#### Monolit z Mikroserwisami
- **Core Platform**: Pozostaje monolitem (Next.js)
- **Specialized Services**: Mikroserwisy dla ciężkich obliczeń
- **Event-driven**: Komunikacja przez events (future)

#### Cloud-native
- **Containerization**: Docker + Kubernetes
- **Auto-scaling**: Horizontal pod autoscaling
- **Multi-region**: Globalna dystrybucja
- **Disaster Recovery**: Multi-zone redundancy

### Przyszły Rozwój

#### AI/ML Integration
- **Price Prediction**: AI do sugerowania cen aukcji
- **Image Recognition**: Automatyczna klasyfikacja gołębi
- **Fraud Detection**: Wykrywanie podejrzanych ofert
- **Personalization**: Rekomendacje aukcji

#### Mobile App
- **React Native**: Natywna aplikacja mobilna
- **PWA Enhancement**: Lepsze offline capabilities
- **Push Notifications**: Zaawansowane powiadomienia

#### Blockchain Integration (Future)
- **NFT Certificates**: Certyfikaty gołębi na blockchain
- **Smart Contracts**: Automatyczne rozliczenia aukcji
- **Decentralized Storage**: IPFS dla mediów

---

*Dokumentacja ta stanowi kompleksowe źródło wiedzy o platformie Pałka-MTM. Jest aktualizowana wraz z rozwojem projektu i powinna być konsultowana przy wszystkich pracach rozwojowych i utrzymaniowych.*

**Data ostatniej aktualizacji:** 14 grudnia 2025
**Wersja dokumentacji:** 2.0
**Autor:** Główny Developer Pałka-MTM
