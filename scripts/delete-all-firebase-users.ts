import admin from 'firebase-admin'
import fs from 'fs'

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
      '❌ Brak poświadczeń Firebase. Ustaw zmienne środowiskowe: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY lub dostarcz firebase-key.json',
    )
    process.exit(1)
  }
}

async function deleteAllFirebaseUsers() {
  console.log('🗑️  Rozpoczynam usuwanie wszystkich użytkowników z Firebase Auth...\n')

  try {
    let nextPageToken: string | undefined = undefined
    let totalDeleted = 0

    do {
      const listUsersResult = await admin.auth().listUsers(1000, nextPageToken)
      for (const userRecord of listUsersResult.users) {
        await admin.auth().deleteUser(userRecord.uid)
        console.log(`✅ Usunięto użytkownika: ${userRecord.uid} (${userRecord.email})`)
        totalDeleted++
      }
      nextPageToken = listUsersResult.pageToken
    } while (nextPageToken)

    console.log(`\n🎉 Usunięto wszystkich użytkowników z Firebase Auth. Łącznie: ${totalDeleted}`)
  } catch (error) {
    console.error('❌ Błąd podczas usuwania użytkowników z Firebase:', error)
    process.exit(1)
  }
}

deleteAllFirebaseUsers()
