# 🔑 Instrukcja Konfiguracji Firebase Admin SDK

## Problem

Link weryfikacyjny email nie działa, ponieważ `FIREBASE_PRIVATE_KEY` w pliku `.env` jest obcięty (tylko 129 znaków zamiast ~1700).

## Rozwiązanie Krok Po Kroku

### Krok 1: Przejdź do Firebase Console

1. Otwórz: https://console.firebase.google.com/
2. Wybierz projekt: **pigeon-aucion-41d68**

### Krok 2: Znajdź Service Accounts

1. Kliknij **⚙️ Project Settings** (Ustawienia projektu) w lewym dolnym rogu
2. Wybierz zakładkę **Service Accounts** (Konta usług) na górze

**NIE** "General" ani "Cloud Messaging" - musi być **Service Accounts**!

### Krok 3: Wygeneruj Nowy Klucz

Na dole strony znajdziesz:

```
Admin SDK configuration snippet

Node.js  |  Python  |  Java  |  Go

Your service account:
firebase-adminsdk-fbsvc@pigeon-aucion-41d68.iam.gserviceaccount.com
```

Pod tym będzie przycisk:

**🔴 "Generate new private key"**

1. Kliknij ten przycisk
2. Pojawi się ostrzeżenie:
   > "This key will allow access to your Firebase project. Keep it confidential..."
3. Kliknij **"Generate Key"**
4. Pobierze się plik: `pigeon-aucion-41d68-firebase-adminsdk-xxxxx.json`

### Krok 4: Otwórz Pobrany Plik JSON

Plik będzie zawierał:

```json
{
  "type": "service_account",
  "project_id": "pigeon-aucion-41d68",
  "private_key_id": "abc123def456...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n[DUŻO WIĘCEJ TEKSTU - około 1700 znaków]\n...==\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fbsvc@pigeon-aucion-41d68.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

### Krok 5: Zaktualizuj Plik .env

1. Otwórz plik `.env` w głównym folderze projektu
2. Znajdź linię z `FIREBASE_PRIVATE_KEY`
3. Skopiuj **CAŁĄ** wartość `"private_key"` z pliku JSON
4. Wklej w `.env`:

```bash
# KONFIGURACJA FIREBASE (ADMIN SDK - SERWER)
FIREBASE_PROJECT_ID=pigeon-aucion-41d68
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@pigeon-aucion-41d68.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...[CAŁY KLUCZ Z JSON]...==\n-----END PRIVATE KEY-----\n"
```

## ⚠️ WAŻNE WSKAZÓWKI

### ✅ POPRAWNIE:

```bash
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCqZQk...[1500+ znaków więcej]...3vTM+k9w==\n-----END PRIVATE KEY-----\n"
```

- Klucz w cudzysłowach `"..."`
- Zachowane `\n` (nie prawdziwe nowe linie!)
- Od `-----BEGIN` do `-----END PRIVATE KEY-----\n`
- Około **1700 znaków** w całości

### ❌ BŁĘDNIE:

```bash
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCD097Bba/5vqIu\nyI
aaXqsK..."
```

- Za krótki (tylko 129 znaków)
- Obcięty w połowie

## Krok 6: Restart Serwera

```bash
# Zatrzymaj serwer deweloperski (Ctrl+C w terminalu)

# Uruchom ponownie:
npm run dev
```

## Krok 7: Weryfikacja

Po restarcie serwera sprawdź logi w terminalu:

### ✅ POPRAWNIE - Powinieneś zobaczyć:

```
info: 🔧 Initializing Firebase Admin SDK...
info: ✅ Firebase Admin SDK initialized successfully
```

### ❌ BŁĘDNIE - Jeśli nadal widzisz:

```
error: ❌ Firebase Admin SDK not initialized!
error: Skonfiguruj FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
```

To znaczy że:

- Klucz jest nadal obcięty
- Lub zawiera błędny format
- Lub serwer nie został zrestartowany

## Krok 8: Test Weryfikacji Email

Po poprawnej konfiguracji:

1. Wyślij ponownie email weryfikacyjny z dashboardu
2. Kliknij w link w emailu
3. Powinno zadziałać! ✅

Zamiast błędu:

> ❌ Link weryfikacyjny jest nieprawidłowy lub wygasł

Zobaczysz:

> ✅ Email został pomyślnie zweryfikowany!

---

## 🔐 Bezpieczeństwo

**NIGDY** nie commituj pliku `.env` do repozytorium!

Upewnij się że `.gitignore` zawiera:

```
.env
.env.local
.env.*.local
```

Klucz prywatny daje pełny dostęp administratora do Twojego projektu Firebase!

---

## 🆘 Nadal Nie Działa?

Jeśli po wykonaniu wszystkich kroków nadal nie działa, sprawdź:

### 1. Długość klucza

```bash
# W PowerShell w folderze projektu:
(Get-Content .env | Select-String "FIREBASE_PRIVATE_KEY").Line.Length
```

Powinno zwrócić około **1700-1800** (nie 129!)

### 2. Format klucza

Klucz musi:

- Zaczynać się od `"-----BEGIN PRIVATE KEY-----\n`
- Kończyć się na `\n-----END PRIVATE KEY-----\n"`
- Mieć `\n` (nie prawdziwe nowe linie w środku)
- Być w cudzysłowach

### 3. Logi serwera

Sprawdź terminal po uruchomieniu `npm run dev`:

```
debug: 🔧 Firebase Admin SDK initialization check:
debug: - FIREBASE_PROJECT_ID: SET
debug: - FIREBASE_CLIENT_EMAIL: SET
debug: - FIREBASE_PRIVATE_KEY: SET
info: 🔧 Initializing Firebase Admin SDK...
info: ✅ Firebase Admin SDK initialized successfully
```

### 4. Test API

Otwórz w przeglądarce narzędzia deweloperskie (F12) → Console

Po zalogowaniu sprawdź:

```javascript
fetch('/api/auth/sync', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer ' + (await firebase.auth().currentUser.getIdToken()),
  },
})
  .then(r => r.json())
  .then(console.log);
```

Powinno zwrócić:

```json
{
  "success": true,
  "user": {...}
}
```

Nie:

```json
{
  "error": "Nieautoryzowany dostęp"
}
```

---

## 📚 Dodatkowe Zasoby

- [Firebase Admin SDK Setup](https://firebase.google.com/docs/admin/setup)
- [Service Account Credentials](https://cloud.google.com/iam/docs/service-accounts)
- [Environment Variables in Next.js](https://nextjs.org/docs/basic-features/environment-variables)
