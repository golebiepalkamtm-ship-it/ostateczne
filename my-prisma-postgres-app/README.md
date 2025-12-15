# Next.js + Prisma CRUD Demo

Kompletna aplikacja demonstracyjna CRUD (Create, Read, Update, Delete) zbudowana z Next.js, TypeScript, Tailwind CSS i Prisma ORM.

## 🚀 Funkcjonalności

- ✅ **Pełne operacje CRUD** - tworzenie, odczytywanie, aktualizacja i usuwanie użytkowników
- ✅ **Responsywny interfejs** - zbudowany z Tailwind CSS
- ✅ **Walidacja formularzy** - po stronie klienta i serwera
- ✅ **Obsługa błędów** - komunikaty dla użytkownika
- ✅ **TypeScript** - pełne typowanie
- ✅ **Mock data** - do demonstracji (łatwo zastąpione prawdziwą bazą danych)

## 📋 Wymagania

- Node.js 18+ 
- npm lub yarn
- Git

## 🛠️ Instalacja i uruchomienie

### 1. Klonowanie i instalacja zależności

```bash
# Klonuj repozytorium (lub skopiuj folder my-prisma-postgres-app)
cd my-prisma-postgres-app

# Zainstaluj zależności
npm install
```

### 2. Uruchomienie aplikacji

```bash
# Uruchom serwer deweloperski
npm run dev
```

Aplikacja będzie dostępna pod adresem: [http://localhost:3000](http://localhost:3000)

### 3. Build dla produkcji

```bash
# Zbuduj aplikację
npm run build

# Uruchom aplikację w trybie produkcyjnym
npm start
```

## 🏗️ Struktura projektu

```
my-prisma-postgres-app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   ├── users/         # CRUD endpoints
│   │   │   │   ├── route.ts   # GET, POST /api/users
│   │   │   │   └── [id]/      # Dynamic route
│   │   │   │       └── route.ts # GET, PUT, DELETE /api/users/[id]
│   │   ├── page.tsx           # Główna strona aplikacji
│   │   └── layout.tsx         # Layout aplikacji
│   ├── components/            # React komponenty
│   │   ├── UserList.tsx       # Lista użytkowników
│   │   ├── UserForm.tsx       # Formularz dodawania
│   │   └── UserEditForm.tsx   # Formularz edycji
│   └── lib/                   # Biblioteki i konfiguracja
│       ├── users-mock.ts      # Mock data service
│       └── prisma.ts          # Prisma client
├── prisma/                    # Prisma konfiguracja
│   ├── schema.prisma          # Schemat bazy danych
│   ├── seed.ts                # Seed script
│   └── config.ts              # Konfiguracja Prisma
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── next.config.js
```

## 🔧 API Endpoints

### GET /api/users
Pobiera listę wszystkich użytkowników

**Response:**
```json
[
  {
    "id": "1",
    "email": "jan.kowalski@example.com",
    "name": "Jan Kowalski",
    "age": 25,
    "createdAt": "2024-01-15T00:00:00.000Z",
    "updatedAt": "2024-01-15T00:00:00.000Z"
  }
]
```

### POST /api/users
Tworzy nowego użytkownika

**Request Body:**
```json
{
  "email": "nowy.uzytkownik@example.com",
  "name": "Nowy Użytkownik",
  "age": 30
}
```

### GET /api/users/[id]
Pobiera konkretnego użytkownika

### PUT /api/users/[id]
Aktualizuje użytkownika

### DELETE /api/users/[id]
Usuwa użytkownika

## 🗄️ Model danych

```typescript
interface User {
  id: string
  email: string
  name?: string
  age?: number
  createdAt: string
  updatedAt: string
}
```

## 🔄 Zmiana z mock data na prawdziwą bazę danych

### 1. Konfiguracja bazy danych PostgreSQL

Utwórz plik `.env.production`:

```env
DATABASE_URL="postgresql://username:password@host:port/database_name"
```

### 2. Aktualizacja schematu Prisma

W `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  age       Int?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}
```

### 3. Zmiana serwisu danych

Zastąp `src/lib/users-mock.ts` prawdziwym Prisma client:

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export class UsersService {
  static async getAllUsers() {
    return await prisma.user.findMany()
  }

  static async getUserById(id: string) {
    return await prisma.user.findUnique({
      where: { id }
    })
  }

  static async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) {
    return await prisma.user.create({
      data: userData
    })
  }

  static async updateUser(id: string, userData: Partial<User>) {
    return await prisma.user.update({
      where: { id },
      data: userData
    })
  }

  static async deleteUser(id: string) {
    return await prisma.user.delete({
      where: { id }
    })
  }
}
```

### 4. Migracje bazy danych

```bash
# Wygeneruj klienta Prisma
npm run db:generate

# Uruchom migracje
npm run db:migrate

# Seed danych (opcjonalnie)
npm run db:seed
```

## 🚀 Wdrożenie na Vercel

### 1. Połączenie z Vercel

```bash
# Zainstaluj Vercel CLI
npm i -g vercel

# Połącz z projektem Vercel
vercel link
```

### 2. Konfiguracja zmiennych środowiskowych

W panelu Vercel dodaj zmienne środowiskowe:
- `DATABASE_URL` - URL do bazy PostgreSQL

### 3. Wdrożenie

```bash
# Wdróż aplikację
vercel deploy

# Wdróż w produkcji
vercel --prod
```

## 🧪 Testowanie

### API Testing

Możesz testować API używając curl lub Postman:

```bash
# Pobierz wszystkich użytkowników
curl http://localhost:3000/api/users

# Dodaj nowego użytkownika
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User","age":25}'
```

### Frontend Testing

1. Otwórz [http://localhost:3000](http://localhost:3000)
2. Kliknij "Dodaj Użytkownika"
3. Wypełnij formularz i zapisz
4. Przetestuj edycję i usuwanie

## 🔧 Skrypty npm

```bash
npm run dev          # Uruchom serwer deweloperski
npm run build        # Zbuduj aplikację
npm run start        # Uruchom w trybie produkcyjnym
npm run lint         # Sprawdź kod z ESLint
npm run db:generate  # Wygeneruj klienta Prisma
npm run db:migrate   # Uruchom migracje
npm run db:seed      # Seed danych
```

## 🛠️ Technologie

- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Prisma ORM** - Database ORM (konfiguracja)
- **React** - UI library
- **Vercel** - Deployment platform

## 📝 Licencja

MIT License - zobacz plik LICENSE dla szczegółów.

## 🤝 Wsparcie

Jeśli masz pytania lub problemy, utwórz issue w repozytorium lub skontaktuj się z zespołem.

---

**Uwaga**: Ta aplikacja używa mockowanych danych do demonstracji. W produkcji należy zastąpić je prawdziwą bazą danych PostgreSQL.
