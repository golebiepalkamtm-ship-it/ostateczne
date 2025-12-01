# 🔥 Konfiguracja Firebase - Konkretne Kroki

## ✅ CO MASZ JUŻ SKONFIGUROWANE:

### Firebase Admin SDK (✅ Gotowe):

```
FIREBASE_PROJECT_ID="pigeon-aucion-41d68"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-fbsvc@pigeon-aucion-41d68.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="..." (z pliku JSON)
```

## ⚠️ CO MUSISZ SPRAWDZIĆ W FIREBASE CONSOLE:

### 1. Sprawdź Client SDK values:

1. Otwórz: https://console.firebase.google.com/
2. Projekt: **mtm-62972**
3. ⚙️ **Settings** → **Project settings**
4. **Your apps** → kliknij aplikację web (lub utwórz jeśli nie ma)
5. Skopiuj wartości z sekcji **SDK setup and configuration** → **npm**

### 2. Porównaj z `.env.local`:

Sprawdź czy w `.env.local` są **dokładnie** te same wartości:

- `NEXT_PUBLIC_FIREBASE_API_KEY` = powinno być z Firebase Console
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` = `mtm-62972.firebaseapp.com`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` = `mtm-62972`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` = `mtm-62972.firebasestorage.app`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` = powinno być z Firebase Console
- `NEXT_PUBLIC_FIREBASE_APP_ID` = powinno być z Firebase Console

### 3. Włącz Phone Authentication:

1. **Authentication** → **Sign-in method**
2. Kliknij **Phone**
3. Włącz **Enable**
4. **Save**

### 4. Dodaj Authorized Domains:

1. **Authentication** → **Settings** (⚙️)
2. **Authorized domains** → **Add domain**
3. Dodaj: `192.168.177.1` (lub twoje lokalne IP)
4. **Done**

---

## ✅ Sprawdź czy działa:

1. Restart serwera: `Ctrl+C` potem `npm run dev`
2. W terminalu powinieneś zobaczyć:
   ```
   ✅ Firebase Admin SDK initialized successfully
   ```
3. Jeśli nie - sprawdź `.env.local` czy wszystkie wartości są poprawne

---

## 📝 Szablon `.env.local`:

```env
# Firebase Configuration (Client SDK - z Firebase Console)
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy..." # ⚠️ SPRAWDŹ W FIREBASE CONSOLE
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="mtm-62972.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="mtm-62972"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="mtm-62972.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="151771999775" # ⚠️ SPRAWDŹ W FIREBASE CONSOLE
NEXT_PUBLIC_FIREBASE_APP_ID="1:151771999775:web:..." # ⚠️ SPRAWDŹ W FIREBASE CONSOLE

# Firebase Admin SDK (✅ JUŻ MASZ)
FIREBASE_PROJECT_ID="pigeon-aucion-41d68"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-fbsvc@pigeon-aucion-41d68.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

---

## 🚀 Po konfiguracji:

1. Restart serwera: `npm run dev`
2. Sprawdź logi w terminalu
3. Przetestuj weryfikację telefonu w aplikacji
