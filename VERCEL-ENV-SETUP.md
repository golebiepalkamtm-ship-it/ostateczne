# Konfiguracja zmiennych środowiskowych Firebase dla Vercel

## Wymagane zmienne środowiskowe

Dodaj następujące zmienne środowiskowe w panelu Vercel:

### Firebase Admin SDK (Server-side)

```
FIREBASE_PROJECT_ID=mtm-62972
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@mtm-62972.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCY/yN79FrH2Ws7\n0dOL3eCB0NYEYAdlRXFtIwicEO3LZhj1++kIfeiCUvohWBcdGbTpvTojQoeu4m9F\nKzTMPvYms11m6jlER963ZrsSDe1oYaq3N0VyVKrmOkeiNB0FZJcT1jRLSk4/nlBk\nSN1YS75ixYYoIgxrT0kXLcxdLYSHjvI7Wa77zOZmWTdPe8DQjZTVC2SZlt7pxWiH\nuWTxcnw4j1H6FFFHVsRwq5rBiEFnJJD9ABXCfF9CRRseeqzkbMOwpXldlkP2rJvI\nWwOY96MKgcUtpHnIAODIyFCTyPVvQzRsBEiNCWN0aIu5r6lN5n0xM8hyjDhO06cR\nGXuNsnqTAgMBAAECggEAHh/edMGgPklo+9ZMuPVvByB/g00FJ8OMmdiUEWaj67Cm\nqYh4Udu4tDByX65gnrI5FOzVTawD20NqdUwUkUK0ZNpcQa9Mp00fZS0tGFj1rd/N\nJVYUrnZNUBeZky5/qFguBxHeKhTvY0dgvN479u6zBe+ugqhxmY967L1vx8j2l1oY\nDm9so4ng9CNMHBwwobLwpjlSnLqdi7g5FdaPZMhVvIh+GUMmh2Te+WZl0m1XlXPo\ng1vlEMKCAdCABY5kA7n34epPErfqo1LfGyqyJJ3uLQ1NBuSqZHRg3xjuaUfan2QG\niXL/+V/Mc9VKHvYY69qP+QXg0DCZ34SARBtqXzkBAQKBgQDMRD2M4lhc8h/krpyl\nNXbEvTZgCMKB3OvH8Y/keqMMD6/JisAc1yj9LCcz/MTbn6ClhEPYBFpzWeBa9ul1\nl0jlsqe22FyxJAOQTaaQzgEx4wcFuUXdaexaeEiS5CsxAOIRnZke0dtnz7T3XmbY\n9PrlqZHNHiA8SDC4wGBkNjZ6owKBgQC/vscpgAL4RfRwAGjGQu8WsjfgvF8IA7Bt\nC0wn1lwBcR8fprGwf9LeoeQeifpFgXRoEuoZn4KFdCrxjVUImTPTSBDJFiXJg4Nh\n21LlE/fQo4WoW7xiGTlmBvrzIKcNxTiMFNsGkcK84XP6KhRxFRTwfsmfeYgxqu8d\nwfghISNvUQKBgQC+SAt2RBvAaaSgKLCvjcBXwVL33vEifCQAG9zJIBzmzW4ZtvED\nbMM4JHtYiGzxkh/aT/3LKzL/JYhD9KLB8e3sW6K0R5UBRuUy9cLmPaELUctm35Jf\nkZ6lIEuq2nYJriLp+f97oE5cxDZ2ATCZhox6iJ3Tj+7DeRQ55qtkbsQNNQKBgBwV\nllg2vricjmvlM3NulFRPsC2DiavD1pByKipflERFzFg3cyk1363qKl5quTR6/JDN\nzGoKWfSwCiYtHDpRLi0RDhxV2R0F3TV1CVQyM4bknIwHO7VmmmieNx1rN+ylaV3j\nJB13Nf2yS+llRm81tkZvW5q3E0KrFbDXGz/G+cixAoGAX45N3EAVFtRQoPfere9U\nC+M5AJbY0BrU1OtA/9E0uA3yOlomhySI3xoFW8HkKdFPf+DeiQ1H0Ma69TSZSH1t\nBQ+FtKYvqK0lKKzeI4lHK96Qva+STxW5I+tKvYer+0t2g4n1pcXVzQRl6aQNZLBh\nKRAh3liQo9HrBCuvxoY1zBo=\n-----END PRIVATE KEY-----\n"
```

### Firebase Client SDK (Client-side)

Musisz również dodać zmienne `NEXT_PUBLIC_*` dla Firebase Client SDK. Sprawdź w Firebase Console:
- Project Settings → General → Your apps → Web app

Dodaj:
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCrGcWptUnRgcNnAQl01g5RjPdMfZ2tJCA
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=mtm-62972.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=mtm-62972
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=mtm-62972.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=714609522899
NEXT_PUBLIC_FIREBASE_APP_ID=1:714609522899:web:462e995a1f358b1b0c3c26
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-T645E1YQHW
```

## Jak dodać zmienne w Vercel

1. Przejdź do projektu w Vercel Dashboard
2. Settings → Environment Variables
3. Dodaj każdą zmienną osobno:
   - **Name**: `FIREBASE_PROJECT_ID`
   - **Value**: `mtm-62972`
   - **Environment**: Production, Preview, Development (zaznacz wszystkie)
4. Powtórz dla wszystkich zmiennych

## Ważne uwagi

⚠️ **FIREBASE_PRIVATE_KEY**:
- Musi być w cudzysłowach
- Musi zawierać `\n` (nie `\\n`) w miejscach przełamania linii
- Cały klucz musi być w jednej linii w Vercel (z `\n` jako znaki)

## Po dodaniu zmiennych

1. Przejdź do Deployments
2. Kliknij "Redeploy" na najnowszym deployment
3. Build powinien przejść pomyślnie

