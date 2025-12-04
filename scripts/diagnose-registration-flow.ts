import admin from 'firebase-admin'
import fs from 'fs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Inicjalizacja Firebase Admin SDK z preferencją ENV i fallbackiem do pliku
let initialized = false
try {
  if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY as string).replace(/\\n/g, '\n'),
      }),
    })
    initialized = true
  }
} catch {}

if (!initialized) {
  try {
    const serviceAccount = JSON.parse(fs.readFileSync('firebase-key.json', 'utf8'))
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    })
    initialized = true
  } catch (err) {
    console.error(
      '❌ Brak poświadczeń Firebase. Ustaw zmienne środowiskowe: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY lub dostarcz firebase-key.json'
    )
    process.exit(1)
  }
}

const TEST_EMAIL = 'diagnose-test@example.com'
const TEST_PASSWORD = 'Test1234!'
const TEST_PHONE = '+48123456789'

async function main() {
  console.log('--- DIAGNOSTYKA FLOW REJESTRACJI I LOGOWANIA ---')

  // 1. Rejestracja w Firebase
  let firebaseUser
  try {
    firebaseUser = await admin.auth().createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      phoneNumber: TEST_PHONE,
      emailVerified: true,
    })
    console.log('✅ Zarejestrowano użytkownika w Firebase:', firebaseUser.uid)
  } catch (err) {
    console.error('❌ Błąd rejestracji w Firebase:', err)
    process.exit(1)
  }

  // 2. Pobierz status użytkownika w Firebase
  const userRecord = await admin.auth().getUser(firebaseUser.uid)
  console.log('🔎 Firebase user:', {
    uid: userRecord.uid,
    emailVerified: userRecord.emailVerified,
    phoneNumber: userRecord.phoneNumber,
  })

  // 3. Synchronizacja z Prisma przez API
  try {
    // Wygeneruj custom token do autoryzacji
    const customToken = await admin.auth().createCustomToken(firebaseUser.uid)
    // Zakładamy, że endpoint /api/auth/sync przyjmuje custom token w Authorization
    const response = await fetch('http://localhost:3000/api/auth/sync', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${customToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    })
    const syncResult = await response.json()
    console.log('🔄 Wynik synchronizacji:', syncResult)
  } catch (err) {
    console.error('❌ Błąd synchronizacji z Prisma:', err)
  }

  // 4. Pobierz status użytkownika w Prisma
  const dbUser = await prisma.user.findFirst({
    where: { firebaseUid: firebaseUser.uid },
  })
  console.log('🔎 Prisma user:', dbUser)

  // 5. Sprawdź role i flagi
  if (dbUser) {
    console.log('🛡️  Status weryfikacji:', {
      role: dbUser.role,
      isPhoneVerified: dbUser.isPhoneVerified,
      isProfileVerified: dbUser.isProfileVerified,
      isActive: dbUser.isActive,
    })
  }

  // 6. Usuń testowego użytkownika (opcjonalnie)
  await admin.auth().deleteUser(firebaseUser.uid)
  if (dbUser) await prisma.user.delete({ where: { id: dbUser.id } })
  console.log('🧹 Testowy użytkownik usunięty z Firebase i Prisma.')

  await prisma.$disconnect()
}

main()
