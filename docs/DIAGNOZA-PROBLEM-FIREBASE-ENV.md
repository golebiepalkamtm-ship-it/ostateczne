# 🔍 Diagnoza Problemu: Firebase Admin SDK Nie Czyta Zmiennych Środowiskowych

## 📊 Stan Obecny

### ❌ Problem

Firebase Admin SDK **NIE INICJALIZUJE SIĘ** - wszystkie zmienne środowiskowe są **PUSTE** podczas startu aplikacji.

```
Logi z serwera:
debug: 🔧 Firebase Admin SDK initialization check:
debug: - FIREBASE_PROJECT_ID:              ← PUSTE!
debug: - FIREBASE_CLIENT_EMAIL:            ← PUSTE!
debug: - FIREBASE_PRIVATE_KEY:             ← PUSTE!
error: ❌ Firebase Admin SDK initialization error:
```

### 📁 Stan Plików Środowiskowych

```
Name                     Length  Last Modified
----                     ------  -------------
.env                     2983    31.10.2025 12:27:02
.env.example             3470    26.10.2025 16:14:07
.env.local               2983    31.10.2025 12:27:02  ← Utworzony
.env.sentry-build-plugin 473     30.10.2025 09:01:13
```

✅ Pliki `.env` i `.env.local` istnieją i są identyczne (2983 bajty)

---

## 🔍 Analiza Problemu

### 1. Kod Ładujący Zmienne

**Plik:** `lib/firebase-admin.ts` (linie 10-12)

```typescript
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;
```

✅ **Kod jest POPRAWNY** - używa standardowego `process.env`

### 2. Konfiguracja Next.js

**Plik:** `next.config.cjs`

- ✅ Brak specjalnych modyfikacji dla zmiennych środowiskowych
- ✅ Next.js powinien automatycznie ładować `.env.local`
- ✅ Webpack config nie blokuje zmiennych środowiskowych

### 3. Zawartość Pliku `.env.local`

```bash
# KONFIGURACJA FIREBASE (ADMIN SDK - SERWER)
FIREBASE_PROJECT_ID=pigeon-aucion-41d68
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@pigeon-aucion-41d68.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...1755 znaków...\n-----END PRIVATE KEY-----\n"
```

✅ **Zmienne są POPRAWNIE skonfigurowane**
✅ **Klucz prywatny ma 1755 znaków** (pełny klucz)

---

## 🎯 Główna Przyczyna

### **Next.js NIE załadował zmiennych środowiskowych z `.env.local`**

### Możliwe Powody:

#### A. **Cache Next.js (Najprawdopodobniejsze)** ✅ NAPRAWIONE

**Problem:** Folder `.next/` zawierał stary cache z poprzednich uruchomień.

**Rozwiązanie:**

```bash
# Usunięto folder .next
rm -rf .next
```

✅ **Status:** WYKONANE (31.10.2025 12:27)

#### B. **Serwer Nie Został Zrestartowany** ⚠️ WYMAGA AKCJI UŻYTKOWNIKA

**Problem:** Zmienne środowiskowe są ładowane tylko podczas **startu** aplikacji Next.js.

**Wymagane Działanie:**

1. Zatrzymaj serwer (`Ctrl+C`)
2. Uruchom ponownie (`npm run dev`)

❌ **Status:** CZEKA NA RESTART UŻYTKOWNIKA

#### C. **Virtual Environment Python** (Mniej Prawdopodobne)

**Obserwacja:** W logach widoczne:

```
PS C:\Users\manta\Desktop\palka mtm> & "c:/Users/manta/Desktop/palka mtm/.venv/Scripts/Activate.ps1"
(.venv) PS C:\Users\manta\Desktop\palka mtm> npm run dev
```

**Potencjalny Problem:** Virtual environment Python może izolować zmienne środowiskowe.

**Weryfikacja:** Po restarcie, jeśli nadal nie działa, spróbuj uruchomić bez `.venv`:

```bash
# Wyłącz venv
deactivate

# Uruchom serwer
npm run dev
```

#### D. **Kodowanie Pliku** (Mało Prawdopodobne)

**Weryfikacja:** Plik `.env.local` mógł być zapisany w złym kodowaniu przez PowerShell.

**Rozwiązanie (jeśli A i B nie pomogą):**

1. Otwórz `.env.local` w VSCode
2. Na dole kliknij "UTF-8"
3. Wybierz "Save with Encoding" → "UTF-8"
4. Zapisz plik

---

## ✅ Wykonane Działania

1. ✅ Zaktualizowano `FIREBASE_PRIVATE_KEY` w `.env` (1755 znaków - pełny klucz)
2. ✅ Skopiowano `.env` do `.env.local`
3. ✅ Wyczyszczono cache Next.js (usunięto folder `.next`)
4. ✅ Usunięto niepotrzebne foldery (`wwwwww/`, `pigeon/`, `aucion/`, etc.)
5. ✅ Zaktualizowano `firebase.json` i `package.json`
6. ✅ Zaktualizowano `.gitignore`

---

## ⏭️ Następne Kroki (WYMAGANE OD UŻYTKOWNIKA)

### Krok 1: RESTART SERWERA (KRYTYCZNE)

```bash
# 1. Zatrzymaj serwer
Ctrl + C

# 2. Uruchom ponownie
npm run dev
```

### Krok 2: WERYFIKACJA

Sprawdź pierwsze linie logów - powinieneś zobaczyć:

#### ✅ SUKCES:

```
debug: 🔧 Firebase Admin SDK initialization check:
debug: - FIREBASE_PROJECT_ID: SET          ← Powinno być "SET"!
debug: - FIREBASE_CLIENT_EMAIL: SET        ← Powinno być "SET"!
debug: - FIREBASE_PRIVATE_KEY: SET         ← Powinno być "SET"!
info: 🔧 Initializing Firebase Admin SDK...
info: ✅ Firebase Admin SDK initialized successfully
```

#### ❌ NADAL BŁĄD:

```
debug: - FIREBASE_PROJECT_ID:              ← Nadal puste
```

---

## 🔧 Plan B (Jeśli Restart Nie Pomoże)

### 1. Wyłącz Virtual Environment Python

```bash
# W PowerShell:
deactivate

# Uruchom ponownie serwer:
npm run dev
```

### 2. Sprawdź Kodowanie Pliku

```bash
# PowerShell:
Get-Content .env.local -Encoding UTF8 | Set-Content .env.local -Encoding UTF8
```

### 3. Jawne Ładowanie Zmiennych (Ostateczność)

**Plik:** `next.config.cjs`

Dodaj na początku:

```javascript
// Na samej górze pliku, przed wszystkim
require('dotenv').config({ path: '.env.local' });

const path = require('path');
// ... reszta kodu
```

Następnie:

```bash
npm install dotenv
npm run dev
```

### 4. Debug Zmiennych Środowiskowych

Dodaj tymczasowo do `lib/firebase-admin.ts` (linia 22):

```typescript
if (isDev && !isTest && !isBuildTime) {
  console.log('=== DEBUG ENV ===');
  console.log(
    'All FIREBASE env vars:',
    Object.keys(process.env).filter(k => k.includes('FIREBASE'))
  );
  console.log('PROJECT_ID:', projectId);
  console.log('CLIENT_EMAIL:', clientEmail);
  console.log('PRIVATE_KEY length:', privateKey?.length || 0);
  console.log('=================');

  debug('🔧 Firebase Admin SDK initialization check:');
  // ...reszta kodu
}
```

---

## 📋 Checklist Diagnostyczna

- [x] Plik `.env.local` istnieje
- [x] Plik `.env.local` zawiera FIREBASE\_\* zmienne
- [x] `FIREBASE_PRIVATE_KEY` ma pełną długość (1755 znaków)
- [x] Cache Next.js wyczyszczony (folder `.next` usunięty)
- [ ] Serwer zrestartowany **PO** wyczyszczeniu cache
- [ ] Logi pokazują "SET" przy zmiennych Firebase
- [ ] Firebase Admin SDK inicjalizuje się poprawnie

---

## 🎯 Oczekiwany Rezultat Po Restarcie

### Logi Powinny Pokazać:

```
✓ Starting...
✓ Ready in ~2000ms

debug: 🔧 Firebase Admin SDK initialization check:
debug: - FIREBASE_PROJECT_ID: SET
debug: - FIREBASE_CLIENT_EMAIL: SET
debug: - FIREBASE_PRIVATE_KEY: SET
info: 🔧 Initializing Firebase Admin SDK...
info: ✅ Firebase Admin SDK initialized successfully

✓ Compiled /middleware in 400ms
```

### API Endpoints Powinny Działać:

```
POST /api/auth/sync 200 ✅      (zamiast 401 ❌)
POST /api/auth/verify-email-auto-login 200 ✅  (zamiast 503 ❌)
```

### Weryfikacja Email Powinna Zadziałać:

1. Wyślij nowy link weryfikacyjny
2. Kliknij w link w emailu
3. **Powinno zadziałać** bez błędu "link wygasł"!

---

## 📚 Referencje

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Firebase Admin SDK Setup](https://firebase.google.com/docs/admin/setup)
- Dokumentacja projektu: `docs/FIREBASE-ADMIN-KEY-SETUP.md`
- Analiza systemu: `docs/ANALIZA-SYSTEMU-AUTH.md`

---

**Data diagnozy:** 31 października 2025, 12:27  
**Status:** CZEKA NA RESTART SERWERA PRZEZ UŻYTKOWNIKA  
**Priorytet:** 🔴 KRYTYCZNY
