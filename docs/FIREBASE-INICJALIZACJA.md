# Firebase - Inicjalizacja i Konfiguracja

## Przegląd

Aplikacja używa Firebase do:
- **Authentication** (Email, Phone)
- **Firestore** (baza danych)
- **Storage** (przechowywanie plików)
- **Admin SDK** (operacje serwerowe)

## Konfiguracja zmiennych środowiskowych

### 1. Firebase Client SDK (Client-side)

Zmienne `NEXT_PUBLIC_*` są dostępne w przeglądarce. Pobierz je z Firebase Console:

1. Przejdź do [Firebase Console](https://console.firebase.google.com/)
2. Wybierz projekt: **m-t-m-62972**
3. Przejdź do **Project Settings** → **General**
4. W sekcji **Your apps** znajdź aplikację Web (lub utwórz nową)
5. Skopiuj wartości z sekcji **SDK setup and configuration**

Dodaj do `.env` lub `env.production`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="m-t-m-62972.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="m-t-m-62972"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="m-t-m-62972.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-messaging-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="your-measurement-id"
```

### 2. Firebase Admin SDK (Server-side)

Zmienne serwerowe do operacji administracyjnych:

```env
FIREBASE_PROJECT_ID="m-t-m-62972"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-fbsvc@m-t-m-62972.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**Ważne:**
- `FIREBASE_PRIVATE_KEY` musi być w cudzysłowach
- Musi zawierać `\n` (nie `\\n`) w miejscach przełamania linii
- Cały klucz w jednej linii

## Weryfikacja konfiguracji

### Test lokalny

```bash
npm run test:firebase
```

Skrypt sprawdzi:
- ✅ Dostępność wszystkich zmiennych środowiskowych
- ✅ Poprawność konfiguracji Client SDK
- ✅ Inicjalizację Admin SDK
- ✅ Połączenie z Firebase

### Logi inicjalizacji

Podczas uruchomienia aplikacji w trybie development, zobaczysz logi:

```
🔧 Firebase Admin SDK initialization check:
- FIREBASE_PROJECT_ID: SET
- FIREBASE_CLIENT_EMAIL: SET
- FIREBASE_PRIVATE_KEY: SET
🔧 Initializing Firebase Admin SDK...
✅ Firebase Admin SDK initialized successfully
```

## Architektura inicjalizacji

### Client-side (`lib/firebase.ts`)

```typescript
// Warunkowa inicjalizacja - tylko jeśli config jest poprawny
if (isFirebaseConfigValid()) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
}
```

**Zachowanie:**
- Sprawdza dostępność wszystkich wymaganych zmiennych
- Nie inicjalizuje się podczas builda na Vercel (jeśli brakuje zmiennych)
- Eksportuje `null` jeśli nie zainicjalizowane (zapobiega błędom runtime)

### Server-side (`lib/firebase-admin.ts`)

```typescript
// Pomija inicjalizację podczas builda
if (isBuildTime) {
  // Skip initialization
} else if (!projectId || !clientEmail || !privateKey) {
  error('❌ Firebase Admin SDK credentials not configured!');
} else {
  app = initializeApp(firebaseAdminConfig);
  adminAuth = getAuth(app);
}
```

**Zachowanie:**
- Pomija inicjalizację podczas builda Next.js
- Loguje błędy tylko w development
- Zwraca `null` jeśli nie zainicjalizowane (zapobiega crashom)

## Rozwiązywanie problemów

### Błąd: "Firebase: Error (auth/invalid-api-key)"

**Przyczyna:** Brakuje zmiennych `NEXT_PUBLIC_FIREBASE_*` podczas builda

**Rozwiązanie:**
1. Dodaj wszystkie zmienne `NEXT_PUBLIC_FIREBASE_*` do Vercel Environment Variables
2. Upewnij się, że są dostępne dla wszystkich środowisk (Production, Preview, Development)
3. Redeploy aplikacji

### Błąd: "Firebase Admin SDK credentials not configured"

**Przyczyna:** Brakuje zmiennych `FIREBASE_*` (Admin SDK)

**Rozwiązanie:**
1. Sprawdź, czy `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` są ustawione
2. Upewnij się, że `FIREBASE_PRIVATE_KEY` ma pełną długość (~1700 znaków)
3. Sprawdź format klucza (musi mieć `\n` zamiast `\\n`)

### Błąd podczas builda na Vercel

**Przyczyna:** Firebase próbuje się zainicjalizować bez zmiennych środowiskowych

**Rozwiązanie:**
- Kod już obsługuje ten przypadek - Firebase nie inicjalizuje się podczas builda
- Upewnij się, że zmienne są dodane w Vercel przed buildem

## Testowanie

### Lokalnie

```bash
# 1. Skopiuj env.production do .env.local
cp env.production .env.local

# 2. Uzupełnij wartości NEXT_PUBLIC_FIREBASE_*
# (pobierz z Firebase Console)

# 3. Test inicjalizacji
npm run test:firebase

# 4. Uruchom aplikację
npm run dev
```

### Na Vercel

1. Przejdź do **Settings** → **Environment Variables**
2. Dodaj wszystkie zmienne z `env.production`
3. Upewnij się, że są dostępne dla wszystkich środowisk
4. Redeploy aplikacji

## Bezpieczeństwo

⚠️ **Nigdy nie commituj:**
- `.env` lub `.env.local`
- Plików z kluczami prywatnymi
- Service account JSON

✅ **Zawsze dodawaj do `.gitignore`:**
```
.env
.env.local
.env.production.local
**/*-key.json
**/*service-account*.json
```

## Następne kroki

Po skonfigurowaniu Firebase:
1. ✅ Sprawdź inicjalizację: `npm run test:firebase`
2. ✅ Przetestuj logowanie przez email
3. ✅ Przetestuj weryfikację telefonu
4. ✅ Sprawdź upload plików do Storage
5. ✅ Przetestuj operacje Firestore

