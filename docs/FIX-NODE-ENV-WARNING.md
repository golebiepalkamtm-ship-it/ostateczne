# Naprawienie ostrzeżenia "Non-Standard NODE_ENV"

## Problem

Next.js wyświetla ostrzeżenie:

```
⚠ You are using a non-standard "NODE_ENV" value in your environment.
```

## Przyczyna

Next.js automatycznie ustawia `NODE_ENV`:

- `development` podczas `next dev`
- `production` podczas `next build`
- `test` podczas testów

Ręczne ustawianie `NODE_ENV` może powodować problemy z optymalizacjami Next.js.

## Rozwiązanie

### 1. Sprawdź pliki `.env`

Jeśli masz pliki `.env` lub `.env.local`, sprawdź czy nie zawierają `NODE_ENV`:

```bash
# Sprawdź czy masz NODE_ENV w plikach .env
grep -r "NODE_ENV" .env* 2>/dev/null
```

Jeśli znajdziesz `NODE_ENV`, **usuń tę linię** z plików:

- `.env`
- `.env.local`
- `.env.development`
- `.env.production`

### 2. Sprawdź zmienne środowiskowe systemowe

Na Windows PowerShell:

```powershell
$env:NODE_ENV
```

Na Linux/Mac:

```bash
echo $NODE_ENV
```

Jeśli jest ustawione, usuń:

- Windows PowerShell: `Remove-Item Env:\NODE_ENV`
- Linux/Mac: `unset NODE_ENV`

### 3. Sprawdź pliki konfiguracyjne shell

Jeśli używasz bash/zsh, sprawdź:

- `~/.bashrc`
- `~/.bash_profile`
- `~/.zshrc`

Usuń linie zawierające `export NODE_ENV=...`

## Jeśli potrzebujesz różnych środowisk

Zamiast używać `NODE_ENV`, użyj własnej zmiennej środowiskowej:

```env
# ❌ NIE UŻYWAJ
NODE_ENV="staging"

# ✅ UŻYJ TEGO
APP_ENV="staging"
```

Następnie w kodzie:

```typescript
const environment = process.env.APP_ENV || process.env.NODE_ENV;
```

## Co zostało naprawione w projekcie

1. ✅ Usunięto `NODE_ENV` ze skryptu `dev` w `package.json`
2. ✅ Usunięto `NODE_ENV` z `Dockerfile.dev`
3. ✅ Usunięto `NODE_ENV` z `docker-compose.dev.yml`
4. ✅ Usunięto `NODE_ENV` z `env.production`

## Weryfikacja

Po naprawie, uruchom:

```bash
npm run dev
```

Ostrzeżenie powinno zniknąć.

## Dokumentacja

[Next.js - Non-Standard NODE_ENV](https://nextjs.org/docs/messages/non-standard-node-env)
