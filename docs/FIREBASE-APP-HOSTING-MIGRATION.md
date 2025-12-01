# Migracja na Firebase App Hosting

## Przegląd

Aplikacja została skonfigurowana do deploymentu na **Firebase App Hosting**, które wspiera Next.js z API Routes, SSR i ISR.

## Zalety Firebase App Hosting

1. **Pełne wsparcie Next.js** - API Routes, SSR, ISR działają bez problemów
2. **Integracja z Firebase** - Auth, Firestore, Storage działają bezpośrednio
3. **Automatyczny SSL** - HTTPS na domenie niestandardowej
4. **CDN globalny** - Szybkie ładowanie na całym świecie
5. **Automatyczne skalowanie** - Obsługuje ruch bez konfiguracji

## Wymagania

1. **Firebase CLI** zainstalowany globalnie:
   ```bash
   npm install -g firebase-tools
   ```

2. **Zalogowanie do Firebase**:
   ```bash
   firebase login
   ```

3. **Projekt Firebase** skonfigurowany w `.firebaserc`:
   ```json
   {
     "projects": {
       "default": "mtm-62972"
     }
   }
   ```

4. **Zmienne środowiskowe** ustawione w Firebase Console lub `.env.production`

## Konfiguracja

### 1. Plik `.apphosting.yaml`

Konfiguracja build i runtime dla Firebase App Hosting:

```yaml
runConfig:
  runtime: nodejs20
  env:
    - variable: NODE_ENV
      value: production

buildConfig:
  commands:
    - npm ci
    - npm run build
  env:
    - variable: NODE_ENV
      value: production
```

### 2. `firebase.json`

Zaktualizowano konfigurację dla App Hosting:

```json
{
  "apphosting": [
    {
      "backendId": "palka-mtm",
      "rootDir": ".",
      "ignore": ["node_modules", ".git", ...]
    }
  ]
}
```

### 3. Zmienne środowiskowe

Ustaw w Firebase Console:
- **Firebase Console** → **App Hosting** → **palka-mtm** → **Environment Variables**

Wymagane zmienne:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXT_PUBLIC_BASE_URL` - https://palkamtm.pl
- `NEXTAUTH_URL` - https://palkamtm.pl
- `NEXTAUTH_SECRET` - secret key
- `NEXT_PUBLIC_FIREBASE_*` - Firebase config (client-side)
- `FIREBASE_*` - Firebase Admin SDK (server-side)

## Deployment

### Pierwszy deployment

1. **Utwórz backend App Hosting** w Firebase Console:
   - Firebase Console → **App Hosting** → **Create backend**
   - Nazwa: `palka-mtm`
   - Runtime: `Node.js 20`
   - Region: `europe-central2` (lub najbliższa)

2. **Deploy aplikacji**:
   ```bash
   npm run deploy:firebase
   ```

   Lub ręcznie:
   ```bash
   firebase deploy --only apphosting
   ```

### Kolejne deploymenty

```bash
npm run deploy:firebase
```

## Konfiguracja domeny niestandardowej

1. **Firebase Console** → **App Hosting** → **palka-mtm** → **Custom domains**

2. **Dodaj domenę** `palkamtm.pl`

3. **Skonfiguruj DNS**:
   - Dodaj rekordy DNS zgodnie z instrukcjami Firebase
   - Zwykle potrzebne są rekordy CNAME lub A

4. **Poczekaj na weryfikację** (zwykle 5-15 minut)

## Porównanie z Vercel

| Feature | Vercel | Firebase App Hosting |
|---------|--------|----------------------|
| Next.js API Routes | ✅ | ✅ |
| SSR/ISR | ✅ | ✅ |
| Custom Domain | ✅ | ✅ |
| SSL/HTTPS | ✅ | ✅ |
| Integracja Firebase | ❌ (trzeba konfigurować) | ✅ (natywna) |
| Firestore | ❌ (trzeba config) | ✅ (bezpośrednio) |
| Firebase Auth | ❌ (trzeba config) | ✅ (natywna) |
| Firebase Storage | ❌ (trzeba config) | ✅ (natywna) |

## Rozwiązywanie problemów

### Build fails

1. Sprawdź logi w Firebase Console
2. Sprawdź czy wszystkie zmienne środowiskowe są ustawione
3. Sprawdź czy `DATABASE_URL` jest dostępny z Firebase App Hosting

### API Routes nie działają

1. Sprawdź czy endpointy są w `app/api/`
2. Sprawdź logi w Firebase Console → App Hosting → Logs
3. Sprawdź czy middleware nie blokuje żądań

### Błąd autoryzacji Firebase

1. Sprawdź czy `NEXT_PUBLIC_FIREBASE_*` są ustawione w Environment Variables
2. Sprawdź czy domena jest dodana do Firebase Authorized Domains
3. Sprawdź czy `FIREBASE_PRIVATE_KEY` jest poprawnie sformatowany (z `\n`)

## Migracja z Vercel

1. **Eksportuj zmienne środowiskowe** z Vercel:
   - Vercel Dashboard → Project → Settings → Environment Variables

2. **Zaimportuj do Firebase**:
   - Firebase Console → App Hosting → Environment Variables

3. **Zaktualizuj `NEXT_PUBLIC_BASE_URL`**:
   - Zmień z `https://palka-mtm.vercel.app` na `https://palkamtm.pl`

4. **Zaktualizuj `NEXTAUTH_URL`**:
   - Zmień na `https://palkamtm.pl`

5. **Deploy na Firebase**:
   ```bash
   npm run deploy:firebase
   ```

6. **Skonfiguruj domenę** w Firebase App Hosting

7. **Przetestuj** aplikację na nowej domenie

## Monitoring

- **Firebase Console** → **App Hosting** → **palka-mtm** → **Metrics**
- **Firebase Console** → **App Hosting** → **palka-mtm** → **Logs**

## Koszty

Firebase App Hosting używa **pay-as-you-go** pricing:
- Build time: $0.003 per minute
- Request time: $0.00000125 per GB-second
- Storage: $0.026 per GB/month

Szacunkowy koszt dla małej aplikacji: **$0-10/miesiąc**

## Następne kroki

1. ✅ Konfiguracja Firebase App Hosting
2. ⏳ Deploy aplikacji na Firebase
3. ⏳ Konfiguracja domeny niestandardowej
4. ⏳ Przetestowanie wszystkich funkcji
5. ⏳ Migracja DNS z Vercel na Firebase (jeśli używane)

