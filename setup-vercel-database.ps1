# PowerShell script to configure Vercel with Supabase PostgreSQL + Prisma
# Automatyczna konfiguracja wszystkich zmiennych środowiskowych

Write-Host "🚀 Konfiguracja Vercel + Supabase PostgreSQL + Prisma" -ForegroundColor Cyan
Write-Host ""

# Sprawdź czy jesteś zalogowany
Write-Host "Sprawdzanie połączenia z Vercel..." -ForegroundColor Yellow
$vercelCheck = vercel whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Nie jesteś zalogowany do Vercel!" -ForegroundColor Red
    Write-Host "Uruchom: vercel login" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Połączony z Vercel: $vercelCheck" -ForegroundColor Green
Write-Host ""

# Connection string do Supabase PostgreSQL
# WAŻNE: Zastąp tymi wartościami z Twojego projektu Supabase
$DATABASE_URL = "postgresql://MTM:Milosz1205@34.6.153.213:5432/palka_core_prod?connect_timeout=5&pool_timeout=30&statement_timeout=60000&pgbouncer=true&connection_limit=1"

Write-Host "📦 Konfiguracja zmiennych środowiskowych..." -ForegroundColor Cyan
Write-Host ""

# Funkcja do dodawania zmiennych środowiskowych
function Add-VercelEnv {
    param(
        [string]$Name,
        [string]$Value,
        [string[]]$Environments = @("production", "preview", "development")
    )
    
    Write-Host "  → Dodawanie: $Name" -ForegroundColor Gray
    
    foreach ($env in $Environments) {
        $result = echo $Value | vercel env add $Name $env 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "    ✅ $env" -ForegroundColor Green
        } else {
            Write-Host "    ⚠️  $env - może już istnieć" -ForegroundColor Yellow
        }
    }
}

# 1. DATABASE_URL - Supabase PostgreSQL
Write-Host "1️⃣  Konfiguracja bazy danych (Supabase PostgreSQL)..." -ForegroundColor Cyan
Add-VercelEnv "DATABASE_URL" $DATABASE_URL
Write-Host ""

# 2. Firebase Client (Publiczne)
Write-Host "2️⃣  Konfiguracja Firebase Client..." -ForegroundColor Cyan
Add-VercelEnv "NEXT_PUBLIC_FIREBASE_API_KEY" "AIzaSyD4PcLWRdE61ogbkm1199rV_p-sODJvtuE"
Add-VercelEnv "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN" "pigeon-4fba2.firebaseapp.com"
Add-VercelEnv "NEXT_PUBLIC_FIREBASE_PROJECT_ID" "pigeon-4fba2"
Add-VercelEnv "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET" "pigeon-4fba2.firebasestorage.app"
Add-VercelEnv "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID" "1036150984520"
Add-VercelEnv "NEXT_PUBLIC_FIREBASE_APP_ID" "1:1036150984520:web:62445751bd607f2b56ad7d"
Add-VercelEnv "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID" "G-CDS9QF0ZJH"
Write-Host ""

# 3. Firebase Admin (Serwer)
Write-Host "3️⃣  Konfiguracja Firebase Admin..." -ForegroundColor Cyan
Add-VercelEnv "FIREBASE_PROJECT_ID" "m-t-m-62972"
Add-VercelEnv "FIREBASE_CLIENT_EMAIL" "firebase-adminsdk-fbsvc@m-t-m-62972.iam.gserviceaccount.com"
$FIREBASE_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCcRe0BslSnISuR\nFcisDVbgkNvz3jekt/z9KI6LsR4ddyBfyH2up0BcEvLuNXwUTsTKxmTSbn1HoG7m\nnzDIJrzwL0xLBhzujhAbCfPg0nHYqifiVu0QY27nGh+2MltN9q99rDcdVQfVDSsj\nXwiD1py2oX1l5o6PeKsifenacG5tATcexfjnPuxxLdTFyF1LhgMwVNyoPKOvpEsd\nbGG8pWtAXW5xiyJTvHcYI5T0I8oLugNCKYazEWbD0Cz5ZCWUDFuo7jHitU+PYhvN\nsvEiDMySOhmjvdHqR+JvvcBxOnS9241KjTbeZ1adaFLg1E+FxQVfBOkJuJQY4ylX\nvHSrXss9AgMBAAECggEAQfUtlJK9MhFI/yKPoTa8HWpmu6ZmG+rgJ8XPbFxkVpFq\nI6NOkMHc4z/IMwx2A2g/nUphUYP68plfVY2JHGFlS4bbD6tT2MgzOgZYXeLU1Fr1\nHI4N3uXo8DfRfKgCa4ScC1H9rS6vcJfvRi2dPW/+kwLUF4dZUmre6B72rhDYOr8o\nhEQW3LAAgBdm40xWJo8gIRKKtGM7xl0o2CCrilt7XY0DqZrZVnYrNOrphCCt7e4g\nhkhzhDnL5P5Q6B4Vc0kY2xg3/c9Hb5QnBHzMV/N7d6rl3zMrQ7t9B7R8s0BudKRH\n5qtnBr3VjMzYolmpDAp626r55MjPqG2IWdBoSANRzQKBgQDSQCeKegcfM+g2UIOL\nPDwae4PR3BRTOdyvGMcv+lxeXXXE/b2ostiaKKimTKHtRCizozFz7v3gR6MHCCtP\nZqPh3Hya5r0HpslSN2j028wKi2Zj144tWCzyHjArZOsUBXJrh3b/RLrVhobOggDs\nMS4JJUDh+PAM5isX6B+V4Bf6HwKBgQC+Rv/Wi+F4XvhQG9rnOgZ7Cwdx0IRhb/Mi\nIzpeOCC9D/3HeDQHfnwjGJugNZiXibdv4TmjDYxPXWIiK+hQTT1rrt+jm5F3Qgyg\nJ/tBaTEc/eSDFsx9oIIWPk6sQKeUbUXDjCyzPpj7oxIS1FLE1WnJBFH3BQ9hLT9i\n24I72SdHIwKBgQDDA+apNw6sDoVw+7VHzJMjLTXTzgK8P4tGjgETq3FJxf6avZDR\njTIDq3ri5Wm8nd/y34fbNO4evdOljho+B8IymUSqmSL0metaazLbC5Ryo2JRcXra\n7FKkMQQU/AJgC71Zp8jkdWem7qTTnxoj+mns6bUI5NIj5MpL3m6NodIbmQKBgQC4\nccp+BopBTI4X2WiQy8aMb1yAD0jDyuk8JjnmKzJRErdGLFcDDLD4tFnnKw0HmA+g\n/AoK7I8eP79osHc5oCXxxEo1JhAUMopalWcROQ7Ks7JXADqpbHWtaiiJAQNw9Zuy\nuqZ5+iwBgUl7xyWUd+tbWDy73sPRxzKyeWX87bsNUQKBgEuRLuP3I2yJP1GzDClB\n3a0bc19XuXaGmxn0LBzHfqiqkq6lymWUIlFH5r+jibP9dDyvSHE9GWCkmVdfVhAf\nZUhXKc+ChCX0EWEb90+LhpIIY2pMZGg4gVn6NAW/xV3pyueGdDm1ciBPisrqWHMj\nJkH3fKiQfGi52ouES8nVl/tL\n-----END PRIVATE KEY-----\n"
Add-VercelEnv "FIREBASE_PRIVATE_KEY" $FIREBASE_PRIVATE_KEY @("production", "preview", "development")
Write-Host ""

# 4. NextAuth
Write-Host "4️⃣  Konfiguracja NextAuth..." -ForegroundColor Cyan
Add-VercelEnv "NEXTAUTH_URL" "https://palkamtm.pl" @("production")
Add-VercelEnv "NEXTAUTH_URL" "https://pigeon-gj4ougkim-marcins-projects-59088b6e.vercel.app" @("preview")
Add-VercelEnv "NEXTAUTH_SECRET" "Uv3thpAmgL98eBwLt0WrL6nIVPSNt+eHHrotyvaqT8E="
Add-VercelEnv "NEXT_PUBLIC_BASE_URL" "https://palkamtm.pl" @("production")
Add-VercelEnv "NEXT_PUBLIC_BASE_URL" "https://pigeon-gj4ougkim-marcins-projects-59088b6e.vercel.app" @("preview")
Write-Host ""

# 5. Inne wymagane zmienne
Write-Host "5️⃣  Konfiguracja pozostałych zmiennych..." -ForegroundColor Cyan
Add-VercelEnv "NODE_ENV" "production"
Add-VercelEnv "NEXT_TELEMETRY_DISABLED" "1"
Write-Host ""

Write-Host "✅ Konfiguracja zmiennych środowiskowych zakończona!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Następne kroki:" -ForegroundColor Cyan
Write-Host "  1. Uruchom migracje Prisma: npm run db:migrate" -ForegroundColor Yellow
Write-Host "  2. Zdeployuj na Vercel: vercel --prod" -ForegroundColor Yellow
Write-Host ""

