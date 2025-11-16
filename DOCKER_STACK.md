# 🐳 Docker Stack - Pałka MTM Auctions

Kompletny production-ready Docker Compose stack z wszystkimi serwisami dla platformy aukcyjnej.

## 📋 Spis Serwisów

| Serwis | Port | URL | Rola |
|--------|------|-----|------|
| **App (Next.js)** | 3001 | http://localhost:3001 | Główna aplikacja |
| **PostgreSQL** | 5433 | postgresql://localhost:5433 | Baza danych |
| **Redis** | 6380 | redis://localhost:6380 | Cache & sesje |
| **Prometheus** | 9090 | http://localhost:9090 | Zbieranie metryk |
| **Grafana** | 4000 | http://localhost:4000 | Dashboards |
| **pgAdmin** | 5050 | http://localhost:5050 | Zarządzanie DB |
| **Mailhog** | 8025 | http://localhost:8025 | Testowanie emaili |
| **MinIO** | 9001 | http://localhost:9001 | Object Storage (S3) |
| **Redis Commander** | 8081 | http://localhost:8081 | Redis Web UI |
| **Adminer** | 8082 | http://localhost:8082 | Lekkiej DB GUI |
| **Nginx** | 80, 443 | http://localhost | Reverse Proxy |

---

## 🚀 Quick Start

### 1. Przygotowanie Zmiennych Środowiskowych

```bash
# Skopiuj example env do .env.local
cp .env.docker.example .env.local

# Edytuj .env.local i uzupełnij wartości Firebase i inne sekrety
# vim .env.local
```

### 2. Uruchomienie Stack'a

```powershell
# Uruchom wszystkie serwisy w tle (detached mode)
docker-compose -f docker-compose.dev-alt.yml up -d

# Lub z logami na żywo
docker-compose -f docker-compose.dev-alt.yml up

# Monitorowanie statusu serwisów
docker-compose -f docker-compose.dev-alt.yml ps
```

### 3. Sprawdzenie Zdrowia

```powershell
# Czekaj na startu wszystkich serwisów (30-60 sekund)
# Postgres, Redis - healthcheck automatycznie
# Prisma - migracje i generacja klienta
# App - NextJS dev server

# Sprawdź logi konkretnego serwisu
docker-compose -f docker-compose.dev-alt.yml logs -f app
docker-compose -f docker-compose.dev-alt.yml logs -f postgres
docker-compose -f docker-compose.dev-alt.yml logs -f prisma
```

### 4. Zatrzymanie Stack'a

```powershell
# Graceful shutdown - zatrzymaj wszystkie serwisy
docker-compose -f docker-compose.dev-alt.yml down

# Zatrzymaj + usuń volumes (reset bazy danych)
docker-compose -f docker-compose.dev-alt.yml down -v
```

---

## 🔧 Konfiguracja Serwisów

### App (Next.js 14)

- **Port**: 3001
- **URL**: http://localhost:3001
- **Wolumy**: 
  - `./wwwwww:/app` - kod aplikacji
  - `/app/node_modules` - zależności
  - `/app/.next` - build cache
- **Starts**: Po PostgreSQL, Redis i Prisma migrations
- **Health Check**: http://localhost:3001/api/health

**Zmienne Środowiskowe**:
- `DATABASE_URL` - PostgreSQL connection
- `REDIS_URL` - Redis connection
- `FIREBASE_*` - Firebase Admin SDK
- `NEXT_PUBLIC_FIREBASE_*` - Firebase Client
- `NEXTAUTH_SECRET` - Session secret

---

### PostgreSQL (15-alpine)

- **Port**: 5433
- **Container**: pigeon-auction-postgres-dev-alt
- **Database**: pigeon_auction_dev
- **User**: postgres
- **Password**: postgres123
- **Volume**: `postgres_dev_data_alt:/var/lib/postgresql/data`

**Backup Database**:
```bash
docker exec pigeon-auction-postgres-dev-alt pg_dump -U postgres pigeon_auction_dev > backup.sql
```

**Restore Database**:
```bash
docker exec -i pigeon-auction-postgres-dev-alt psql -U postgres pigeon_auction_dev < backup.sql
```

---

### Redis (7-alpine)

- **Port**: 6380
- **Password**: redis123
- **Volume**: `redis_dev_data_alt:/data`
- **Persistence**: Enabled (AOF - Append Only File)

**Connect to Redis**:
```bash
docker exec -it pigeon-auction-redis-dev-alt redis-cli -a redis123
```

**Clear Cache**:
```bash
docker exec pigeon-auction-redis-dev-alt redis-cli -a redis123 FLUSHALL
```

---

### Prometheus

- **Port**: 9090
- **URL**: http://localhost:9090
- **Config**: `./prometheus.yml`
- **Volume**: `prometheus_dev_data_alt:/prometheus`

**Scrape Targets**:
- App metrics: `http://app:3000/api/metrics`
- Prometheus internals: `http://prometheus:9090/metrics`

**Query Metrics**:
```
# CPU Usage
node_cpu_seconds_total

# Memory Usage
node_memory_MemAvailable_bytes

# HTTP Requests
http_requests_total{job="app"}

# Response Time (p95)
http_request_duration_seconds{quantile="0.95"}
```

---

### Grafana

- **Port**: 4000
- **URL**: http://localhost:4000
- **Default Login**: admin / admin123
- **Volume**: `grafana_dev_data_alt:/var/lib/grafana`

**First Login - Setup**:
1. Go to http://localhost:4000
2. Login: admin / admin123
3. Change password (optional)
4. Add Prometheus datasource:
   - URL: http://prometheus:9090
   - Save & Test

**Import Dashboards**:
- Dashboard ID: `1860` - Node Exporter (Linux)
- Dashboard ID: `3662` - Prometheus + Node Exporter (+ Alertmanager)

**Create Custom Dashboard**:
1. Dashboards → New → Dashboard
2. Add Panel → Choose metric from Prometheus
3. Configure visualization
4. Save

---

### pgAdmin

- **Port**: 5050
- **URL**: http://localhost:5050
- **Email**: admin@palka-mtm.local
- **Password**: admin123
- **Volume**: `pgadmin_dev_data_alt:/var/lib/pgadmin`

**Add PostgreSQL Server**:
1. Login to pgAdmin
2. Servers → Register → Server
3. Name: `pigeon-auction-dev`
4. Connection Tab:
   - Host: `postgres`
   - Port: `5432`
   - Username: `postgres`
   - Password: `postgres123`
   - Maintenance Database: `postgres`
5. Save

---

### Mailhog

- **SMTP Port**: 1025
- **Web UI Port**: 8025
- **URL**: http://localhost:8025

**Configure Email in App**:
```typescript
// lib/email.ts
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'mailhog',
  port: parseInt(process.env.SMTP_PORT || '1025'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

export const sendEmail = async (to, subject, html) => {
  return transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    html,
  })
}
```

**Test Email**:
```bash
curl -X POST http://localhost:1025 \
  -d "To: test@example.com\r\nFrom: test@palka-mtm.local\r\nSubject: Test\r\n\r\nHello"
```

All emails appear at: http://localhost:8025

---

### MinIO (S3-Compatible Storage)

- **API Port**: 9000
- **Console Port**: 9001
- **URL**: http://localhost:9001
- **Root User**: minioadmin
- **Root Password**: minioadmin123
- **Volume**: `minio_dev_data_alt:/data`

**Create Bucket**:
1. Go to http://localhost:9001
2. Login: minioadmin / minioadmin123
3. Create → Bucket
4. Name: `pigeon-auction-dev`
5. Make Public

**Upload File via SDK**:
```typescript
import AWS from 'aws-sdk'

const s3 = new AWS.S3({
  endpoint: process.env.MINIO_ENDPOINT,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  s3ForcePathStyle: true,
  signatureVersion: 'v4',
})

await s3
  .putObject({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: 'pigeon-photo.jpg',
    Body: fileBuffer,
    ContentType: 'image/jpeg',
  })
  .promise()
```

---

### Redis Commander

- **Port**: 8081
- **URL**: http://localhost:8081
- **Connected to**: redis:6379

**Features**:
- View all Redis databases
- Inspect keys and values
- Execute Redis commands
- Monitor pub/sub

---

### Adminer

- **Port**: 8082
- **URL**: http://localhost:8082
- **Server**: postgres
- **Username**: postgres
- **Password**: postgres123

Simple alternative to pgAdmin for quick DB queries.

---

### Nginx (Reverse Proxy)

- **HTTP Port**: 80
- **HTTPS Port**: 443
- **URL**: http://localhost
- **Config**: `./nginx.conf`

**Basic Config**:
```nginx
upstream app {
    server app:3000;
}

server {
    listen 80;
    server_name localhost;

    location / {
        proxy_pass http://app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

### Prisma (Migrations & Client Generation)

- **Container**: pigeon-auction-prisma-dev-alt
- **Mode**: Run-once (`restart: 'no'`)
- **Executes**:
  1. `npx prisma generate` - Generate Prisma Client
  2. `npx prisma migrate deploy` - Run pending migrations

**Manual Migration**:
```bash
# Create new migration
docker exec pigeon-auction-app-dev-alt npx prisma migrate dev --name add_new_field

# Apply migrations manually
docker exec pigeon-auction-app-dev-alt npx prisma migrate deploy

# Reset database
docker exec pigeon-auction-app-dev-alt npx prisma migrate reset
```

---

## 📊 Monitoring & Metrics

### Health Checks

```bash
# App Health
curl http://localhost:3001/api/health

# PostgreSQL Health (from inside container)
docker exec pigeon-auction-postgres-dev-alt pg_isready -U postgres

# Redis Health
docker exec pigeon-auction-redis-dev-alt redis-cli -a redis123 PING

# Prometheus Health
curl http://localhost:9090/-/healthy
```

### Key Metrics to Monitor

1. **Application**:
   - Request latency (p50, p95, p99)
   - Error rate
   - Active connections
   - Database query time

2. **Database**:
   - Connection pool usage
   - Query performance
   - Slow queries
   - Transaction rate

3. **Redis**:
   - Cache hit ratio
   - Memory usage
   - Eviction policy
   - Commands per second

4. **Infrastructure**:
   - CPU usage
   - Memory usage
   - Disk I/O
   - Network traffic

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Find process using port
netstat -ano | findstr :3001
# Kill process
taskkill /PID <PID> /F
```

### Container Fails to Start

```bash
# Check logs
docker-compose -f docker-compose.dev-alt.yml logs app

# Specific service
docker-compose -f docker-compose.dev-alt.yml logs postgres
```

### Database Connection Error

```bash
# Check if postgres is healthy
docker-compose -f docker-compose.dev-alt.yml ps postgres

# Verify DATABASE_URL in .env.local
echo $DATABASE_URL

# Test connection
docker exec pigeon-auction-app-dev-alt \
  npx prisma db execute --stdin < <(echo "SELECT 1")
```

### Redis Connection Error

```bash
# Test Redis
docker exec pigeon-auction-redis-dev-alt redis-cli -a redis123 PING

# Check REDIS_URL
echo $REDIS_URL
```

### Prisma Migration Fails

```bash
# Check migration status
docker exec pigeon-auction-app-dev-alt npx prisma migrate status

# View migration history
docker exec pigeon-auction-app-dev-alt npx prisma migrate history

# Reset (WARNING: loses data)
docker exec pigeon-auction-app-dev-alt npx prisma migrate reset
```

---

## 🔐 Security Notes (Development Only!)

⚠️ **These credentials are for DEVELOPMENT ONLY**. For production:

1. Use strong random passwords
2. Enable SSL/TLS certificates
3. Use environment variables from secure vaults
4. Restrict network access
5. Enable firewall rules
6. Rotate secrets regularly
7. Enable database encryption
8. Use VPNs for remote access

---

## 📈 Performance Tuning

### PostgreSQL

```sql
-- Connection pool
max_connections = 200

-- Work memory
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB

-- Checkpoint tuning
checkpoint_timeout = 10min
checkpoint_completion_target = 0.9
```

### Redis

```bash
# Memory limit
maxmemory 256mb
maxmemory-policy allkeys-lru

# Persistence (AOF)
appendonly yes
appendfsync everysec
```

---

## 🧹 Cleanup

### Remove All Containers & Volumes

```bash
docker-compose -f docker-compose.dev-alt.yml down -v --remove-orphans
```

### Rebuild Images

```bash
docker-compose -f docker-compose.dev-alt.yml build --no-cache
```

### Prune Unused Resources

```bash
# Remove all unused images
docker image prune -a

# Remove all unused volumes
docker volume prune

# Remove all unused networks
docker network prune
```

---

## 📚 Resources

- [Docker Compose Docs](https://docs.docker.com/compose/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Redis Docs](https://redis.io/documentation)
- [Prometheus Docs](https://prometheus.io/docs/)
- [Grafana Docs](https://grafana.com/docs/)
- [MinIO Docs](https://docs.min.io/)
- [Nginx Docs](https://nginx.org/en/docs/)
- [Prisma Docs](https://www.prisma.io/docs/)

---

**Last Updated**: Listopad 2025  
**Author**: Kilo Code / GitHub Copilot

