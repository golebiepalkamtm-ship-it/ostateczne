# 🔥 Konfiguracja Firebase App Hosting - Produkcja

## 📋 Architektura

### Baza danych
- **Supabase PostgreSQL** - główna baza danych aplikacji
- Connection string: `postgresql://postgres:Milosz%2E1205@db.fodfctgqzcuhqwcpupni.supabase.co:6543/postgres?pgbouncer=true&connection_limit=1`

### Firebase
- **TYLKO do autoryzacji** (rejestracja, weryfikacja email, SMS)
- Projekt: `pigeon-4fba2`
- **NIE używamy Firebase do bazy danych ani hostingu**

### Hosting
- **Vercel** - główny hosting
- **Firebase App Hosting** - alternatywny hosting (opcjonalnie)

## ✅ Co zostało skonfigurowane

### 1. Baza danych Supabase
- ✅ DATABASE_URL dla runtime (PgBouncer - port 6543)
- ✅ DATABASE_URL dla build (bezpośrednie połączenie - port 5432)

### 2. Firebase (tylko autoryzacja)
- ✅ NEXT_PUBLIC_FIREBASE_API_KEY
- ✅ NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
- ✅ NEXT_PUBLIC_FIREBASE_PROJECT_ID
- ✅ NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
- ✅ NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
- ✅ NEXT_PUBLIC_FIREBASE_APP_ID
- ✅ NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
- ⚠️ FIREBASE_CLIENT_EMAIL - **WYMAGA AKTUALIZACJI** (pobierz z Firebase Console)
- ⚠️ FIREBASE_PRIVATE_KEY - **WYMAGA AKTUALIZACJI** (pobierz z Firebase Console)

### 3. NextAuth
- ✅ NEXTAUTH_URL
- ✅ NEXTAUTH_SECRET

## ⚠️ Wymagane akcje

### 1. Pobierz Firebase Admin SDK credentials

1. Przejdź do: https://console.firebase.google.com/project/pigeon-4fba2/settings/serviceaccounts/adminsdk
2. Kliknij "Generate new private key"
3. Pobierz plik JSON
4. Skopiuj wartości:
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (cały klucz z `-----BEGIN PRIVATE KEY-----` do `-----END PRIVATE KEY-----`)

### 2. Zaktualizuj .apphosting.production.yaml

Zastąp w pliku `.apphosting.production.yaml`:
```yaml
- variable: FIREBASE_CLIENT_EMAIL
  value: firebase-adminsdk-xxxxx@pigeon-4fba2.iam.gserviceaccount.com  # ← Wstaw prawdziwy email

- variable: FIREBASE_PRIVATE_KEY
  value: "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"  # ← Wstaw prawdziwy klucz
```

## 🚀 Deployment

Po zaktualizowaniu Firebase credentials:

```bash
# Zdeployuj na Firebase App Hosting
firebase deploy --only apphosting
```

## 📝 Uwagi

1. **Firebase jest TYLKO do autoryzacji** - nie używamy go do bazy danych ani hostingu
2. **Baza danych to Supabase PostgreSQL** - wszystkie dane aplikacji są tam
3. **Hosting główny to Vercel** - Firebase App Hosting jest opcjonalny
4. **Migracje Prisma** uruchomią się automatycznie podczas build (używają bezpośredniego connection string)

