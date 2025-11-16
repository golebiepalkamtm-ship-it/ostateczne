# 🐳 Docker Development Setup

Kompletny Docker stack dla projektu Pałka MTM Auctions.

## ⚡ Quick Start (2 minuty)

```powershell
# 1. Setup zmiennych środowiskowych
cp .env.docker.example .env.local

# 2. Uruchom stack
docker-compose -f docker-compose.dev-alt.yml up -d

# 3. Czekaj ~30-60 sekund na startu wszystkich serwisów
docker-compose -f docker-compose.dev-alt.yml ps

# 4. Aplikacja gotowa!
# App: http://localhost:3001
# Grafana: http://localhost:4000
# pgAdmin: http://localhost:5050
# Mailhog: http://localhost:8025
```

## 📋 Struktura

### Core Services (Wymagane)

- **PostgreSQL** - Baza danych (port 5433)
- **Redis** - Cache (port 6380)
- **Prisma** - Migracje & Klient ORM
- **App (Next.js)** - Aplikacja główna (port 3001)

### Monitoring & Observability

- **Prometheus** - Zbieranie metryk (port 9090)
- **Grafana** - Dashboards (port 4000)

### Database Management

- **pgAdmin** - GUI do PostgreSQL (port 5050)
- **Adminer** - Lekka alternatywa (port 8082)
- **Redis Commander** - Redis UI (port 8081)

### Development Tools

- **Mailhog** - Email testing (port 8025)
- **MinIO** - S3-compatible storage (port 9001)
- **Nginx** - Reverse proxy (port 80, 443)

## 🔗 Linki Serwisów

| Serwis | URL | Login |
|--------|-----|-------|
| Aplikacja | http://localhost:3001 | - |
| Grafana | http://localhost:4000 | admin / admin123 |
| pgAdmin | http://localhost:5050 | admin@palka-mtm.local / admin123 |
| Mailhog | http://localhost:8025 | - |
| MinIO Console | http://localhost:9001 | minioadmin / minioadmin123 |
| Prometheus | http://localhost:9090 | - |
| Redis Commander | http://localhost:8081 | - |
| Adminer | http://localhost:8082 | - |
| PostgreSQL | localhost:5433 | postgres / postgres123 |
| Redis | localhost:6380 | password: redis123 |

## 📖 Pełna Dokumentacja

Szczegółowa dokumentacja znajduje się w: **DOCKER_STACK.md**

## 🆘 Problemy?

### Port zajęty?

```powershell
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### Kontenery nie startują?

```powershell
docker-compose -f docker-compose.dev-alt.yml logs
```

### Reset bazy danych?

```powershell
docker-compose -f docker-compose.dev-alt.yml down -v
docker-compose -f docker-compose.dev-alt.yml up -d
```

---

👉 **Zapoznaj się z DOCKER_STACK.md dla pełnej dokumentacji!**

