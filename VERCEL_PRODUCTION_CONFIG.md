# 🚀 Konfiguracja Vercel Production - Aukcje Palka MTM

## 📋 Architektura

### Hosting
- **Vercel** - główny hosting produkcyjny
- **NIE używamy Firebase App Hosting**

### Baza danych
- **Supabase PostgreSQL** - główna baza danych aplikacji
- Connection string: `postgresql://postgres:Milosz%2E1205@db.fodfctgqzcuhqwcpupni.supabase.co:6543/postgres?pgbouncer=true&connection_limit=1`

### Firebase
- **TYLKO do autoryzacji** (rejestracja, weryfikacja email, SMS)
- Projekt: `4fba2`
- **NIE używamy Firebase do bazy danych ani hostingu**

## ✅ Wymagane zmienne środowiskowe w Vercel

### Baza danych
- ✅ `DATABASE_URL` - Supabase PostgreSQL (PgBouncer dla production)

### Firebase Client (Publiczne)
- ✅ `NEXT_PUBLIC_FIREBASE_API_KEY`
- ✅ `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- ✅ `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- ✅ `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- ✅ `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- ✅ `NEXT_PUBLIC_FIREBASE_APP_ID`
- ✅ `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

### Firebase Admin (Serwer - tylko do SMS)
- ✅ `FIREBASE_PROJECT_ID`
- ✅ `FIREBASE_CLIENT_EMAIL`
- ✅ `FIREBASE_PRIVATE_KEY`

### NextAuth
- ✅ `NEXTAUTH_URL`
- ✅ `NEXTAUTH_SECRET`
- ✅ `NEXT_PUBLIC_BASE_URL`

### Inne
- ✅ `NODE_ENV=production`
- ✅ `NEXT_TELEMETRY_DISABLED=1`

## 🔧 Sprawdzenie konfiguracji

```bash
# Sprawdź wszystkie zmienne środowiskowe
vercel env ls

# Sprawdź konkretną zmienną
vercel env pull .env.local
```

## 🚀 Deployment

```bash
# Deployment na produkcję
vercel --prod

# Lub użyj skryptu
npm run deploy:vercel
```

## 📝 Uwagi

1. **Vercel automatycznie uruchomi migracje Prisma** podczas build (jeśli `postinstall` script zawiera `prisma generate`)
2. **DATABASE_URL używa PgBouncer** (port 6543) - lepsze dla serverless
3. **Firebase jest TYLKO do autoryzacji** - nie używamy go do bazy danych
4. **Wszystkie dane aplikacji są w Supabase PostgreSQL**

## 🔗 Linki

- **Vercel Dashboard**: https://vercel.com/marcins-projects-59088b6e/palka-mtm-auctions
- **Supabase Dashboard**: https://supabase.com/dashboard/project/fodfctgqzcuhqwcpupni

