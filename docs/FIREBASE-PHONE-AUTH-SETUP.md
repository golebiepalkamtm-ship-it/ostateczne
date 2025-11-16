# Konfiguracja Firebase Phone Verification

**Uwaga**: To jest **Phone Verification** (weryfikacja numeru telefonu jako część profilu), nie Multi-Factor Authentication (MFA).

## Krok 1: Włącz Phone Authentication w Firebase Console

1. Przejdź do [Firebase Console](https://console.firebase.google.com/)
2. Wybierz swój projekt (`pigeon-aucion`)
3. Przejdź do **Authentication** → **Sign-in method**
4. Kliknij **Phone** i włącz ten provider
5. W sekcji **Phone numbers for testing** możesz dodać testowe numery telefonów (opcjonalnie)

## Krok 2: Skonfiguruj zmienne środowiskowe

Upewnij się, że w pliku `.env` (lub `.env.local`) masz skonfigurowane:

```env
# Firebase Configuration (WYMAGANE)
NEXT_PUBLIC_FIREBASE_API_KEY="your-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="pigeon-aucion.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="pigeon-aucion"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="pigeon-aucion.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"

# Firebase Admin SDK (WYMAGANE dla weryfikacji po stronie serwera)
FIREBASE_PROJECT_ID="pigeon-aucion"
FIREBASE_CLIENT_EMAIL="your-service-account-email"
FIREBASE_PRIVATE_KEY="your-private-key"
```

## Krok 3: ReCAPTCHA Configuration

Firebase Phone Authentication wymaga reCAPTCHA do weryfikacji użytkownika.

1. W Firebase Console → **Authentication** → **Settings** → **Authorized domains**
2. Dodaj domeny, na których aplikacja będzie działać:
   - `localhost` (dla developmentu)
   - Twoja domena produkcyjna (np. `pigeon-aucion.firebaseapp.com`)

## Krok 4: Jak to działa

Aplikacja używa **Firebase Phone Verification** (nie MFA):

1. **Wysyłanie SMS**:
   - Użytkownik jest już zalogowany (email/hasło)
   - Użytkownik wprowadza numer telefonu w profilu
   - Firebase Phone Auth SDK automatycznie wysyła SMS z kodem weryfikacyjnym
   - Używamy `PhoneAuthProvider.verifyPhoneNumber()` - **bez logowania użytkownika**

2. **Weryfikacja kodu**:
   - Użytkownik wprowadza kod otrzymany w SMS
   - Firebase weryfikuje kod przez `PhoneAuthProvider.credential()`
   - Po pomyślnej weryfikacji aktualizujemy status `isPhoneVerified = true` w bazie danych
   - **Użytkownik pozostaje zalogowany jako wcześniej**

## Wymagane uprawnienia w Firebase

- **Plan Firebase**: Dla produkcji wymagany jest plan **Blaze** (płatny) do wysyłania SMS
- **Limity SMS**: Sprawdź limity w Firebase Console → Usage and billing

## Testowanie

1. **Numery testowe**: W Firebase Console → Authentication → Sign-in method → Phone → możesz dodać numery testowe, które otrzymają kod `123456`
2. **Environment**: W środowisku deweloperskim możesz testować z numerami testowymi bez kosztów SMS

## Troubleshooting

### SMS nie są wysyłane

- Sprawdź czy Phone Authentication jest włączone w Firebase Console
- Sprawdź czy jesteś na planie Blaze (wymagane dla produkcji)
- Sprawdź limity SMS w Firebase Console

### Błąd reCAPTCHA

- Sprawdź czy domena jest dodana w Authorized domains
- Sprawdź czy reCAPTCHA jest poprawnie załadowana w przeglądarce

### Kod weryfikacyjny nie działa

- Sprawdź czy kod został wprowadzony poprawnie (6 cyfr)
- Sprawdź czy kod nie wygasł (Firebase ma własne limity czasowe)
- Sprawdź logi w konsoli przeglądarki i serwera
