# 🚀 Przewodnik Wdrożenia - Pałka MTM Auctions

Kompletny przewodnik wdrożenia aplikacji na produkcję z własną domeną.

## 📋 Spis Treści

1. [Przygotowanie](#przygotowanie)
2. [Opcja 1: Vercel (Zalecane)](#opcja-1-vercel-zalecane)
3. [Opcja 2: Własny Serwer VPS](#opcja-2-własny-serwer-vps)
4. [Opcja 3: Firebase Hosting](#opcja-3-firebase-hosting)
5. [Konfiguracja DNS](#konfiguracja-dns)
6. [SSL/HTTPS](#sslhttps)
7. [Zmienne Środowiskowe](#zmienne-środowiskowe)
8. [Migracje Bazy Danych](#migracje-bazy-danych)
9. [Weryfikacja Wdrożenia](#weryfikacja-wdrożenia)

---

## Przygotowanie

### 1. Wymagane Usługi

Przed wdrożeniem upewnij się, że masz:

- ✅ **Domena** (np. `palkamtm.pl`)
- ✅ **Baza danych PostgreSQL** (produkcyjna)
- ✅ **Redis** (opcjonalnie, dla cache)
- ✅ **Firebase** (skonfigurowany)
- ✅ **Konto hostingowe** (Vercel/VPS/Firebase)

### 2. Przygotowanie Zmiennych Środowiskowych

Skopiuj plik z przykładowymi zmiennymi:

```bash
cp env.example .env.production.local
```

Edytuj `.env.production.local` i uzupełnij wszystkie wartości.

---

## Opcja 1: Vercel (Zalecane) ⭐

**Najłatwiejsza opcja dla Next.js - automatyczne wdrożenia, SSL, CDN**

### Krok 1: Instalacja Vercel CLI

```bash
npm i -g vercel
```

### Krok 2: Logowanie

```bash
vercel login
```

### Krok 3: Wdrożenie

```bash
# Pierwsze wdrożenie (staging)
vercel

# Wdrożenie na produkcję
vercel --prod
```

### Krok 4: Konfiguracja Domeny

1. Przejdź do [Vercel Dashboard](https://vercel.com/dashboard)
2. Wybierz projekt → **Settings** → **Domains**
3. Dodaj swoją domenę (np. `palkamtm.pl`)
4. Vercel automatycznie:
   - Skonfiguruje DNS
   - Wystawi certyfikat SSL
   - Skonfiguruje HTTPS

### Krok 5: Zmienne Środowiskowe

W Vercel Dashboard:
1. **Settings** → **Environment Variables**
2. Dodaj wszystkie zmienne z `.env.production.local`
3. Ustaw dla środowiska: **Production**

### Krok 6: Baza Danych

**Opcja A: Vercel Postgres (Zalecane)**
- W Vercel Dashboard: **Storage** → **Create Database** → **Postgres**
- Automatycznie otrzymasz `DATABASE_URL`

**Opcja B: Zewnętrzna baza (np. Supabase, Railway)**
- Skonfiguruj PostgreSQL na zewnętrznym hostingu
- Dodaj `DATABASE_URL` do zmiennych środowiskowych

### Krok 7: Migracje Bazy Danych

```bash
# Lokalnie z połączeniem do produkcyjnej bazy
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

Lub użyj Vercel CLI:

```bash
vercel env pull .env.production.local
npx prisma migrate deploy
```

### Krok 8: Redis (Opcjonalnie)

**Opcja A: Vercel KV (Redis)**
- **Storage** → **Create Database** → **KV**
- Automatycznie otrzymasz `REDIS_URL`

**Opcja B: Zewnętrzny Redis**
- Użyj Upstash, Redis Cloud, lub własny serwer
- Dodaj `REDIS_URL` do zmiennych środowiskowych

---

## Opcja 2: Własny Serwer VPS

**Pełna kontrola, wymaga konfiguracji serwera**

### Wymagania Serwera

- **RAM**: Minimum 2GB (zalecane 4GB+)
- **CPU**: 2+ rdzenie
- **Dysk**: 20GB+ SSD
- **OS**: Ubuntu 22.04 LTS (zalecane)

### Krok 1: Przygotowanie Serwera

```bash
# Aktualizacja systemu
sudo apt update && sudo apt upgrade -y

# Instalacja Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalacja Docker Compose
sudo apt install docker-compose-plugin -y

# Dodanie użytkownika do grupy docker
sudo usermod -aG docker $USER
```

### Krok 2: Klonowanie Projektu

```bash
# Na serwerze
git clone https://github.com/TwojUsername/palka-mtm.git
cd palka-mtm
```

### Krok 3: Konfiguracja Produkcyjna

Utwórz `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    restart: always
    environment:
      POSTGRES_DB: palkamtm_production
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - app-network

  app:
    build:
      context: .
      dockerfile: Dockerfile
    restart: always
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/palkamtm_production
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      NODE_ENV: production
      NEXTAUTH_URL: https://palkamtm.pl
      # ... pozostałe zmienne środowiskowe
    depends_on:
      - postgres
      - redis
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.prod.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/etc/nginx/certs:ro
    depends_on:
      - app
    networks:
      - app-network

volumes:
  postgres_data:
  redis_data:

networks:
  app-network:
    driver: bridge
```

### Krok 4: Konfiguracja Nginx

Utwórz `nginx.prod.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3000;
    }

    server {
        listen 80;
        server_name palkamtm.pl www.palkamtm.pl;
        
        # Przekierowanie HTTP → HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name palkamtm.pl www.palkamtm.pl;

        ssl_certificate /etc/nginx/certs/fullchain.pem;
        ssl_certificate_key /etc/nginx/certs/privkey.pem;

        location / {
            proxy_pass http://app;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
```

### Krok 5: SSL z Let's Encrypt

```bash
# Instalacja Certbot
sudo apt install certbot python3-certbot-nginx -y

# Generowanie certyfikatu
sudo certbot --nginx -d palkamtm.pl -d www.palkamtm.pl

# Automatyczne odnowienie
sudo certbot renew --dry-run
```

### Krok 6: Uruchomienie

```bash
# Utworzenie pliku .env z zmiennymi
nano .env

# Uruchomienie
docker-compose -f docker-compose.prod.yml up -d

# Migracje bazy danych
docker-compose -f docker-compose.prod.yml exec app npx prisma migrate deploy

# Logi
docker-compose -f docker-compose.prod.yml logs -f
```

---

## Opcja 3: Firebase Hosting

**Dla projektów już używających Firebase**

### Krok 1: Instalacja Firebase CLI

```bash
npm i -g firebase-tools
firebase login
```

### Krok 2: Inicjalizacja

```bash
firebase init hosting
```

Wybierz:
- **Existing project** (lub utwórz nowy)
- **Public directory**: `.next`
- **Single-page app**: No
- **Automatic builds**: Yes

### Krok 3: Konfiguracja `firebase.json`

```json
{
  "hosting": {
    "public": ".next",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  }
}
```

### Krok 4: Build i Deploy

```bash
# Build aplikacji
npm run build

# Deploy
firebase deploy --only hosting
```

### Krok 5: Konfiguracja Domeny

1. Firebase Console → **Hosting** → **Add custom domain**
2. Dodaj domenę `palkamtm.pl`
3. Dodaj rekordy DNS zgodnie z instrukcjami Firebase
4. Firebase automatycznie wystawi SSL

---

## Konfiguracja DNS

### Rekordy DNS dla Vercel

```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### Rekordy DNS dla Własnego Serwera

```
Type: A
Name: @
Value: [IP_TWOJEGO_SERWERA]

Type: A
Name: www
Value: [IP_TWOJEGO_SERWERA]
```

### Rekordy DNS dla Firebase

Zgodnie z instrukcjami w Firebase Console (zwykle A i AAAA).

---

## SSL/HTTPS

### Vercel
✅ **Automatycznie** - certyfikat Let's Encrypt wystawiany automatycznie

### Własny Serwer
✅ **Let's Encrypt** - użyj Certbot (instrukcja powyżej)

### Firebase
✅ **Automatycznie** - certyfikat Google wystawiany automatycznie

---

## Zmienne Środowiskowe

### Wymagane Zmienne dla Produkcji

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# NextAuth
NEXTAUTH_URL="https://palkamtm.pl"
NEXTAUTH_SECRET="[generuj-losowy-klucz-64-znaki]"

# Firebase (Client)
NEXT_PUBLIC_FIREBASE_API_KEY="..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="..."
NEXT_PUBLIC_FIREBASE_PROJECT_ID="..."
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="..."
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
NEXT_PUBLIC_FIREBASE_APP_ID="..."

# Firebase (Admin)
FIREBASE_PROJECT_ID="..."
FIREBASE_CLIENT_EMAIL="..."
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Redis (Opcjonalnie)
REDIS_URL="redis://:password@host:6379"

# Email (dla formularza kontaktowego)
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="twoj@email.com"
EMAIL_SERVER_PASSWORD="haslo-aplikacji"
EMAIL_FROM="noreply@palkamtm.pl"
CONTACT_EMAIL="kontakt@palkamtm.pl"

# Environment
NODE_ENV="production"
```

### Generowanie NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

---

## Migracje Bazy Danych

### Lokalnie (z połączeniem do produkcyjnej bazy)

```bash
# Ustaw zmienną środowiskową
export DATABASE_URL="postgresql://..."

# Uruchom migracje
npx prisma migrate deploy
```

### Na Serwerze (Docker)

```bash
docker-compose -f docker-compose.prod.yml exec app npx prisma migrate deploy
```

### W Vercel (przez CLI)

```bash
vercel env pull .env.production.local
npx prisma migrate deploy
```

---

## Weryfikacja Wdrożenia

### 1. Health Check

```bash
curl https://palkamtm.pl/api/health
```

Oczekiwany wynik:
```json
{"status":"ok","timestamp":"2024-01-01T00:00:00.000Z"}
```

### 2. Sprawdzenie SSL

- Odwiedź: https://www.ssllabs.com/ssltest/
- Wpisz swoją domenę
- Oczekiwana ocena: **A** lub **A+**

### 3. Test Funkcjonalności

- ✅ Strona główna ładuje się
- ✅ Logowanie działa
- ✅ Aukcje wyświetlają się
- ✅ Formularze działają
- ✅ API odpowiada

### 4. Monitoring

- **Vercel**: Automatyczny monitoring w dashboardzie
- **Własny serwer**: Sprawdź logi `docker-compose logs -f`
- **Sentry**: Sprawdź dashboard Sentry dla błędów

---

## Automatyczne Wdrożenia (CI/CD)

### GitHub Actions

Projekt ma już skonfigurowany workflow w `.github/workflows/`.

Aby włączyć automatyczne wdrożenia:

1. Dodaj secrets w GitHub:
   - `VERCEL_TOKEN` (lub odpowiednie dla Twojego hostingu)
   - `DATABASE_URL`
   - Pozostałe zmienne środowiskowe

2. Push do `main` automatycznie wdroży na produkcję

---

## Troubleshooting

### Problem: Baza danych nie łączy się

**Rozwiązanie:**
- Sprawdź `DATABASE_URL`
- Sprawdź firewall (port 5432)
- Sprawdź czy baza jest dostępna z zewnątrz

### Problem: SSL nie działa

**Rozwiązanie:**
- Sprawdź rekordy DNS (mogą potrzebować 24-48h)
- Sprawdź certyfikat: `openssl s_client -connect palkamtm.pl:443`

### Problem: Aplikacja nie buduje się

**Rozwiązanie:**
- Sprawdź logi builda
- Sprawdź zmienne środowiskowe
- Sprawdź czy wszystkie zależności są zainstalowane

### Problem: Strona ładuje się wolno

**Rozwiązanie:**
- Włącz Redis cache
- Sprawdź optymalizację obrazów
- Sprawdź CDN (Vercel ma automatyczny CDN)

---

## Kontakt i Wsparcie

W razie problemów sprawdź:
- Logi aplikacji
- Logi serwera
- Dokumentację hostingu
- Issues na GitHub

---

**Powodzenia z wdrożeniem! 🚀**

