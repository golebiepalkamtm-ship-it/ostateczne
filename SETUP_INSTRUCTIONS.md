# 🚀 Instrukcje Automatycznej Konfiguracji Cloud SQL

## ⚠️ Wymagania

**Billing musi być włączony w projekcie Firebase!**

1. Włącz billing: https://console.developers.google.com/billing/enable?project=m-t-m-62972
2. Poczekaj 2-3 minuty na propagację zmian

## 🔧 Automatyczna Konfiguracja

Uruchom skrypt PowerShell:

```powershell
.\setup-cloud-sql.ps1
```

Skrypt automatycznie:
- ✅ Sprawdzi istniejącą instancję Cloud SQL
- ✅ Wzniesie instancję jeśli jest zawieszona
- ✅ Utworzy bazę danych `palkamtm_production`
- ✅ Utworzy użytkownika `palkamtm_user` z losowym hasłem
- ✅ Wygeneruje `NEXTAUTH_SECRET`
- ✅ Utworzy wszystkie sekrety w Cloud Secret Manager:
  - `database-url`
  - `firebase-project-id`
  - `firebase-client-email`
  - `firebase-private-key`
  - `nextauth-secret`
- ✅ Zaktualizuje `apphosting.yaml` z konfiguracją Cloud SQL

## 📋 Ręczna Konfiguracja (jeśli skrypt nie działa)

### 1. Włącz Billing

Otwórz: https://console.developers.google.com/billing/enable?project=m-t-m-62972

### 2. Utwórz/Wznieś Instancję Cloud SQL

```powershell
# Sprawdź istniejące instancje
gcloud sql instances list --project=m-t-m-62972

# Wzniesienie zawieszonej instancji
gcloud sql instances patch m-t-m-62972-instance --activation-policy=ALWAYS --project=m-t-m-62972
```

### 3. Utwórz Bazę Danych i Użytkownika

```powershell
# Utwórz bazę danych
gcloud sql databases create palkamtm_production --instance=m-t-m-62972-instance --project=m-t-m-62972

# Utwórz użytkownika (wygeneruj silne hasło!)
gcloud sql users create palkamtm_user --instance=m-t-m-62972-instance --password=YOUR_STRONG_PASSWORD --project=m-t-m-62972
```

### 4. Utwórz Sekrety w Cloud Secret Manager

```powershell
# DATABASE_URL
$dbUrl = "postgresql://palkamtm_user:PASSWORD@/palkamtm_production?host=/cloudsql/m-t-m-62972:europe-west4:m-t-m-62972-instance"
echo $dbUrl | gcloud secrets create database-url --data-file=- --project=m-t-m-62972

# Firebase Project ID
echo "m-t-m-62972" | gcloud secrets create firebase-project-id --data-file=- --project=m-t-m-62972

# Firebase Client Email
echo "firebase-adminsdk-fbsvc@m-t-m-62972.iam.gserviceaccount.com" | gcloud secrets create firebase-client-email --data-file=- --project=m-t-m-62972

# Firebase Private Key (z env.production)
$privateKey = Get-Content "env.production" | Select-String -Pattern 'FIREBASE_PRIVATE_KEY=' | ForEach-Object { 
    $_.Line -replace 'FIREBASE_PRIVATE_KEY="', '' -replace '"$', '' -replace '\\n', "`n"
}
$privateKey | gcloud secrets create firebase-private-key --data-file=- --project=m-t-m-62972

# NEXTAUTH_SECRET
$nextauthSecret = node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
echo $nextauthSecret | gcloud secrets create nextauth-secret --data-file=- --project=m-t-m-62972
```

### 5. Zaktualizuj apphosting.yaml

Sekcja `cloudSql` jest już skonfigurowana w `apphosting.yaml`:

```yaml
cloudSql:
  connections:
    - instance: m-t-m-62972:europe-west4:m-t-m-62972-instance
```

## ✅ Weryfikacja

1. **Sprawdź sekrety:**
   ```powershell
   gcloud secrets list --project=m-t-m-62972
   ```

2. **Sprawdź instancję Cloud SQL:**
   ```powershell
   gcloud sql instances describe m-t-m-62972-instance --project=m-t-m-62972
   ```

3. **Sprawdź bazę danych:**
   ```powershell
   gcloud sql databases list --instance=m-t-m-62972-instance --project=m-t-m-62972
   ```

4. **Wdróż aplikację:**
   ```powershell
   git add apphosting.yaml package.json
   git commit -m "Configure Cloud SQL PostgreSQL"
   git push origin main
   ```

## 🔍 Troubleshooting

### Błąd: "BILLING_DISABLED"

**Rozwiązanie:** Włącz billing w projekcie Firebase.

### Błąd: "Instance not found"

**Rozwiązanie:** Utwórz nową instancję Cloud SQL lub użyj istniejącej.

### Błąd: "Secret already exists"

**Rozwiązanie:** Zaktualizuj istniejący sekret:
```powershell
echo "NEW_VALUE" | gcloud secrets versions add SECRET_NAME --data-file=- --project=m-t-m-62972
```

### Błąd: "Connection refused" w aplikacji

**Rozwiązanie:** 
1. Sprawdź czy instancja Cloud SQL jest aktywna
2. Sprawdź format DATABASE_URL w sekrecie
3. Sprawdź czy `cloudSql` jest skonfigurowane w `apphosting.yaml`

