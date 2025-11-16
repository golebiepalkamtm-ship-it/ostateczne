# Konfiguracja Firebase Phone Verification - Krok po Kroku

## KROK 1: Otwórz Firebase Console

1. Przejdź do: https://console.firebase.google.com/
2. Zaloguj się swoim kontem Google
3. Wybierz projekt **`pigeon-aucion-41d68`** (lub sprawdź `.firebaserc` - może być inny projekt)

---

## KROK 2: Włącz Phone Authentication

1. W lewym menu kliknij **Authentication**
2. Kliknij zakładkę **Sign-in method**
3. W liście dostawców znajdź **Phone** i kliknij na niego
4. Włącz przełącznik **Enable**
5. **Zapisz** zmiany (przycisk "Save" na dole)

✅ **Gotowe!** Phone Authentication jest teraz włączone.

---

## KROK 3: Skonfiguruj Authorized Domains (WAŻNE!)

Firebase wymaga dodania domen, na których aplikacja będzie działać.

1. W **Authentication** → **Settings** (ikona koła zębatego)
2. Przewiń do sekcji **Authorized domains**
3. Kliknij **Add domain**

### Dodaj domeny:

**Dla developmentu:**

- `localhost` (powinno być już dodane)
- `192.168.177.1` (twój lokalny adres IP - sprawdź w terminalu `ipconfig`)

**Dla produkcji:**

- Twoja domena produkcyjna (np. `pigeon-aucion.firebaseapp.com`)
- Inne domeny gdzie aplikacja będzie działać

4. Kliknij **Done** po każdej domenie

✅ **Gotowe!** Twoje domeny są autoryzowane.

---

## KROK 4: (Opcjonalnie) Dodaj Numery Testowe

**Dla testowania bez kosztów SMS:**

1. W **Authentication** → **Sign-in method** → **Phone**
2. Przewiń do sekcji **Phone numbers for testing**
3. Kliknij **Add phone number**
4. Dodaj numer w formacie: `+48123456789` (z kodem kraju)
5. Kod weryfikacyjny: zawsze `123456` (dla numerów testowych)

✅ **Gotowe!** Numery testowe będą zawsze otrzymywać kod `123456`.

---

## KROK 5: Pobierz Klucze Firebase Configuration

### A) Klucze publiczne (dla klienta)

1. W Firebase Console kliknij ikonę **⚙️ Settings** (obok "Project Overview")
2. Kliknij **Project settings**
3. Przewiń do sekcji **Your apps**
4. Jeśli masz już aplikację web - kliknij na nią
5. Jeśli nie - kliknij ikonę **`</>`** (Web) i utwórz nową
6. Skopiuj wartości z sekcji **SDK setup and configuration** → **npm**:

```javascript
apiKey: 'AIzaSy...';
authDomain: 'pigeon-aucion.firebaseapp.com';
projectId: 'pigeon-aucion';
storageBucket: 'pigeon-aucion.firebasestorage.app';
messagingSenderId: '151771999775';
appId: '1:151771999775:web:...';
```

### B) Klucze Admin SDK (dla serwera)

1. W **Project settings** → **Service accounts**
2. Kliknij **Generate new private key**
3. Pobierz plik JSON (zawiera wszystkie potrzebne klucze)
4. **UWAGA**: Nie udostępniaj tego pliku!

---

## KROK 6: Skonfiguruj Zmienne Środowiskowe

Utwórz plik `.env.local` w głównym katalogu projektu (`wwwwww/`):

```env
# Firebase Configuration (z Firebase Console → Project Settings → Your apps)
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy..." # z apiKey
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="pigeon-aucion.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="pigeon-aucion"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="pigeon-aucion.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="151771999775"
NEXT_PUBLIC_FIREBASE_APP_ID="1:151771999775:web:..."

# Firebase Admin SDK (z pobranego pliku JSON)
FIREBASE_PROJECT_ID="pigeon-aucion"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@pigeon-aucion.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**Ważne:**

- `FIREBASE_PRIVATE_KEY` - skopiuj cały klucz z pliku JSON (z `\n` na końcu każdej linii)
- Jeśli klucz jest w formacie `"-----BEGIN PRIVATE KEY-----\\n..."` → zamień `\\n` na `\n`

---

## KROK 7: Sprawdź Plan Firebase (dla Produkcji)

**Dla rozwoju/testowania:**

- Możesz używać numerów testowych (bez kosztów)

**Dla produkcji:**

1. W Firebase Console → **Usage and billing**
2. Sprawdź aktualny plan
3. **Wymagany plan Blaze** (płatny) do wysyłania rzeczywistych SMS
4. Możesz założyć konto z bezpłatnym limitem, ale potem musisz przejść na Blaze

---

## KROK 8: Testowanie

### Test lokalny:

1. Uruchom aplikację: `npm run dev`
2. Zaloguj się
3. Przejdź do profilu/dashboard
4. Kliknij "Zweryfikuj numer telefonu"
5. Wprowadź numer testowy (z Kroku 4) lub własny numer
6. Jeśli używasz numeru testowego → kod zawsze `123456`
7. Jeśli używasz własnego numeru → otrzymasz SMS z kodem

### Sprawdzanie logów:

- **Konsola przeglądarki** (F12) → sprawdź czy są błędy
- **Terminal serwera** → sprawdź logi backend

---

## Troubleshooting

### ❌ SMS nie przychodzą

**Sprawdź:**

1. Czy Phone Authentication jest włączone? (Krok 2)
2. Czy domena jest dodana w Authorized domains? (Krok 3)
3. Czy jesteś na planie Blaze? (Krok 7 - dla produkcji)
4. Czy zmienne środowiskowe są poprawne? (Krok 6)
5. Sprawdź Firebase Console → **Usage and billing** → czy są limity SMS

### ❌ Błąd reCAPTCHA

**Sprawdź:**

1. Czy domena jest w Authorized domains?
2. Czy reCAPTCHA ładuje się w konsoli przeglądarki?
3. Spróbuj wyczyścić cache przeglądarki

### ❌ "Invalid API key"

**Sprawdź:**

1. Czy `NEXT_PUBLIC_FIREBASE_API_KEY` jest poprawne?
2. Czy restartowałeś serwer dev po dodaniu `.env.local`?
3. Czy wszystkie zmienne `NEXT_PUBLIC_*` są ustawione?

### ❌ "Firebase Admin SDK not initialized"

**Sprawdź:**

1. Czy `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` są ustawione?
2. Czy `FIREBASE_PRIVATE_KEY` ma `\n` zamiast `\\n`?
3. Czy klucz zaczyna się od `-----BEGIN PRIVATE KEY-----`?

---

## Gotowe! 🎉

Twoja aplikacja jest teraz skonfigurowana z Firebase Phone Verification!

**Następne kroki:**

1. Przetestuj weryfikację z numerem testowym
2. Sprawdź czy status `isPhoneVerified` aktualizuje się w bazie danych
3. Przetestuj z prawdziwym numerem (jeśli masz plan Blaze)

---

## Pomocne linki

- [Firebase Console](https://console.firebase.google.com/)
- [Dokumentacja Firebase Phone Auth](https://firebase.google.com/docs/auth/web/phone-auth)
- [Firebase Pricing](https://firebase.google.com/pricing)
