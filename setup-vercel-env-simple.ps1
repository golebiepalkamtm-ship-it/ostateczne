# PowerShell script to configure Vercel with Supabase PostgreSQL + Prisma
# Automatyczna konfiguracja wszystkich zmiennych środowiskowych

Write-Host "Konfiguracja Vercel + Supabase PostgreSQL + Prisma" -ForegroundColor Cyan
Write-Host ""

# Connection string do Supabase PostgreSQL
$DATABASE_URL = "postgresql://MTM:Milosz1205@34.6.153.213:5432/palka_core_prod?connect_timeout=5&pool_timeout=30&statement_timeout=60000&pgbouncer=true&connection_limit=1"

Write-Host "Konfiguracja zmiennych środowiskowych..." -ForegroundColor Cyan
Write-Host ""

# Funkcja do dodawania zmiennych
function Add-VercelEnvVar {
    param(
        [string]$Name,
        [string]$Value,
        [string]$Environment = "production"
    )
    
    Write-Host "Dodawanie: $Name dla $Environment" -ForegroundColor Gray
    $Value | vercel env add $Name $Environment 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  OK: $Name" -ForegroundColor Green
    } else {
        Write-Host "  UWAGA: $Name moze juz istniec" -ForegroundColor Yellow
    }
}

# 1. DATABASE_URL - Supabase PostgreSQL
Write-Host "1. Konfiguracja bazy danych (Supabase PostgreSQL)..." -ForegroundColor Cyan
Add-VercelEnvVar "DATABASE_URL" $DATABASE_URL "production"
Add-VercelEnvVar "DATABASE_URL" $DATABASE_URL "preview"
Add-VercelEnvVar "DATABASE_URL" $DATABASE_URL "development"
Write-Host ""

# 2. Firebase Client (Publiczne)
Write-Host "2. Konfiguracja Firebase Client..." -ForegroundColor Cyan
Add-VercelEnvVar "NEXT_PUBLIC_FIREBASE_API_KEY" "AIzaSyD4PcLWRdE61ogbkm1199rV_p-sODJvtuE" "production"
Add-VercelEnvVar "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN" "pigeon-4fba2.firebaseapp.com" "production"
Add-VercelEnvVar "NEXT_PUBLIC_FIREBASE_PROJECT_ID" "pigeon-4fba2" "production"
Add-VercelEnvVar "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET" "pigeon-4fba2.firebasestorage.app" "production"
Add-VercelEnvVar "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID" "1036150984520" "production"
Add-VercelEnvVar "NEXT_PUBLIC_FIREBASE_APP_ID" "1:1036150984520:web:62445751bd607f2b56ad7d" "production"
Add-VercelEnvVar "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID" "G-CDS9QF0ZJH" "production"
Write-Host ""

# 3. Firebase Admin (Serwer)
Write-Host "3. Konfiguracja Firebase Admin..." -ForegroundColor Cyan
Add-VercelEnvVar "FIREBASE_PROJECT_ID" "m-t-m-62972" "production"
Add-VercelEnvVar "FIREBASE_CLIENT_EMAIL" "firebase-adminsdk-fbsvc@m-t-m-62972.iam.gserviceaccount.com" "production"
$FIREBASE_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCcRe0BslSnISuR\nFcisDVbgkNvz3jekt/z9KI6LsR4ddyBfyH2up0BcEvLuNXwUTsTKxmTSbn1HoG7m\nnzDIJrzwL0xLBhzujhAbCfPg0nHYqifiVu0QY27nGh+2MltN9q99rDcdVQfVDSsj\nXwiD1py2oX1l5o6PeKsifenacG5tATcexfjnPuxxLdTFyF1LhgMwVNyoPKOvpEsd\nbGG8pWtAXW5xiyJTvHcYI5T0I8oLugNCKYazEWbD0Cz5ZCWUDFuo7jHitU+PYhvN\nsvEiDMySOhmjvdHqR+JvvcBxOnS9241KjTbeZ1adaFLg1E+FxQVfBOkJuJQY4ylX\nvHSrXss9AgMBAAECggEAQfUtlJK9MhFI/yKPoTa8HWpmu6ZmG+rgJ8XPbFxkVpFq\nI6NOkMHc4z/IMwx2A2g/nUphUYP68plfVY2JHGFlS4bbD6tT2MgzOgZYXeLU1Fr1\nHI4N3uXo8DfRfKgCa4ScC1H9rS6vcJfvRi2dPW/+kwLUF4dZUmre6B72rhDYOr8o\nhEQW3LAAgBdm40xWJo8gIRKKtGM7xl0o2CCrilt7XY0DqZrZVnYrNOrphCCt7e4g\nhkhzhDnL5P5Q6B4Vc0kY2xg3/c9Hb5QnBHzMV/N7d6rl3zMrQ7t9B7R8s0BudKRH\n5qtnBr3VjMzYolmpDAp626r55MjPqG2IWdBoSANRzQKBgQDSQCeKegcfM+g2UIOL\nPDwae4PR3BRTOdyvGMcv+lxeXXXE/b2ostiaKKimTKHtRCizozFz7v3gR6MHCCtP\nZqPh3Hya5r0HpslSN2j028wKi2Zj144tWCzyHjArZOsUBXJrh3b/RLrVhobOggDs\nMS4JJUDh+PAM5isX6B+V4Bf6HwKBgQC+Rv/Wi+F4XvhQG9rnOgZ7Cwdx0IRhb/Mi\nIzpeOCC9D/3HeDQHfnwjGJugNZiXibdv4TmjDYxPXWIiK+hQTT1rrt+jm5F3Qgyg\nJ/tBaTEc/eSDFsx9oIIWPk6sQKeUbUXDjCyzPpj7oxIS1FLE1WnJBFH3BQ9hLT9i\n24I72SdHIwKBgQDDA+apNw6sDoVw+7VHzJMjLTXTzgK8P4tGjgETq3FJxf6avZDR\njTIDq3ri5Wm8nd/y34fbNO4evdOljho+B8IymUSqmSL0metaazLbC5Ryo2JRcXra\n7FKkMQQU/AJgC71Zp8jkdWem7qTTnxoj+mns6bUI5NIj5MpL3m6NodIbmQKBgQC4\nccp+BopBTI4X2WiQy8aMb1yAD0jDyuk8JjnmKzJRErdGLFcDDLD4tFnnKw0HmA+g\n/AoK7I8eP79osHc5oCXxxEo1JhAUMopalWcROQ7Ks7JXADqpbHWtaiiJAQNw9Zuy\nuqZ5+iwBgUl7xyWUd+tbWDy73sPRxzKyeWX87bsNUQKBgEuRLuP3I2yJP1GzDClB\n3a0bc19XuXaGmxn0LBzHfqiqkq6lymWUIlFH5r+jibP9dDyvSHE9GWCkmVdfVhAf\nZUhXKc+ChCX0EWEb90+LhpIIY2pMZGg4gVn6NAW/xV3pyueGdDm1ciBPisrqWHMj\nJkH3fKiQfGi52ouES8nVl/tL\n-----END PRIVATE KEY-----\n"
Add-VercelEnvVar "FIREBASE_PRIVATE_KEY" $FIREBASE_PRIVATE_KEY "production"
Write-Host ""

# 4. NextAuth
Write-Host "4. Konfiguracja NextAuth..." -ForegroundColor Cyan
Add-VercelEnvVar "NEXTAUTH_URL" "https://palkamtm.pl" "production"
Add-VercelEnvVar "NEXTAUTH_SECRET" "Uv3thpAmgL98eBwLt0WrL6nIVPSNt+eHHrotyvaqT8E=" "production"
Add-VercelEnvVar "NEXT_PUBLIC_BASE_URL" "https://palkamtm.pl" "production"
Write-Host ""

# 5. Inne wymagane zmienne
Write-Host "5. Konfiguracja pozostałych zmiennych..." -ForegroundColor Cyan
Add-VercelEnvVar "NODE_ENV" "production" "production"
Add-VercelEnvVar "NEXT_TELEMETRY_DISABLED" "1" "production"
Write-Host ""

Write-Host "Konfiguracja zmiennych środowiskowych zakonczona!" -ForegroundColor Green
Write-Host ""
Write-Host "Nastepne kroki:" -ForegroundColor Cyan
Write-Host "  1. Uruchom migracje Prisma: npm run db:migrate" -ForegroundColor Yellow
Write-Host "  2. Zdeployuj na Vercel: vercel --prod" -ForegroundColor Yellow
Write-Host ""

