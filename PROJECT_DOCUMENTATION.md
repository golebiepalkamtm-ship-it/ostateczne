# Dokumentacja Projektu Pałka-MTM (Aukcje dla Hodowców Gołębi)

## 📋 Przegląd Projektu

**Pałka-MTM** to nowoczesna platforma aukcyjna dedykowana hodowcom gołębi rasowych. Aplikacja umożliwia organizowanie aukcji, zarządzanie profilami hodowców, weryfikację użytkowników oraz komunikację między uczestnikami rynku hodowlanego.

### 🎯 Główne Funkcjonalności
- **Aukcje**: Tworzenie, zarządzanie i uczestnictwo w aukcjach gołębi
- **Weryfikacja użytkowników**: 3-poziomowy system weryfikacji (email + profil + telefon)
- **Komunikacja**: System wiadomości między użytkownikami
- **Referencje**: System recenzji i referencji hodowców
- **Galeria mistrzów**: Prezentacja najlepszych gołębi
- **Spotkania hodowców**: Organizacja wydarzeń branżowych
- **Panel administracyjny**: Zarządzanie platformą

## 🏗️ Architektura Systemu

### Technologiczny Stack Produkcyjny
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Backend**: Next.js API Routes, Firebase Admin SDK
- **Baza danych**: PostgreSQL z Prisma ORM
- **Autoryzacja**: Firebase Auth + własne middleware
- **Cache**: Redis (opcja), Memory Cache
- **Storage**: Firebase Storage, Google Cloud Storage
- **Monitoring**: Sentry, Prometheus, Winston
- **Testy**: Vitest, Playwright (E2E)
- **UI/UX**: Tailwind CSS, Framer Motion, Lucide Icons
- **PWA**: Next-PWA dla aplikacji mobilnej
- **Mapy**: Mapbox GL JS
- **Email/SMS**: Firebase Auth, Nodemailer (opcja)

### Architektura Warstwowa
```
┌─────────────────┐
│   Frontend      │ Next.js 14 + React + TypeScrip
│   (Client)      │
├─────────────────┤
│   API Routes    │ Next.js API + Firebase Admin
│   (Server)      │
├─────────────────┤
│   Database      │ PostgreSQL + Prisma ORM
│   (Data)        │
├─────────────────┤
│   External      │ Firebase Auth, Storage, Redis
│   Services      │
└─────────────────┘
```

## 🗄️ Schemat Bazy Danych

### Główne Encje

#### User (Użytkownik)
```prisma
model User {
  id                          String    @id @default(cuid())
  firebaseUid                 String    @unique
  firstName                   String?
  lastName                    String?
  email                       String    @unique
  emailVerified               DateTime?
  role                        Role      @default(USER_REGISTERED)
  isActive                    Boolean   @default(false)
  phoneNumber                 String?
  isPhoneVerified             Boolean   @default(false)
  isProfileVerified           Boolean   @default(false)
  // ... dodatkowe pola
}
```

#### Auction (Aukcja)
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
  status                AuctionStatus   @default(ACTIVE)
  isApproved            Boolean         @default(false)
  startTime             DateTime
  endTime               DateTime
  // ... dodatkowe pola
}
```

#### Pigeon (Gołąb)
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
  // ... dodatkowe pola
}
```

### Relacje Kluczowe
- User ↔ Auction (jeden do wielu - sprzedawca)
- User ↔ Bid (jeden do wielu - licytujący)
- Auction ↔ Pigeon (jeden do jednego)
- Auction ↔ Bid (jeden do wielu)
- User ↔ Conversation (wiele do wielu)

## 🔐 System Autoryzacji i Weryfikacji

### Poziomy Dostępu Użytkowników
1. **USER_REGISTERED**: Zarejestrowany, podstawowy dostęp
2. **USER_EMAIL_VERIFIED**: Email zweryfikowany, dostęp do profilu
3. **USER_FULL_VERIFIED**: Pełna weryfikacja (email + profil + telefon), pełny dostęp
4. **ADMIN**: Administrator systemu

### Flow Rejestracji
1. **Rejestracja**: Email + hasło lub Google OAuth
2. **Weryfikacja email**: Link potwierdzający z Firebase
3. **Uzupełnienie profilu**: Dane osobowe, adres, telefon
4. **Weryfikacja telefonu**: SMS przez Firebase Phone Auth
5. **Aktywacja**: Pełny dostęp do systemu

### Middleware Bezpieczeństwa
- `requireFirebaseAuth`: Weryfikacja tokenu Firebase
- `requireEmailVerification`: Wymaga weryfikacji email
- `requireFullVerification`: Wymaga pełnej weryfikacji
- `requireAdminAuth`: Wymaga uprawnień administratora

## 🚀 API Routes

### Struktura Endpointów

#### Autoryzacja (`/api/auth/`)
- `POST /api/auth/register` - Rejestracja użytkownika
- `POST /api/auth/verify-email` - Weryfikacja email
- `POST /api/auth/verify-sms` - Weryfikacja SMS
- `POST /api/auth/sync` - Synchronizacja Firebase ↔ Prisma

#### Aukcje (`/api/auctions/`)
- `GET /api/auctions` - Lista aukcji
- `POST /api/auctions/create` - Tworzenie aukcji
- `GET /api/auctions/[id]` - Szczegóły aukcji
- `POST /api/auctions/bid` - Składanie oferty
- `POST /api/auctions/[id]/finalize` - Finalizacja aukcji

#### Administrator (`/api/admin/`)
- `GET /api/admin/users` - Zarządzanie użytkownikami
- `GET /api/admin/auctions/pending` - Aukcje oczekujące na zatwierdzenie
- `POST /api/admin/references` - Zarządzanie referencjami
- `GET /api/admin/stats` - Statystyki systemu

#### Komunikacja (`/api/messages/`)
- `GET /api/messages` - Lista konwersacji
- `POST /api/messages/start` - Rozpoczęcie rozmowy
- `GET /api/messages/[conversationId]` - Wiadomości w konwersacji

### Middleware API
- CSRF Protection
- Rate Limiting
- Input Validation (Zod)
- Error Handling
- Response Caching

## 🎨 Frontend Components

### Struktura Komponentów
```
components/
├── layout/          # Layout aplikacji
│   ├── UnifiedLayout.tsx
│   ├── Footer.tsx
│   └── LogoGlow.tsx
├── home/            # Strona główna
│   └── HeroSection.tsx
├── auctions/        # Komponenty aukcji
│   └── AuctionsPage.tsx
├── auth/            # Autoryzacja
├── dashboard/       # Panel użytkownika
├── admin/           # Panel administratora
├── ui/              # Komponenty UI wielokrotnego użytku
└── providers/       # Context providers
```

### Kluczowe Komponenty
- **AuthFlipCard**: Interaktywny formularz rejestracji/logowania
- **AuctionsList**: Lista aukcji z filtrowaniem
- **BidForm**: Formularz składania ofert
- **ChampionsCarousel**: Galeria mistrzów
- **MessageThread**: Wątek konwersacji

### UI/UX Features
- **Responsive Design**: Tailwind CSS
- **Animations**: Framer Motion
- **Accessibility**: WCAG 2.1 AA
- **PWA**: Offline capabilities
- **Dark Mode**: Opcjonalny motyw ciemny

## ⚙️ Konfiguracja i Deployment

### Next.js Configuration
- **next.config.cjs**: Główna konfiguracja z PWA, CSP, redirects
- **PWA**: next-pwa dla service worker
- **Security Headers**: CSP, HSTS, XSS protection
- **Image Optimization**: Remote patterns dla zewnętrznych obrazów

### Firebase Configuration
- **Authentication**: Email/Password, Google, Phone
- **Firestore**: Baza danych NoSQL (reguły tymczasowe)
- **Storage**: Przechowywanie obrazów i dokumentów
- **Admin SDK**: Serwerowa autoryzacja

### Environment Variables
```env
# Database
DATABASE_URL="postgresql://..."

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY="..."
FIREBASE_PRIVATE_KEY="..."

# Auth
NEXTAUTH_URL="https://palkamtm.pl"
NEXTAUTH_SECRET="..."

# Monitoring
NEXT_PUBLIC_SENTRY_DSN="..."
```

### Deployment
- **Docker**: Konteneryzacja aplikacji
- **Firebase Hosting**: Frontend hosting
- **Cloud SQL**: PostgreSQL w Google Cloud
- **Cloud Run**: Serverless API (opcja)
- **Vercel**: Alternatywny hosting

## 🧪 Testowanie

### Testy Jednostkowe
```bash
npm run test        # Vitest
npm run test:watch  # Tryb watch
```

### Testy E2E
```bash
npx playwright test e2e/
npx playwright test e2e/auth.e2e.spec.ts
```

### Testy Integracyjne
```bash
npm run test:app    # Testy aplikacji
```

## 📊 Monitoring i Obserwowalność

### Sentry
- **Error Tracking**: Automatyczne logowanie błędów
- **Performance**: Monitoring wydajności
- **Release Tracking**: Wersjonowanie aplikacji

### Prometheus
- **Metrics**: `/api/metrics`
- **Custom Metrics**: Licytacje, rejestracje, błędy

### Winston Logger
- **Structured Logging**: JSON format
- **Log Levels**: error, warn, info, debug
- **File Rotation**: Automatyczne rotowanie logów

## 🚀 Uruchomienie Projektu

### Wymagania
- Node.js 18+
- PostgreSQL 15+
- Redis (opcja)
- Firebase Project

### Instalacja
```bash
# Klonowanie repozytorium
git clone https://github.com/golebiepalkamtm-ship-it/ostateczne.git
cd ostateczne

# Instalacja zależności
npm install

# Konfiguracja środowiska
cp env.local.example .env.local
# Wypełnij zmienne środowiskowe

# Migracje bazy danych
npm run db:migrate
npm run db:generate
npm run db:seed

# Uruchomienie aplikacji
npm run dev:windows  # Windows
# lub
npm run dev          # Linux/Mac
```

### Docker
```bash
# Budowa obrazu
docker build -t palkamtm .

# Uruchomienie z docker-compose
docker-compose up -d
```

## 📈 Skalowalność i Wydajność

### Optymalizacje
- **Next.js App Router**: Server Components, Streaming
- **Image Optimization**: Automatyczna optymalizacja obrazów
- **Caching**: Redis dla API responses
- **Database Indexing**: Zoptymalizowane indeksy Prisma
- **CDN**: Google Cloud Storage dla assetów

### Limity i Ograniczenia
- **Rate Limiting**: Ochrona przed nadużyciami
- **File Upload**: Walidacja rozmiaru i typu plików
- **Database Connection Pooling**: Efektywne zarządzanie połączeniami

## 🔧 Rozwój i Maintenance

### Code Quality
- **ESLint**: Statyczna analiza kodu
- **Prettier**: Formatowanie kodu
- **TypeScript**: Typowanie statyczne
- **Husky**: Git hooks

### CI/CD
- **GitHub Actions**: Automatyczne testy i deployment
- **Docker**: Konteneryzacja
- **Firebase Deploy**: Hosting i funkcje

### Dokumentacja
- **README.md**: Podstawowa dokumentacja
- **SYSTEM_AUTORYZACJI.md**: Szczegóły autoryzacji
- **FIREBASE_AUDIT_REPORT.md**: Raport bezpieczeństwa Firebase

## 🤝 Wsparcie i Kontakt

### Zespół
- **Development**: Główny programista
- **Design**: UI/UX Designer
- **Business**: Właściciel platformy

### Kontakt
- **Email**: contact@palkamtm.pl
- **Website**: https://palkamtm.pl
- **GitHub**: https://github.com/golebiepalkamtm-ship-it/ostateczne

---

*Dokumentacja wygenerowana automatycznie na podstawie analizy kodu źródłowego projektu Pałka-MTM. Aktualna na dzień 13.12.2025.*
