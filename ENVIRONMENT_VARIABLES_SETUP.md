# Plan konfiguracji zmiennych środowiskowych - my-prisma-postgres-app

## Status: ROZPOCZĘTE
Czas rozpoczęcia: 2025-12-13 17:14:02

## Kroki do wykonania:

- [ ] 1. Konfiguracja lokalnych zmiennych środowiskowych
  - .env - SQLite dla lokalnego rozwoju
  - .env.development.local - konfiguracja development
  - .env.production - konfiguracja produkcyjna (PostgreSQL)

- [ ] 2. Konfiguracja bazy danych PostgreSQL
  - Utworzenie pliku .env.production z DATABASE_URL
  - Konfiguracja schematu Prisma dla PostgreSQL
  - Przygotowanie instrukcji migracji

- [ ] 3. Konfiguracja Vercel Environment Variables
  - Konfiguracja zmiennych w panelu Vercel
  - Ustawienie DATABASE_URL dla production
  - Ustawienie innych wymaganych zmiennych

- [ ] 4. Test konfiguracji
  - Test lokalny z SQLite
  - Test z PostgreSQL (gdy dostępny)
  - Weryfikacja deployment w Vercel

## Uwagi techniczne:
- Aktualnie używamy SQLite dla prostoty lokalnego rozwoju
- W produkcji zalecane PostgreSQL dla skalowalności
- Zmienne środowiskowe muszą być poprawnie skonfigurowane w Vercel
- DATABASE_URL jest kluczową zmienną dla Prisma
