import admin from 'firebase-admin'
import fs from 'fs'

// Inicjalizacja Firebase Admin SDK
const serviceAccount = JSON.parse(fs.readFileSync('firebase-key.json', 'utf8'))

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

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
