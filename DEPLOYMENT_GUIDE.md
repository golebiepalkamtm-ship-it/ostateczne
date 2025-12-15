# 🚀 Przewodnik Deploymentu - Aukcje Palka MTM

## 📋 Spis treści
1. [Przegląd opcji deploymentu](#przegląd-opcji-deploymentu)
2. [Deployment na Vercel](#deployment-na-vercel) ⭐ **ZALECANE**
3. [Deployment na Firebase App Hosting](#deployment-na-firebase-app-hosting)
4. [Deployment z Docker](#deployment-z-docker)
5. [Rozwiązywanie problemów](#rozwiązywanie-problemów)
6. [Checklist przed deploymentem](#checklist-przed-deploymentem)

---

## 📊 Przegląd opcji deploymentu

### 1. **Vercel** ⭐ **ZALECANE**
- ✅ Najlepsze wsparcie dla Next.js
- ✅ Automatyczne deploymenty z Git
- ✅ Darmowy plan dla projektów open-source
- ✅ Łatwa konfiguracja
- ✅ Wbudowane CDN i optymalizacje

### 2. **Firebase App Hosting**
- ✅ Integracja z Firebase
- ✅ Cloud Run backend
- ⚠️ Wymaga więcej konfiguracji
- ⚠️ Może mieć problemy z kolejką (błąd 409)

### 3. **Docker**
- ✅ Pełna kontrola nad środowiskiem
- ✅ Lokalne testowanie
- ⚠️ Wymaga własnego serwera/hostingu
- ⚠️ Więcej konfiguracji

---

## 🎯 Deployment na Vercel

### Krok 1: Instalacja Vercel CLI
```powershell
npm i -g vercel
```

### Krok 2: Logowanie
```powershell
vercel login
```

### Krok 3: Konfiguracja zmiennych środowiskowych

Użyj gotowego skryptu:
```powershell
.\setup-vercel-env.ps1
```

Lub ręcznie w Vercel Dashboard:
1. Przejdź do: https://vercel.com/dashboard
2. Wybierz projekt → Settings → Environment Variables
3. Dodaj wszystkie wymagane zmienne (patrz sekcja [Zmienne środowiskowe](#zmienne-środowiskowe))

### Krok 4: Deployment

**Deployment produkcyjny:**
```powershell
npm run deploy:vercel
```

**Lub ręcznie:**
```powershell
vercel --prod
```

### Krok 5: Konfiguracja domeny

1. W Vercel Dashboard → Settings → Domains
2. Dodaj domenę: `palkamtm.pl`
3. Skonfiguruj DNS w panelu Home.pl:
   - **A Record**: `@` → [IP z Vercel]
   - **CNAME**: `www` → [CNAME z Vercel]

### ✅ Status konfiguracji Vercel
- ✅ `vercel.json` jest poprawnie skonfigurowany
- ✅ Region: `fra1` (Frankfurt - blisko Polski)
- ✅ Wszystkie optymalizacje włączone
- ✅ Health checks skonfigurowane

---

## 🔥 Deployment na Firebase App Hosting

### Krok 1: Instalacja Firebase CLI
```powershell
npm i -g firebase-tools
```

### Krok 2: Logowanie
```powershell
firebase login
```

### Krok 3: Wybór projektu
```powershell
firebase use 4fba2
```

### Krok 4: Konfiguracja zmiennych środowiskowych

Zmienne są już skonfigurowane w `.apphosting.production.yaml`.

**WAŻNE:** Jeśli potrzebujesz dodać `DATABASE_URL`:
1. Otwórz `.apphosting.production.yaml`
2. Odkomentuj sekcję `DATABASE_URL` (linie 40-46)
3. Wprowadź prawidłowy connection string

### Krok 5: Deployment

**Tylko App Hosting:**
```powershell
npm run deploy:firebase
```

**Wszystkie usługi Firebase:**
```powershell
npm run deploy:firebase:all
```

### ⚠️ Rozwiązywanie błędu 409

Jeśli widzisz błąd:
```
HTTP Error: 409, unable to queue the operation
```

**Rozwiązania:**
1. **Poczekaj** - może być trwający deployment
2. **Sprawdź Firebase Console**: https://console.firebase.google.com/project/m-t-m-62972/apphosting
3. **Anuluj poprzedni build** jeśli jest w toku
4. **Spróbuj ponownie** po 5-10 minutach

---

## 🐳 Deployment z Docker

### Krok 1: Przygotowanie zmiennych środowiskowych

Skopiuj `.env.production.example` do `.env.production` i wypełnij wartościami.

### Krok 2: Build obrazu Docker
```powershell
docker build -t palka-mtm-auctions .
```

### Krok 3: Uruchomienie z docker-compose
```powershell
docker-compose up -d
```

### Krok 4: Sprawdzenie statusu
```powershell
docker-compose ps
docker-compose logs -f app
```

### Krok 5: Migracje bazy danych
```powershell
docker-compose exec app npm run db:migrate
```

### Krok 6: Seed bazy danych (opcjonalnie)
```powershell
docker-compose exec app npm run db:seed
```

---

## 🔧 Zmienne środowiskowe

### Wymagane zmienne dla wszystkich deploymentów:

#### Next.js & NextAuth
```env
NODE_ENV=production
NEXT_PUBLIC_BASE_URL=https://palkamtm.pl
NEXTAUTH_URL=https://palkamtm.pl
NEXTAUTH_SECRET=<wygeneruj: openssl rand -base64 32>
NEXT_TELEMETRY_DISABLED=1
```

#### Firebase Client (Publiczne)
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCrGcWptUnRgcNnAQl01g5RjPdMfZ2tJCA
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=m-t-m-62972.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=m-t-m-62972
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=m-t-m-62972.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=714609522899
NEXT_PUBLIC_FIREBASE_APP_ID=1:714609522899:web:462e995a1f358b1b0c3c26
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-T645E1YQHW
```

#### Firebase Admin (Serwer - prywatne)
```env
FIREBASE_PROJECT_ID=m-t-m-62972
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@m-t-m-62972.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

#### Baza danych (jeśli używana)
```env
DATABASE_URL=postgresql://user:password@host:5432/database_name
```

#### Redis (opcjonalne)
```env
REDIS_URL=redis://localhost:6379
```

#### Email (opcjonalne)
```env
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your@email.com
EMAIL_SERVER_PASSWORD=your_app_password
EMAIL_FROM=noreply@palkamtm.pl
CONTACT_EMAIL=kontakt@palkamtm.pl
```

#### SMS (opcjonalne)
```env
SMS_PROVIDER=firebase
```

---

## 🐛 Rozwiązywanie problemów

### Problem 1: Build fails na Vercel
**Rozwiązanie:**
1. Sprawdź logi build w Vercel Dashboard
2. Upewnij się, że wszystkie zmienne środowiskowe są ustawione
3. Sprawdź czy `package.json` ma poprawny `build` script
4. Upewnij się, że Prisma client jest generowany: `postinstall` script

### Problem 2: Błąd 409 na Firebase App Hosting
**Rozwiązanie:**
1. Sprawdź Firebase Console czy nie ma trwającego build
2. Poczekaj 5-10 minut i spróbuj ponownie
3. Sprawdź czy nie ma konfliktów w konfiguracji

### Problem 3: Baza danych nie łączy się
**Rozwiązanie:**
1. Sprawdź `DATABASE_URL` - musi być poprawny connection string
2. Sprawdź czy baza danych jest dostępna z sieci (firewall)
3. Dla Vercel: użyj connection pooling (pgbouncer)
4. Sprawdź czy Prisma migrations są uruchomione

### Problem 4: Obrazy nie ładują się
**Rozwiązanie:**
1. Sprawdź konfigurację `images` w `next.config.cjs`
2. Sprawdź `vercel.json` - domeny muszą być dodane do `images.domains`
3. Upewnij się, że Firebase Storage bucket jest publiczny (jeśli używany)

### Problem 5: API zwraca 500 errors
**Rozwiązanie:**
1. Sprawdź logi w Vercel/Firebase Console
2. Sprawdź czy wszystkie zmienne środowiskowe są ustawione
3. Sprawdź połączenie z bazą danych
4. Sprawdź Firebase Admin SDK credentials

---

## ✅ Checklist przed deploymentem

### Przed każdym deploymentem:

- [ ] Wszystkie zmienne środowiskowe są ustawione
- [ ] `NEXTAUTH_SECRET` jest wygenerowany i bezpieczny
- [ ] Firebase credentials są poprawne
- [ ] Baza danych jest dostępna i migracje są aktualne
- [ ] Testy lokalne przechodzą: `npm run build`
- [ ] `.env` pliki nie są commitowane do Git
- [ ] Wszystkie secrets są w bezpiecznym miejscu

### Przed deploymentem produkcyjnym:

- [ ] Backup bazy danych
- [ ] Testy E2E przechodzą: `npm run test`
- [ ] Sprawdzenie wydajności lokalnie
- [ ] Sprawdzenie logów błędów (Sentry)
- [ ] Dokumentacja jest aktualna
- [ ] Plan rollback jest przygotowany

---

## 📚 Przydatne linki

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Firebase Console**: https://console.firebase.google.com/project/m-t-m-62972
- **Dokumentacja Vercel**: https://vercel.com/docs
- **Dokumentacja Firebase App Hosting**: https://firebase.google.com/docs/app-hosting
- **Dokumentacja Docker**: https://docs.docker.com/

---

## 🆘 Wsparcie

Jeśli masz problemy z deploymentem:

1. Sprawdź logi w odpowiednim dashboardzie (Vercel/Firebase)
2. Sprawdź sekcję [Rozwiązywanie problemów](#rozwiązywanie-problemów)
3. Sprawdź dokumentację projektu: `PROJECT_DOCUMENTATION.md`
4. Sprawdź konfigurację środowiskową: `ENVIRONMENT_VARIABLES_SETUP.md`

---

**Ostatnia aktualizacja:** 2025-01-XX
**Wersja:** 1.0.0

