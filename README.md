# Pałka MTM – PROD-READY STACK ⚡️

## Kluczowe technologie:

- Next.js 14
- PWA (next-pwa)
- Monitoring: Sentry, Prometheus, Grafana
- API smart cache: Redis
- Testy E2E: Playwright
- Micro-interakcje: framer-motion
- Accessibility standard
- Feature flags (lib/features.ts)
- Canary ready, docker ready, cloud native

## Healthcheck

GET `/api/health` → `{ status: 'ok', timestamp: ... }`

## Feature flags

- Plik: `lib/features.ts`
- Użycie: `isFeatureEnabled('animatedHomepage')`

## Monitoring/observability

- Sentry (`sentry.client|server.config.ts`): DSN do `.env.local`
- Prometheus dashboard: http://localhost:9090
- Grafana z Prometheus: http://localhost:4000

## Caching

- **Redis (OPCJONALNY)**: zwiększa wydajność, ale NIE jest wymagany
- Aplikacja działa z in-memory cache jeśli Redis nie jest dostępny
- Endpointy listingów (np. auctions) – wrapper `withRedisCache`
- Setup guide: `docs/REDIS-SETUP.md`
- Aby włączyć: uncomment `REDIS_URL` w `.env.local`

## Testy

- Playwright: `npm run test:e2e` / katalog `e2e/`

## Build & deploy

- Build: `npm run build`
- Start prod: `npm start` lub Docker (`docker build -t palka-mtm . && docker run -p 3000:3000 palka-mtm`)

## Debugowanie

- Error logs: `logs/app.log`

## CI/CD ready (GitHub Actions)

Możesz od razu dodać workflow `.github/workflows/ci.yml`:

```yaml
name: CI/CD
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Node
        uses: actions/setup-node@v3
        with: { node-version: 18 }
      - run: npm ci
      - run: npm run build
      - run: npx playwright install --with-deps
      - run: npx playwright test
  docker:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v3
      - run: docker build -t user/palka-mtm:${{ github.sha }} .
      - name: Login to registry (opcjonalnie)
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
      - run: docker push user/palka-mtm:${{ github.sha }}
```

---

## Szybki test i debug produkcji (checklista):

1. Healthcheck: odwiedź `/api/health` → **OK**
2. Test E2E: `npx playwright test` → wszystko **pass**
3. Monitoring: zaloguj się do Grafana (http://localhost:4000) + Prometheus (http://localhost:9090)
4. Sentry: wyrzuć error na stronie/API (`throw new Error('test')`) i sprawdź dashboard sentry.io
5. PWA: DevTools → Apka działa offline, Lighthouse PWA >95
6. Redis cache: wywołaj GET /api/auctions parę razy – pierwszy wolniej, kolejne szybciej (logi Redis)

Projekt gotowy na produkcję! 🎉
