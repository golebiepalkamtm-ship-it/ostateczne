# 🚀 Wdrożenie na Home.pl - palkamtm.pl

Przewodnik wdrożenia aplikacji Next.js na hosting home.pl.

## 📋 Informacje o Twoim Hostingu

- **Domena**: palkamtm.pl
- **Serwer**: serwer2562803.home.pl
- **FTP**: serwer2562803.home.pl (port 21)
- **PHP**: 8.4
- **SSL**: Nieaktywny (trzeba włączyć)
- **Przestrzeń**: 2GB / 100GB

## ⚠️ Ważne Uwagi

Home.pl to **shared hosting**, który ma ograniczenia:
- ❌ Brak bezpośredniego dostępu do Docker
- ❌ Ograniczony dostęp do Node.js (może wymagać SSH)
- ✅ FTP dostęp
- ✅ Możliwość włączenia SSL

## 🎯 Rekomendowane Rozwiązanie: Vercel + Home.pl DNS

**Najlepsza opcja** - Vercel hostuje aplikację, a domena wskazuje na Vercel.

### Krok 1: Wdrożenie na Vercel

```bash
# Instalacja Vercel CLI
npm i -g vercel

# Logowanie
vercel login

# Wdrożenie
vercel --prod
```

### Krok 2: Konfiguracja DNS w Home.pl

1. Zaloguj się do **Panelu Klienta Home.pl**
2. Przejdź do: **Domeny** → **palkamtm.pl** → **DNS**
3. Dodaj/zmodyfikuj rekordy:

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

**LUB** (jeśli Vercel poda inne wartości):

```
Type: A
Name: @
Value: [IP z Vercel Dashboard]

Type: CNAME
Name: www
Value: [CNAME z Vercel Dashboard]
```

### Krok 3: Podpięcie Domeny w Vercel

1. Przejdź do [Vercel Dashboard](https://vercel.com/dashboard)
2. Wybierz projekt → **Settings** → **Domains**
3. Dodaj domenę: `palkamtm.pl` i `www.palkamtm.pl`
4. Vercel automatycznie:
   - Skonfiguruje DNS
   - Wystawi certyfikat SSL
   - Skonfiguruje HTTPS

### Krok 4: Zmienne Środowiskowe w Vercel

W Vercel Dashboard:
1. **Settings** → **Environment Variables**
2. Dodaj wszystkie zmienne z `.env.production.local`
3. Ustaw dla: **Production**

---

## 🔄 Alternatywa: Export Statyczny (Ograniczona Funkcjonalność)

Jeśli chcesz użyć bezpośrednio hostingu home.pl, możesz wyeksportować statyczną wersję (ale **nie będzie działać** API routes i funkcje serwerowe).

### Krok 1: Konfiguracja Export Statyczny

Edytuj `next.config.cjs`:

```javascript
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // ... reszta konfiguracji
};
```

### Krok 2: Build i Export

```bash
npm run build
```

Pliki będą w folderze `out/`.

### Krok 3: Upload przez FTP

1. Połącz się przez FTP:
   - Host: `serwer2562803.home.pl`
   - Port: `21`
   - User: `serwer2562803`
   - Password: (Twoje hasło FTP)

2. Prześlij zawartość folderu `out/` do `public_html/` (lub odpowiedniego folderu)

### ⚠️ Ograniczenia

- ❌ API routes nie będą działać
- ❌ Server-side rendering nie będzie działać
- ❌ Funkcje wymagające serwera nie będą działać
- ✅ Tylko statyczne strony

---

## 🔒 Włączenie SSL na Home.pl

### Opcja 1: Let's Encrypt (Darmowy)

1. Panel Klienta → **Domeny** → **palkamtm.pl**
2. **Certyfikaty SSL** → **Let's Encrypt**
3. Kliknij **Aktywuj**
4. Certyfikat zostanie automatycznie wystawiony

### Opcja 2: Przekierowanie HTTP → HTTPS

Po włączeniu SSL, dodaj w `.htaccess` (jeśli używasz Apache):

```apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

---

## 📧 Konfiguracja Email dla Formularza Kontaktowego

Masz już konta email na home.pl. Skonfiguruj w `.env.production.local`:

```env
EMAIL_SERVER_HOST=serwer2562803.home.pl
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=twoj@email.palkamtm.pl
EMAIL_SERVER_PASSWORD=[hasło do emaila]
EMAIL_FROM=noreply@palkamtm.pl
CONTACT_EMAIL=kontakt@palkamtm.pl
```

### Tworzenie Konta Email

1. Panel Klienta → **Konta e-mail**
2. **Utwórz nowe konto**
3. Nazwa: `kontakt` lub `noreply`
4. Domena: `palkamtm.pl`
5. Ustaw hasło

---

## 🗄️ Baza Danych

Home.pl oferuje MySQL/PostgreSQL. Sprawdź w panelu:

1. Panel Klienta → **Bazy danych**
2. Utwórz bazę PostgreSQL (jeśli dostępna)
3. Zapisz dane połączenia:
   - Host: (zwykle `localhost` lub `serwer2562803.home.pl`)
   - Port: `5432`
   - Database: (nazwa bazy)
   - User: (użytkownik bazy)
   - Password: (hasło bazy)

### Konfiguracja DATABASE_URL

```env
DATABASE_URL="postgresql://user:password@serwer2562803.home.pl:5432/nazwa_bazy"
```

**UWAGA**: Jeśli PostgreSQL nie jest dostępny, możesz użyć zewnętrznej bazy:
- **Supabase** (darmowy tier)
- **Railway** (darmowy tier)
- **Neon** (darmowy tier)

---

## 🚀 Rekomendowany Workflow

### 1. Baza Danych (Zewnętrzna - Zalecane)

Użyj zewnętrznej bazy danych, np. Supabase:

1. Zarejestruj się na [supabase.com](https://supabase.com)
2. Utwórz nowy projekt
3. Skopiuj `DATABASE_URL`
4. Dodaj do zmiennych środowiskowych w Vercel

### 2. Wdrożenie na Vercel

```bash
# W projekcie
vercel --prod
```

### 3. Konfiguracja DNS

W Home.pl ustaw rekordy A/CNAME wskazujące na Vercel (jak wyżej).

### 4. Email

Użyj konta email z home.pl dla formularza kontaktowego.

---

## ✅ Checklist Wdrożenia

- [ ] Konto Vercel utworzone
- [ ] Aplikacja wdrożona na Vercel
- [ ] Wszystkie zmienne środowiskowe ustawione w Vercel
- [ ] Baza danych skonfigurowana (Supabase/Railway/Neon)
- [ ] Migracje bazy danych wykonane
- [ ] DNS w Home.pl skonfigurowany
- [ ] Domena podpięta w Vercel
- [ ] SSL aktywny (automatycznie przez Vercel)
- [ ] Email skonfigurowany
- [ ] Test formularza kontaktowego
- [ ] Test logowania/rejestracji
- [ ] Test aukcji

---

## 🔧 Troubleshooting

### Problem: DNS nie działa

**Rozwiązanie:**
- Poczekaj 24-48h na propagację DNS
- Sprawdź: `nslookup palkamtm.pl`
- Sprawdź rekordy w Home.pl

### Problem: SSL nie działa

**Rozwiązanie:**
- Jeśli używasz Vercel - SSL jest automatyczny
- Jeśli używasz home.pl - włącz Let's Encrypt w panelu

### Problem: Baza danych nie łączy się

**Rozwiązanie:**
- Sprawdź czy PostgreSQL jest dostępny na home.pl
- Jeśli nie - użyj zewnętrznej bazy (Supabase)
- Sprawdź firewall i dostęp z zewnątrz

### Problem: Email nie wysyła się

**Rozwiązanie:**
- Sprawdź dane SMTP w Home.pl
- Użyj portu 587 (TLS) lub 465 (SSL)
- Sprawdź czy konto email istnieje

---

## 📞 Wsparcie

- **Home.pl**: [pomoc.home.pl](https://pomoc.home.pl)
- **Vercel**: [vercel.com/docs](https://vercel.com/docs)
- **Supabase**: [supabase.com/docs](https://supabase.com/docs)

---

**Powodzenia z wdrożeniem! 🚀**

