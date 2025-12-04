#!/usr/bin/env tsx
import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

import { getAdminAuth } from '@/lib/firebase-admin'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function syncAllUsers() {
  console.log('🔁 Synchronizacja użytkowników Firebase -> Prisma')

  const adminAuth = getAdminAuth()
  if (!adminAuth) {
    console.error('❌ Firebase Admin SDK nie jest zainicjalizowane. Sprawdź .env.local')
    process.exit(1)
  }

  let nextPageToken: string | undefined = undefined
  let total = 0

  try {
    do {
      const list = await adminAuth.listUsers(1000, nextPageToken as any)
      for (const userRecord of list.users) {
        total++
        const uid = userRecord.uid
        const email = userRecord.email || null
        const emailVerified = !!userRecord.emailVerified
        const displayName = userRecord.displayName || null
        const phoneNumber = userRecord.phoneNumber || null

        const firstName = displayName ? displayName.split(' ')[0] : null
        const lastName = displayName && displayName.split(' ').length > 1 ? displayName.split(' ').slice(1).join(' ') : null

        // Try to find by firebaseUid first
        const existing = await prisma.user.findFirst({ where: { firebaseUid: uid } })

        if (existing) {
          await prisma.user.update({
            where: { id: existing.id },
            data: {
              email: email ?? existing.email,
              emailVerified: emailVerified ? new Date() : existing.emailVerified,
              isActive: emailVerified ? true : existing.isActive,
              firstName: existing.firstName ?? firstName,
              lastName: existing.lastName ?? lastName,
              isPhoneVerified: phoneNumber ? true : existing.isPhoneVerified,
              firebaseUid: uid,
              lastLogin: new Date(),
            },
          })
          console.log(`↗️ Updated: ${email || uid}`)
        } else if (email) {
          // Try to find by email and attach firebaseUid
          const byEmail = await prisma.user.findUnique({ where: { email } }).catch(() => null)
          if (byEmail) {
            await prisma.user.update({
              where: { id: byEmail.id },
              data: {
                firebaseUid: uid,
                emailVerified: emailVerified ? new Date() : byEmail.emailVerified,
                isActive: emailVerified ? true : byEmail.isActive,
                firstName: byEmail.firstName ?? firstName,
                lastName: byEmail.lastName ?? lastName,
                isPhoneVerified: phoneNumber ? true : byEmail.isPhoneVerified,
                lastLogin: new Date(),
              },
            })
            console.log(`🔗 Linked by email: ${email}`)
          } else {
            // Create new user
            await prisma.user.create({
              data: {
                firebaseUid: uid,
                email: email,
                emailVerified: emailVerified ? new Date() : null,
                isActive: emailVerified,
                firstName,
                lastName,
                isPhoneVerified: !!phoneNumber,
                role: 'USER_REGISTERED',
              },
            })
            console.log(`➕ Created: ${email}`)
          }
        } else {
          // No email and no existing — create minimal record
          await prisma.user.create({
            data: {
              firebaseUid: uid,
              email: null,
              role: 'USER_REGISTERED',
              isActive: false,
            },
          })
          console.log(`➕ Created (no-email): ${uid}`)
        }
      }

      nextPageToken = list.pageToken || undefined
    } while (nextPageToken)

    console.log(`
✅ Synchronizacja zakończona. Przetworzono ${total} użytkowników.`)
  } catch (error) {
    console.error('❌ Błąd podczas synchronizacji:', error)
  } finally {
    await prisma.$disconnect()
  }
}

syncAllUsers()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
