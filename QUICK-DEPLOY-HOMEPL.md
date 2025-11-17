# ⚡ Szybki Start - Wdrożenie na Home.pl

## 🎯 Najlepsze Rozwiązanie: Vercel + Home.pl DNS

### Krok 1: Wdrożenie na Vercel (5 minut)

```bash
# Instalacja Vercel CLI (jeśli nie masz)
npm i -g vercel

# Logowanie
vercel login

# Wdrożenie
npm run deploy:vercel
```

### Krok 2: Konfiguracja DNS w Home.pl

1. **Zaloguj się** do Panelu Klienta Home.pl
2. Przejdź: **Domeny** → **palkamtm.pl** → **DNS**
3. **Usuń stare rekordy** (jeśli są)
4. **Dodaj nowe rekordy**:

```
Type: A
Name: @
Value: 76.76.21.21
TTL: 3600

Type: CNAME  
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

**UWAGA**: Po wdrożeniu na Vercel, sprawdź w Vercel Dashboard jakie dokładne wartości powinny być (mogą się różnić).

### Krok 3: Podpięcie Domeny w Vercel

1. Otwórz [Vercel Dashboard](https://vercel.com/dashboard)
2. Wybierz swój projekt
3. **Settings** → **Domains**
4. Kliknij **Add Domain**
5. Wpisz: `palkamtm.pl` i `www.palkamtm.pl`
6. Vercel pokaże dokładne wartości DNS do ustawienia

### Krok 4: Zmienne Środowiskowe

W Vercel Dashboard:
1. **Settings** → **Environment Variables**
2. Dodaj wszystkie zmienne z `.env.production.local`:

```env
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://palkamtm.pl
NEXTAUTH_SECRET=[wygeneruj: openssl rand -base64 32]
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...
EMAIL_SERVER_HOST=serwer2562803.home.pl
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=kontakt@palkamtm.pl
EMAIL_SERVER_PASSWORD=[hasło do emaila]
EMAIL_FROM=noreply@palkamtm.pl
CONTACT_EMAIL=kontakt@palkamtm.pl
```

### Krok 5: Baza Danych

**Zalecane: Supabase (darmowe)**

1. Zarejestruj się: [supabase.com](https://supabase.com)
2. Utwórz nowy projekt
3. Skopiuj `DATABASE_URL` z Settings → Database
4. Dodaj do zmiennych środowiskowych w Vercel
5. Uruchom migracje:

```bash
DATABASE_URL="postgresql://..." npx prisma migrate deploy
```

### Krok 6: Email na Home.pl

1. Panel Klienta → **Konta e-mail**
2. **Utwórz nowe konto**:
   - Nazwa: `kontakt`
   - Domena: `palkamtm.pl`
   - Hasło: (ustaw silne hasło)
3. Użyj tego konta w zmiennych środowiskowych

### Krok 7: SSL

✅ **Automatycznie przez Vercel** - nie musisz nic robić!

---

## ✅ Checklist

- [ ] Vercel CLI zainstalowany
- [ ] Aplikacja wdrożona na Vercel
- [ ] DNS skonfigurowany w Home.pl
- [ ] Domena podpięta w Vercel
- [ ] Zmienne środowiskowe ustawione
- [ ] Baza danych skonfigurowana (Supabase)
- [ ] Migracje wykonane
- [ ] Konto email utworzone
- [ ] Test strony: https://palkamtm.pl

---

## 🔧 Problemy?

### DNS nie działa
- Poczekaj 24-48h na propagację
- Sprawdź: `nslookup palkamtm.pl`

### SSL nie działa
- Vercel automatycznie wystawia SSL
- Poczekaj kilka minut po dodaniu domeny

### Baza danych nie łączy się
- Sprawdź `DATABASE_URL`
- Sprawdź czy baza jest dostępna publicznie (Supabase domyślnie tak)

---

## 📚 Pełna Dokumentacja

Szczegółowy przewodnik: `docs/DEPLOYMENT-HOMEPL.md`

---

**Gotowe! 🚀**

Po wykonaniu tych kroków Twoja strona będzie dostępna pod adresem:
**https://palkamtm.pl**

