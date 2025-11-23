# 🗄️ Konfiguracja PostgreSQL (Cloud SQL) dla Firebase App Hosting

## 📋 Wymagania

- Projekt Firebase: `m-t-m-62972`
- Region: `europe-central2` (Warszawa)
- Database: PostgreSQL 15

---

## 🔧 Krok 1: Utworzenie Cloud SQL Instance

### Opcja A: Przez Firebase Console

1. Otwórz [Firebase Console](https://console.firebase.google.com/project/m-t-m-62972)
2. Przejdź do **Build** → **App Hosting** → **palka-mtm**
3. Kliknij **Settings** → **Cloud SQL**
4. Kliknij **Add Cloud SQL instance**
5. Wypełnij formularz:
   - **Instance ID**: `palka-mtm-db`
   - **Database version**: PostgreSQL 15
   - **Region**: `europe-central2` (Warszawa)
   - **Machine type**: `db-f1-micro` (dla testów) lub `db-g1-small` (produkcja)
   - **Storage**: 20 GB (minimum)
   - **Backup**: Włączone (zalecane)
6. Kliknij **Create**

### Opcja B: Przez Google Cloud Console

1. Otwórz [Google Cloud Console](https://console.cloud.google.com/sql/instances?project=m-t-m-62972)
2. Kliknij **Create Instance**
3. Wybierz **PostgreSQL**
4. Wypełnij:
   - **Instance ID**: `palka-mtm-db`
   - **Password**: Wygeneruj silne hasło (zapisz!)
   - **Region**: `europe-central2`
   - **Database version**: PostgreSQL 15
   - **Machine type**: `db-f1-micro` (test) lub `db-g1-small` (prod)
5. Kliknij **Create**

### Opcja C: Przez gcloud CLI

```powershell
# Ustaw projekt
gcloud config set project m-t-m-62972

# Utwórz Cloud SQL instance
gcloud sql instances create palka-mtm-db `
  --database-version=POSTGRES_15 `
  --tier=db-f1-micro `
  --region=europe-central2 `
  --root-password=YOUR_STRONG_PASSWORD `
  --storage-type=SSD `
  --storage-size=20GB `
  --backup `
  --enable-bin-log
```

---

## 🗃️ Krok 2: Utworzenie Bazy Danych i Użytkownika

### Przez Google Cloud Console

1. Otwórz [Cloud SQL Instances](https://console.cloud.google.com/sql/instances?project=m-t-m-62972)
2. Kliknij na `palka-mtm-db`
3. Przejdź do zakładki **Databases**
4. Kliknij **Create database**:
   - **Database name**: `palkamtm_production`
   - Kliknij **Create**
5. Przejdź do zakładki **Users**
6. Kliknij **Add user account**:
   - **Username**: `palkamtm_user`
   - **Password**: Wygeneruj silne hasło (zapisz!)
   - Kliknij **Add**

### Przez gcloud CLI

```powershell
# Utwórz bazę danych
gcloud sql databases create palkamtm_production `
  --instance=palka-mtm-db

# Utwórz użytkownika
gcloud sql users create palkamtm_user `
  --instance=palka-mtm-db `
  --password=YOUR_STRONG_PASSWORD
```

---

## 🔗 Krok 3: Konfiguracja Połączenia w apphosting.yaml

1. Otwórz `apphosting.yaml`
2. Odkomentuj sekcję `cloudSql` i ustaw:

```yaml
cloudSql:
  connections:
    - instance: m-t-m-62972:europe-central2:palka-mtm-db
```

3. Zapisz plik

---

## 🔐 Krok 4: Konfiguracja Secretów w Cloud Secret Manager

### Utworzenie Secretów

1. Otwórz [Cloud Secret Manager](https://console.cloud.google.com/security/secret-manager?project=m-t-m-62972)
2. Kliknij **Create Secret** dla każdego z poniższych:

#### `database-url`

```
postgresql://palkamtm_user:PASSWORD@/palkamtm_production?host=/cloudsql/m-t-m-62972:europe-central2:palka-mtm-db
```

**Uwaga**: Zastąp `PASSWORD` rzeczywistym hasłem użytkownika.

#### `firebase-project-id`

```
m-t-m-62972
```

#### `firebase-client-email`

```
firebase-adminsdk-fbsvc@m-t-m-62972.iam.gserviceaccount.com
```

#### `firebase-private-key`

```
-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCcRe0BslSnISuR
FcisDVbgkNvz3jekt/z9KI6LsR4ddyBfyH2up0BcEvLuNXwUTsTKxmTSbn1HoG7m
nzDIJrzwL0xLBhzujhAbCfPg0nHYqifiVu0QY27nGh+2MltN9q99rDcdVQfVDSsj
XwiD1py2oX1l5o6PeKsifenacG5tATcexfjnPuxxLdTFyF1LhgMwVNyoPKOvpEsd
bGG8pWtAXW5xiyJTvHcYI5T0I8oLugNCKYazEWbD0Cz5ZCWUDFuo7jHitU+PYhvN
svEiDMySOhmjvdHqR+JvvcBxOnS9241KjTbeZ1adaFLg1E+FxQVfBOkJuJQY4ylX
vHSrXss9AgMBAAECggEAQfUtlJK9MhFI/yKPoTa8HWpmu6ZmG+rgJ8XPbFxkVpFq
I6NOkMHc4z/IMwx2A2g/nUphUYP68plfVY2JHGFlS4bbD6tT2MgzOgZYXeLU1Fr1
HI4N3uXo8DfRfKgCa4ScC1H9rS6vcJfvRi2dPW/+kwLUF4dZUmre6F72rhDYOr8o
hEQW3LAAgBdm40xWJo8gIRKKtGM7xl0o2CCrilt7XY0DqZrZVnYrNOrphCCt7e4g
hkhzhDnL5P5Q6B4Vc0kY2xg3/c9Hb5QnBHzMV/N7d6rl3zMrQ7t9B7R8s0BudKRH
5qtnBr3VjMzYolmpDAp626r55MjPqG2IWdBoSANRzQKBgQDSQCeKegcfM+g2UIOL
PDwae4PR3BRTOdyvGMcv+lxeXXXE/b2ostiaKKimTKHtRCizozFz7v3gR6MHCCtP
ZqPh3Hya5r0HpslSN2j028wKi2Zj144tWCzyHjArZOsUBXJrh3b/RLrVhobOggDs
MS4JJUDh+PAM5isX6B+V4Bf6HwKBgQC+Rv/Wi+F4XvhQG9rnOgZ7Cwdx0IRhb/Mi
IzpeOCC9D/3HeDQHfnwjGJugNZiXibdv4TmjDYxPXWIiK+hQTT1rrt+jm5F3Qgyg
J/tBaTEc/eSDFsx9oIIWPk6sQKeUbUXDjCyzPpj7oxIS1FLE1WnJBFH3BQ9hLT9i
24I72SdHIwKBgQDDA+apNw6sDoVw+7VHzJMjLTXTzgK8P4tGjgETq3FJxf6avZDR
jTIDq3ri5Wm8nd/y34fbNO4evdOljho+B8IymUSqmSL0metaazLbC5Ryo2JRcXra
7FKkMQQU/AJgC71Zp8jkdWem7qTTnxoj+mns6bUI5NIj5MpL3m6NodIbmQKBgQC4
ccp+BopBTI4X2WiQy8aMb1yAD0jDyuk8JjnmKzJRErdGLFcDDLD4tFnnKw0HmA+g
/AoK7I8eP79osHc5oCXxxEo1JhAUMopalWcROQ7Ks7JXADqpbHWtaiiJAQNw9Zuy
uqZ5+iwBgUl7xyWUd+tbWDy73sPRxzKyeWX87bsNUQKBgEuRLuP3I2yJP1GzDClB
3a0bc19XuXaGmxn0LBzHfqiqkq6lymWUIlFH5r+jibP9dDyvSHE9GWCkmVdfVhAf
ZUhXKc+ChCX0EWEb90+LhpIIY2pMZGg4gVn6NAW/xV3pyueGdDm1ciBPisrqWHMj
JkH3fKiQfGi52ouES8nVl/tL
-----END PRIVATE KEY-----
```

#### `nextauth-secret`

Wygeneruj losowy secret:

```powershell
# PowerShell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

Lub użyj online generator: https://generate-secret.vercel.app/32

---

## 🚀 Krok 5: Uruchomienie Migracji Prisma

### Lokalnie (przed deployem)

```powershell
# Ustaw DATABASE_URL z Cloud SQL Proxy
$env:DATABASE_URL="postgresql://palkamtm_user:PASSWORD@127.0.0.1:5432/palkamtm_production"

# Uruchom migracje
npx prisma migrate deploy
```

### W Firebase App Hosting (automatycznie)

Firebase App Hosting automatycznie uruchomi `prisma migrate deploy` podczas build, jeśli:
- `DATABASE_URL` jest dostępne w środowisku
- `prisma migrate deploy` jest w `package.json` scripts

**Sprawdź `package.json`:**

```json
{
  "scripts": {
    "postinstall": "prisma generate",
    "build": "prisma migrate deploy && next build"
  }
}
```

---

## ✅ Krok 6: Weryfikacja Konfiguracji

1. **Sprawdź apphosting.yaml**:
   - ✅ `cloudSql.connections` jest skonfigurowane
   - ✅ Wszystkie `env` variables są ustawione

2. **Sprawdź Cloud Secret Manager**:
   - ✅ `database-url` istnieje
   - ✅ `firebase-project-id` istnieje
   - ✅ `firebase-client-email` istnieje
   - ✅ `firebase-private-key` istnieje
   - ✅ `nextauth-secret` istnieje

3. **Sprawdź Cloud SQL**:
   - ✅ Instance `palka-mtm-db` działa
   - ✅ Database `palkamtm_production` istnieje
   - ✅ User `palkamtm_user` istnieje

4. **Deploy**:
   ```powershell
   git add apphosting.yaml
   git commit -m "Configure Cloud SQL PostgreSQL"
   git push origin main
   ```

---

## 🔍 Troubleshooting

### Błąd: "Connection refused"

**Przyczyna**: Cloud SQL instance nie jest połączona z App Hosting.

**Rozwiązanie**:
1. Sprawdź `apphosting.yaml` - `cloudSql.connections` musi być ustawione
2. Sprawdź format: `PROJECT_ID:REGION:INSTANCE_NAME`
3. Upewnij się, że instance istnieje w tym samym projekcie

### Błąd: "Authentication failed"

**Przyczyna**: Nieprawidłowe dane w `DATABASE_URL`.

**Rozwiązanie**:
1. Sprawdź `database-url` secret w Cloud Secret Manager
2. Upewnij się, że hasło jest poprawne
3. Format: `postgresql://USER:PASSWORD@/DATABASE?host=/cloudsql/PROJECT:REGION:INSTANCE`

### Błąd: "Database does not exist"

**Przyczyna**: Baza danych nie została utworzona.

**Rozwiązanie**:
1. Utwórz bazę danych w Cloud SQL Console
2. Upewnij się, że nazwa w `DATABASE_URL` jest poprawna

---

## 📚 Dokumentacja

- [Firebase App Hosting - Cloud SQL](https://firebase.google.com/docs/app-hosting/configure#cloud-sql)
- [Cloud SQL dla PostgreSQL](https://cloud.google.com/sql/docs/postgres)
- [Prisma Cloud SQL](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-google-cloud-sql)

