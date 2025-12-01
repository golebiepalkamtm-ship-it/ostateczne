# Analiza Systemu Rejestracji, Logowania i Autoryzacji

## 📋 Podsumowanie Wykonawcze

System autoryzacji w aplikacji opiera się na **Firebase Authentication** jako głównym dostawcy tożsamości i **Prisma + PostgreSQL/SQLite** jako bazie danych użytkowników. Architektura wykorzystuje podwójne źródło prawdy (Firebase + DB), co wprowadza złożoność synchronizacji.

---

## 🏗️ Architektura Systemu

### 1. Warstwy Systemu

```
┌─────────────────────────────────────────────────┐
│           Frontend (Client-Side)                │
│  - Firebase Client SDK                          │
│  - AuthContext (React Context)                  │
│  - Komponenty UI (RegisterPage, UserStatus)     │
└─────────────────┬───────────────────────────────┘
                  │
                  ├─── HTTP/HTTPS
                  │
┌─────────────────▼───────────────────────────────┐
│              Next.js Middleware                  │
│  - Sprawdzenie obecności tokenu                  │
│  - Przekierowanie do /auth/register              │
└─────────────────┬───────────────────────────────┘
                  │
                  ├─── API Routes
                  │
┌─────────────────▼───────────────────────────────┐
│              Backend (Server-Side)               │
│  - Firebase Admin SDK                            │
│  - Weryfikacja tokenów JWT                       │
│  - Prisma ORM                                    │
└─────────────────┬───────────────────────────────┘
                  │
                  ├─── Firebase Auth + Prisma DB
                  │
┌─────────────────▼───────────────────────────────┐
│           Bazy Danych / Usługi                   │
│  - Firebase Auth (źródło prawdy dla auth)        │
│  - PostgreSQL/SQLite (dane użytkownika)          │
└──────────────────────────────────────────────────┘
```

---

## 🔐 Przepływ Rejestracji

### 1. Ścieżka Rejestracji przez UI (`/auth/register`)

**Plik:** `app/auth/register/page.tsx`

#### Główne Komponenty:

- `RegisterContent` - główny komponent formularza
- **Stan lokalny:**
  - `formData` - email, hasło, potwierdzenie hasła
  - `success` - flaga sukcesu rejestracji
  - `error` - komunikaty błędów
  - `isSubmitting` - stan wysyłania formularza

#### Przepływ rejestracji:

```typescript
1. Użytkownik wypełnia formularz (email, hasło, potwierdzenie hasła)

2. Walidacja po stronie klienta:
   - Sprawdzenie czy hasła są identyczne
   - Minimum 8 znaków w haśle

3. Firebase Client SDK - createUserWithEmailAndPassword()
   ├─ Tworzy użytkownika w Firebase Auth
   ├─ Automatycznie loguje użytkownika
   └─ Zwraca userCredential

4. setSuccess(true) - NATYCHMIAST po utworzeniu użytkownika
   └─ Zapobiega race condition z AuthContext

5. Wysłanie email weryfikacyjnego (async, nie blokuje)
   └─ sendEmailVerification(user, {url: ...})

6. Synchronizacja z bazą danych (async, nie blokuje)
   └─ POST /api/auth/sync
      - Authorization: Bearer {token}
      - Body: {email, firstName, lastName, phoneNumber}
```

#### Problemy Zidentyfikowane:

**PROBLEM 1: Race Condition (NAPRAWIONY)**

- Po rejestracji Firebase automatycznie loguje użytkownika
- `AuthContext.onAuthStateChanged` wykrywa nowego użytkownika
- `useEffect` w `RegisterContent` przekierowuje na `/dashboard`
- `if (user) return null` wyświetlał tylko tło

**ROZWIĄZANIE:**

```typescript
// PRZED:
if (user) {
  return null; // ❌ Zawsze zwracał null dla zalogowanego użytkownika
}

// PO NAPRAWIE:
if (user && !success) {
  return null; // ✅ Zwraca null tylko jeśli użytkownik zalogowany ORAZ nie pokazujemy sukcesu
}
```

**PROBLEM 2: Firebase Admin SDK nie zainicjalizowany**

Logi z błędami:

```
error: ❌ Firebase Admin SDK not initialized! Token verification failed.
error: Skonfiguruj FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
POST /api/auth/sync 401 in 2248ms
```

**Przyczyna:** Brak zmiennych środowiskowych Firebase Admin

**Wpływ:**

- Synchronizacja z bazą danych nie działa (401)
- Użytkownik jest tworzony w Firebase, ale nie w DB
- Użytkownik może się zalogować, ale nie ma go w bazie

---

### 2. Alternatywna Ścieżka Rejestracji przez API

**Plik:** `app/api/auth/register/route.ts`

Ten endpoint jest używany przez starsze komponenty (`FirebaseAuthForm`, `FirebaseSignUpForm`)

#### Przepływ:

```typescript
POST /api/auth/register
Body: {
  email: string
  password: string
  firstName?: string
  lastName?: string
  phoneNumber?: string
}

1. Rate Limiting (apiRateLimit)

2. Walidacja Zod:
   - Email format
   - Hasło min. 8 znaków
   - Telefon: +48XXXXXXXXX

3. Firebase Admin SDK - createUser()
   ├─ Tworzy użytkownika w Firebase Auth
   ├─ emailVerified: false
   └─ disabled: false

4. Obsługa konfliktów w bazie:
   a) Użytkownik z tym emailem NIE istnieje → Utwórz nowy
   b) Użytkownik istnieje BEZ firebaseUid → Zaktualizuj
   c) Użytkownik istnieje z TYM SAMYM firebaseUid → Błąd (nie powinno się zdarzyć)
   d) Użytkownik istnieje z INNYM firebaseUid:
      - Sprawdź czy stary użytkownik istnieje w Firebase
      - Jeśli NIE → Zaktualizuj z nowym firebaseUid
      - Jeśli TAK → Błąd + usuń nowo utworzonego użytkownika

5. Utworzenie rekordu w Prisma:
   - firebaseUid (z Firebase)
   - email, firstName, lastName, phoneNumber
   - isActive: false (wymaga weryfikacji email)
   - role: 'USER'
   - emailVerified: null
   - isPhoneVerified: false
   - isProfileVerified: false

6. Zwrot odpowiedzi:
   status: 201
   {message, userId}
```

#### Logika Obsługi Konfliktów:

**Kompleksowa obsługa edge cases:**

- Sprawdzenie czy email już istnieje w Firebase (Firebase zwraca błąd)
- Sprawdzenie czy email istnieje w DB
- Sprawdzenie czy numer telefonu jest unikalny
- Synchronizacja firebaseUid między Firebase a DB
- Usuwanie użytkownika z Firebase w przypadku błędów DB

---

## 🔓 Przepływ Logowania

### 1. Logowanie przez Email/Hasło

**Plik:** `components/auth/FirebaseAuthForm.tsx`

```typescript
handleEmailSignIn:
  1. Walidacja formularza (email, hasło)

  2. setPersistence() - wybór persistence
     ├─ rememberMe=true → browserLocalPersistence
     └─ rememberMe=false → browserSessionPersistence

  3. signInWithEmailAndPassword(auth, email, password)
     └─ Firebase Client SDK automatycznie zarządza tokenami

  4. Sprawdzenie emailVerified
     ├─ Jeśli NIE zweryfikowany → Wyślij ponownie email
     └─ Użytkownik może kontynuować (z ostrzeżeniem)

  5. Synchronizacja z bazą
     └─ POST /api/auth/sync
        - Authorization: Bearer {token}
```

### 2. Logowanie przez Google/Facebook

```typescript
handleGoogleSignIn / handleFacebookSignIn:
  1. signInWithPopup(auth, provider)
     └─ Otwiera okno popup z dostawcą OAuth

  2. Po sukces → Użytkownik zalogowany

  3. Synchronizacja z bazą
     └─ POST /api/auth/sync
```

### 3. Automatyczne Logowanie po Weryfikacji Email

**Plik:** `app/auth/verify-email/page.tsx`

```typescript
1. Użytkownik klika link weryfikacyjny z emaila
   └─ URL zawiera: oobCode (one-time code)

2. checkActionCode(auth, oobCode)
   └─ Wyciąga email z kodu

3. applyActionCode(auth, oobCode)
   └─ Weryfikuje email w Firebase

4. POST /api/auth/verify-email-auto-login
   Body: {email}

   Backend:
   - Znajdź użytkownika po email w DB
   - Sprawdź czy istnieje w Firebase
   - Sprawdź czy email jest zweryfikowany w Firebase
   - Utwórz custom token: adminAuth.createCustomToken(firebaseUid)
   - Zaktualizuj DB: emailVerified = new Date(), isActive = true

5. signInWithCustomToken(auth, customToken)
   └─ Automatyczne logowanie użytkownika

6. Synchronizacja z bazą
   └─ POST /api/auth/sync

7. Zapisz token w cookie

8. Przekierowanie na /dashboard
```

---

## 🔒 System Autoryzacji

### 1. Warstwa Client-Side

**Plik:** `contexts/AuthContext.tsx`

```typescript
AuthProvider:
  - Nasłuchuje: onAuthStateChanged(auth, callback)
  - Synchronizuje użytkownika z DB przy każdej zmianie stanu
  - Zapisuje token w cookie dla middleware
  - Zarządza stanem: {user, dbUser, loading}

useAuth():
  - Hook do pobierania stanu autoryzacji
  - Używany w całej aplikacji
```

**Główne funkcje:**

1. **fetchAndSyncUser(firebaseUser)**
   - Pobiera token: `getIdToken(false)`
   - Wywołuje: `POST /api/auth/sync`
   - Zapisuje: `document.cookie = 'firebase-auth-token=...'`

2. **signOut()**
   - Wylogowuje z Firebase
   - Usuwa token z cookie
   - Przekierowuje na `/`

### 2. Warstwa Middleware (Edge Runtime)

**Plik:** `middleware.ts`

```typescript
Chronione ścieżki:
  - /dashboard
  - /admin
  - /seller
  - /auctions/create
  - /profile
  - /settings

Przepływ:
  1. Sprawdź czy ścieżka wymaga autoryzacji
  2. Jeśli NIE → NextResponse.next()
  3. Jeśli TAK:
     a) Pobierz token z nagłówka Authorization LUB cookie
     b) Jeśli brak tokenu → Przekieruj na /auth/register
     c) Jeśli token obecny → Przepuść (szczegółowa weryfikacja w API routes)
```

**UWAGA:** Middleware NIE weryfikuje tokenu (Firebase Admin nie działa w Edge Runtime)

### 3. Warstwa API Routes (Node.js Runtime)

#### a) Podstawowa Autoryzacja Firebase

**Plik:** `lib/firebase-auth.ts`

```typescript
verifyFirebaseToken(request):
  1. Pobierz nagłówek Authorization
  2. Wyciągnij token: "Bearer {token}"
  3. adminAuth.verifyIdToken(token)
  4. Zwróć DecodedIdToken lub null

requireFirebaseAuth(request):
  1. Wywołaj verifyFirebaseToken()
  2. Jeśli null → 401 Unauthorized
  3. Jeśli OK → Zwróć {decodedToken}
```

**Użycie:**

```typescript
// W API route:
const authResult = await requireFirebaseAuth(request);
if (authResult instanceof Response) {
  return authResult; // Błąd 401
}
const { decodedToken } = authResult;
// decodedToken.uid, decodedToken.email, etc.
```

#### b) Autoryzacja Administratora

**Plik:** `lib/admin-auth.ts`

```typescript
requireAdminAuth(request):
  1. Weryfikuj token Firebase
  2. Znajdź użytkownika w DB: prisma.user.findUnique({where: {id: decodedToken.uid}})
  3. Sprawdź:
     - czy użytkownik istnieje
     - czy isActive = true
     - czy role = 'ADMIN'
  4. Jeśli wszystko OK → Zwróć {decodedToken, user}
  5. Jeśli NIE → 403 Forbidden
```

#### c) Dodatkowe Poziomy Weryfikacji

**Plik:** `lib/auth-middleware.ts`

1. **requireEmailVerification(request)**
   - Sprawdza: `emailVerified` i `isActive` w DB
   - Zwraca 403 jeśli nie zweryfikowany

2. **requirePhoneVerification(request)**
   - Sprawdza: `isPhoneVerified` w DB
   - Zwraca 403 jeśli nie zweryfikowany

3. **requireCompleteProfile(request)**
   - Sprawdza: `firstName`, `lastName`, `address`, `city`, `postalCode`, `phoneNumber`
   - Zwraca 403 z listą brakujących pól

4. **requireFullVerification(request)**
   - Kombinuje wszystkie powyższe sprawdzenia
   - Używane dla operacji krytycznych (aukcje, licytowanie)

---

## 🔄 Endpoint Synchronizacji

**Plik:** `app/api/auth/sync/route.ts`

```typescript
POST /api/auth/sync
Headers: Authorization: Bearer {token}
Body: {
  email?: string
  firstName?: string
  lastName?: string
  address?: string
  city?: string
  postalCode?: string
  phoneNumber?: string
}

Przepływ:
  1. requireFirebaseAuth() - weryfikacja tokenu

  2. Sprawdź czy sync już trwa (cache Map)
     └─ Jeśli TAK → Czekaj na wynik poprzedniego

  3. Znajdź użytkownika w DB:
     WHERE firebaseUid = {uid} OR email = {email}

  4a. Użytkownik istnieje z tym samym firebaseUid:
      └─ UPDATE: email, emailVerified, dane opcjonalne

  4b. Użytkownik istnieje z tym samym emailem BEZ firebaseUid:
      └─ UPDATE: firebaseUid, emailVerified, dane opcjonalne

  4c. Użytkownik istnieje z INNYM firebaseUid:
      └─ ERROR: Konflikt danych

  4d. Użytkownik NIE istnieje:
      └─ CREATE: nowy rekord

  5. Ustaw isActive:
     └─ true jeśli emailVerified, false w przeciwnym wypadku

  6. Zwrot: {success: true, user}

  7. Cache na 2 sekundy (zapobieganie wielokrotnym wywołaniom)
```

---

## 📊 Schemat Bazy Danych (Prisma)

```prisma
model User {
  id                 String   @id @default(cuid())
  firebaseUid        String   @unique  // Powiązanie z Firebase Auth
  email              String   @unique
  firstName          String?
  lastName           String?
  address            String?
  city               String?
  postalCode         String?
  phoneNumber        String?  @unique
  role               Role     @default(USER)
  isActive           Boolean  @default(false)  // Wymaga weryfikacji email
  isPhoneVerified    Boolean  @default(false)
  isProfileVerified  Boolean  @default(false)
  emailVerified      DateTime?
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
}

enum Role {
  USER
  ADMIN
}
```

**Kluczowe pola:**

- `firebaseUid` - UNIKALNY identyfikator z Firebase (źródło prawdy)
- `isActive` - czy konto jest aktywne (wymaga weryfikacji email)
- `emailVerified` - data weryfikacji email
- `isPhoneVerified` - czy telefon jest zweryfikowany (SMS)
- `isProfileVerified` - czy profil jest kompletny

---

## 🐛 Zidentyfikowane Problemy

### 1. ❌ Firebase Admin SDK Nie Zainicjalizowany

**Symptomy:**

```
error: ❌ Firebase Admin SDK not initialized! Token verification failed.
POST /api/auth/sync 401
```

**Przyczyna:**
Brak zmiennych środowiskowych:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

**Wpływ:**

- Wszystkie API routes z autoryzacją zwracają 401
- Użytkownicy nie mogą się zarejestrować/zalogować przez API
- Synchronizacja z bazą nie działa

**Rozwiązanie:**

⚠️ **UWAGA:** W tym projekcie zidentyfikowano, że `FIREBASE_PRIVATE_KEY` jest **obcięty** (tylko 129 znaków zamiast ~1700).

```bash
# W pliku .env lub .env.local:
FIREBASE_PROJECT_ID=mtm-62972
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@mtm-62972.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...[CAŁY KLUCZ ~1700 znaków]...\n-----END PRIVATE KEY-----\n"
```

**KRYTYCZNE:** Klucz musi być KOMPLETNY (od `-----BEGIN` do `-----END PRIVATE KEY-----\n`)

**Gdzie znaleźć credentials:**

1. Firebase Console → Project Settings → **Service Accounts** (nie General!)
2. **Generate New Private Key** → Pobierz JSON
3. Skopiuj **CAŁĄ** wartość `"private_key"` z JSON do .env
4. Restart serwera: `npm run dev`

**📖 Szczegółowa instrukcja:** Zobacz `docs/FIREBASE-ADMIN-KEY-SETUP.md`

---

### 2. ⚠️ Race Condition w Rejestracji (NAPRAWIONY)

**Problem:**
Po kliknięciu "Zarejestruj":

1. Firebase tworzy użytkownika i automatycznie loguje
2. `AuthContext.onAuthStateChanged` wykrywa użytkownika
3. `useEffect` w `RegisterContent` próbuje przekierować na `/dashboard`
4. `if (user) return null` wyświetla tylko tło

**Rozwiązanie:**

- Ustawienie `setSuccess(true)` NATYCHMIAST po utworzeniu użytkownika
- Zmiana warunku: `if (user && !success) return null`
- Dodanie `success` do dependency array w `useEffect`

---

### 3. ⚠️ Podwójne Źródło Prawdy

**Problem:**
System ma dwa źródła prawdy:

- Firebase Auth (autentykacja)
- Prisma DB (dane użytkownika)

**Implikacje:**

- Użytkownik może istnieć w Firebase, ale nie w DB
- Użytkownik może istnieć w DB, ale nie w Firebase
- Konieczność ciągłej synchronizacji
- Możliwe niespójności

**Przykłady problemów:**

- Użytkownik zarejestrowany przez UI ma konto Firebase, ale sync z DB failuje (401)
- Użytkownik usunięty z Firebase, ale wciąż w DB
- Dane w Firebase (email) różne od danych w DB

**Sugestia:**

- Rozważ użycie Firebase jako **jedynego** źródła prawdy dla auth
- DB tylko dla **dodatkowych** danych (profil, preferencje)
- Lub odwrotnie: DB jako jedyne źródło, Firebase tylko do weryfikacji tokenów

---

### 4. 🔄 Middleware Nie Weryfikuje Tokenów

**Plik:** `middleware.ts`

```typescript
// UWAGA z kodu:
// Middleware Next.js nie obsługuje firebase-admin ani prisma.
// Tu tylko sprawdzamy obecność tokenu.
// Szczegółowa autoryzacja w API routes.
const decodedToken = null; // ❌ Token nie jest weryfikowany
```

**Problem:**

- Middleware tylko sprawdza obecność tokenu (string)
- Nie weryfikuje czy token jest prawidłowy
- Nie sprawdza czy nie wygasł
- Użytkownik z nieprawidłowym tokenem może dostać się do chronionych stron

**Wpływ:**

- Bezpieczeństwo opiera się na weryfikacji w API routes
- Chronione strony są dostępne z nieprawidłowym tokenem
- Dopiero API zwraca 401/403

**Rozwiązanie:**
To jest **intencjonalne** (Edge Runtime nie obsługuje Firebase Admin).
Jednak **wszystkie API routes muszą** weryfikować token!

---

### 5. 📧 Email Weryfikacyjny Wysyłany Bez Sprawdzenia Firebase Config

**Problem:**

```typescript
// W app/auth/register/page.tsx:
await sendEmailVerification(user, {
  url: `${window.location.origin}/auth/verify-email`,
  handleCodeInApp: false,
});
```

Jeśli Firebase Email Provider nie jest skonfigurowany, to failuje cicho (try-catch).

**Implikacja:**

- Użytkownik zarejestrowany, ale nie dostaje emaila
- Brak jasnego komunikatu o błędzie
- Użytkownik nie wie że ma sprawdzić email

---

### 6. 🔐 CSRF Protection Niekompletna

**Plik:** `lib/csrf.ts` istnieje, ale:

```typescript
// middleware.ts NIE używa CSRF protection
// API routes NIE wymagają CSRF token
```

**Implikacja:**

- Podatność na CSRF attacks
- Szczególnie w POST endpoints (rejestracja, logowanie)

---

## ✅ Mocne Strony Systemu

1. **Kompleksowa Walidacja**
   - Zod schemas w API routes
   - Client-side validation w formularzach
   - Firebase Auth validation

2. **Rate Limiting**
   - `apiRateLimit()` w krytycznych endpointach
   - Ochrona przed brute-force

3. **Wielopoziomowa Autoryzacja**
   - `requireFirebaseAuth` - podstawowa
   - `requireAdminAuth` - dla adminów
   - `requireEmailVerification` - weryfikacja email
   - `requirePhoneVerification` - weryfikacja SMS
   - `requireCompleteProfile` - kompletny profil

4. **Obsługa Konfliktów**
   - Kompleksowa logika w `/api/auth/register`
   - Sprawdzanie czy stary użytkownik istnieje
   - Usuwanie użytkownika z Firebase przy błędach DB

5. **Persistence Options**
   - `browserLocalPersistence` - "Zapamiętaj mnie"
   - `browserSessionPersistence` - sesja tymczasowa

6. **Automatic Token Refresh**
   - Firebase Client SDK automatycznie odświeża tokeny
   - AuthContext synchronizuje przy zmianie stanu

---

## 🔧 Rekomendacje Naprawcze

### KRYTYCZNE (Wymagają natychmiastowej uwagi)

1. **Skonfigurować Firebase Admin SDK**

   ```bash
   # Dodaj do .env:
   FIREBASE_PROJECT_ID=...
   FIREBASE_CLIENT_EMAIL=...
   FIREBASE_PRIVATE_KEY=...
   ```

2. **Jednoznaczne Źródło Prawdy**
   - Zdecydować: Firebase XOR DB jako źródło prawdy dla auth
   - Opcja A: Firebase tylko dla auth, DB dla danych
   - Opcja B: DB dla wszystkiego, Firebase tylko do tokenów

3. **Weryfikacja Tokenów w Middleware**
   - Rozważyć przeniesienie middleware do Node.js Runtime
   - Lub upewnić się że WSZYSTKIE API routes weryfikują token

### WAŻNE (Powinny być naprawione wkrótce)

4. **Implementacja CSRF Protection**
   - Dodać CSRF middleware do wszystkich POST/PUT/DELETE endpoints
   - Szczególnie: `/api/auth/register`, `/api/auth/sync`

5. **Lepsza Obsługa Błędów Email Weryfikacji**

   ```typescript
   try {
     await sendEmailVerification(user, {...});
     setEmailSentStatus(true); // ✅ Informuj użytkownika
   } catch (emailError) {
     setEmailSentStatus(false); // ❌ Informuj o błędzie
     console.error('Błąd wysyłania email:', emailError);
     // Pokaż użytkownikowi komunikat
   }
   ```

6. **Konsolidacja Ścieżek Rejestracji**
   - Obecnie: 2 ścieżki rejestracji (UI + API)
   - Rekomendacja: Jedna spójna ścieżka
   - Usuń starsze komponenty: `FirebaseAuthForm`, `FirebaseSignUpForm`

### ULEPSZENIA (Nice to have)

7. **Monitoring i Logging**
   - Sentry już jest skonfigurowany
   - Dodać tracking dla błędów autoryzacji
   - Dashboard z metrykami rejestracji/logowania

8. **Testy E2E**
   - Pełny flow rejestracji
   - Pełny flow logowania
   - Weryfikacja email
   - Synchronizacja z DB

9. **Rate Limiting Per-User**
   - Obecnie: rate limiting per-IP
   - Lepiej: per-user (po logowaniu)

10. **Session Management**
    - Możliwość wylogowania ze wszystkich urządzeń
    - Lista aktywnych sesji
    - Automatyczne wylogowanie po wygaśnięciu tokenu

---

## 📚 Dodatkowe Zasoby

**Pliki do przejrzenia:**

- `lib/firebase.client.ts` - Firebase Client SDK config
- `lib/rate-limit.ts` - Rate limiting implementation
- `lib/logger.ts` - Logging utilities
- `prisma/schema.prisma` - Database schema

**Endpointy API Auth:**

- `POST /api/auth/register` - Rejestracja
- `POST /api/auth/sync` - Synchronizacja użytkownika
- `POST /api/auth/verify-email-auto-login` - Auto-login po weryfikacji email

**Komponenty UI:**

- `app/auth/register/page.tsx` - Strona rejestracji
- `app/auth/verify-email/page.tsx` - Strona weryfikacji email
- `components/auth/FirebaseAuthForm.tsx` - Starszy formularz auth
- `components/auth/UserStatus.tsx` - Status użytkownika w UI

---

## 🎯 Priorytetowa Lista Zadań

### Etap 1: Naprawa Krytycznych Błędów

- [x] ~~Naprawić race condition w rejestracji~~ ✅ NAPRAWIONE
- [x] ~~Dodać lepsze komunikaty błędów dla wygasłych linków~~ ✅ NAPRAWIONE
- [x] ~~Zidentyfikować problem z Firebase Admin SDK~~ ✅ ZIDENTYFIKOWANE
- [ ] **KRYTYCZNE:** Naprawić obcięty `FIREBASE_PRIVATE_KEY` w `.env` (tylko 129 z ~1700 znaków)
- [ ] Przetestować pełny flow rejestracji
- [ ] Przetestować pełny flow logowania
- [ ] Naprawić wszystkie błędy 401 w /api/auth/sync
- [ ] Przetestować weryfikację email z nowym kluczem

### Etap 2: Refactoring

- [ ] Usunąć duplikację ścieżek rejestracji
- [ ] Ujednolicić źródło prawdy (Firebase vs DB)
- [ ] Dodać CSRF protection
- [ ] Ulepszyć obsługę błędów email weryfikacji

### Etap 3: Testy

- [ ] Dodać testy E2E dla rejestracji
- [ ] Dodać testy E2E dla logowania
- [ ] Dodać testy jednostkowe dla middleware
- [ ] Dodać testy integracyjne dla API routes

### Etap 4: Monitoring

- [ ] Konfiguracja Sentry dla błędów auth
- [ ] Dashboard z metrykami użytkowników
- [ ] Alerty dla błędów autoryzacji
- [ ] Logi audit trail

---

**Data analizy:** 31 października 2025  
**Wersja dokumentu:** 1.0  
**Autor:** AI Assistant (Claude Sonnet 4.5)
