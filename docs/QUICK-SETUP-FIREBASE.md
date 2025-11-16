# 🚀 Szybka Konfiguracja Firebase Phone Verification

## KROK 1️⃣: Włącz Phone Auth w Firebase Console

1. Otwórz: https://console.firebase.google.com/
2. Wybierz projekt: **pigeon-aucion-41d68**
3. **Authentication** → **Sign-in method** → **Phone** → **Enable** → **Save**

✅ Phone Auth włączone!

---

## KROK 2️⃣: Dodaj Domeny (WAŻNE!)

1. **Authentication** → **Settings** (⚙️) → **Authorized domains**
2. Dodaj:
   - `localhost` (już powinno być)
   - `192.168.177.1` (twój lokalny IP)
3. Kliknij **Done**

✅ Domeny dodane!

---

## KROK 3️⃣: Pobierz Klucze

### A) Klucze Publiczne (Client SDK)

1. **⚙️ Settings** → **Project settings** → **Your apps**
2. Kliknij aplikację web (lub utwórz nową: `</>`)
3. Skopiuj wartości z **SDK setup and configuration** → **npm**

### B) Klucze Admin SDK (Server)

1. **Project settings** → **Service accounts**
2. **Generate new private key** → Pobierz JSON

---

## KROK 4️⃣: Utwórz plik `.env.local`

**Lokalizacja:** `wwwwww/.env.local`

Skopiuj i wypełnij:

```env
# Firebase Client SDK (z Kroku 3A)
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="pigeon-aucion-41d68.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="pigeon-aucion-41d68"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="pigeon-aucion-41d68.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="151771999775"
NEXT_PUBLIC_FIREBASE_APP_ID="1:151771999775:web:..."

# Firebase Admin SDK (z pliku JSON z Kroku 3B)
FIREBASE_PROJECT_ID="pigeon-aucion-41d68"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@pigeon-aucion-41d68.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
```

**⚠️ UWAGA dla `FIREBASE_PRIVATE_KEY`:**

- Jeśli w JSON jest: `"private_key": "-----BEGIN PRIVATE KEY-----\\n..."`
- W `.env.local` użyj: `"-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"`
- Albo zamień wszystkie `\\n` na `\n` (bez podwójnego backslasha)

---

## KROK 5️⃣: Restart Serwera

```bash
# Zatrzymaj serwer (Ctrl+C) i uruchom ponownie
npm run dev
```

---

## KROK 6️⃣: Testowanie

1. Zaloguj się w aplikacji
2. Dashboard → "Zweryfikuj numer telefonu"
3. Wprowadź numer (dla testu możesz dodać numer testowy w Firebase)

### Numer Testowy (Opcjonalnie):

1. **Authentication** → **Sign-in method** → **Phone**
2. **Phone numbers for testing** → **Add phone number**
3. Dodaj: `+48123456789` → Kod zawsze będzie `123456`

---

## ✅ Gotowe!

Sprawdź w terminalu czy widzisz:

```
✅ Firebase Admin SDK initialized successfully
```

Jeśli nie - sprawdź `.env.local` i restart serwera.

---

## 🆘 Problemy?

### "Firebase Admin SDK not initialized"

- Sprawdź czy `.env.local` istnieje w `wwwwww/`
- Sprawdź czy wszystkie 3 zmienne Admin SDK są ustawione
- Sprawdź format `FIREBASE_PRIVATE_KEY` (musi mieć `\n`)

### "Invalid API key"

- Sprawdź `NEXT_PUBLIC_FIREBASE_API_KEY`
- Restart serwera po zmianie `.env.local`

### SMS nie przychodzą

- Sprawdź czy Phone Auth jest włączone
- Sprawdź Authorized domains
- Sprawdź plan Firebase (Blaze dla produkcji)

---

**Szczegółowa dokumentacja:** `docs/KROK-PO-KROKU-FIREBASE-PHONE.md`
