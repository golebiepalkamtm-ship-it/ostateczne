import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/error-handling'
import { requireFirebaseAuth } from '@/lib/firebase-auth'
import * as Sentry from '@sentry/nextjs'
import { error as logError, info as logInfo } from '@/lib/logger'

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireFirebaseAuth(req)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { decodedToken: firebaseUser } = authResult
    const { email, uid, email_verified } = firebaseUser

    if (!email) {
      return NextResponse.json({ error: 'Brak adresu e-mail w tokenie Firebase.' }, { status: 400 })
    }

    const body = await req.json().catch(() => ({}))

    // Znajdź użytkownika w lokalnej bazie danych
    let dbUser = await prisma.user.findUnique({
      where: { firebaseUid: uid },
    })

    const emailVerifiedDate = email_verified ? new Date() : null

    if (dbUser) {
      // Użytkownik istnieje, zaktualizuj jego dane
      const dataToUpdate: any = {
        email, // Zawsze aktualizuj email, na wypadek zmiany
        emailVerified: emailVerifiedDate,
        isActive: !!email_verified, // Ustaw na true, jeśli email jest zweryfikowany
        lastLogin: new Date(),
      }

      // Aktualizuj rolę tylko wtedy, gdy jest to podniesienie z USER_REGISTERED
      if (email_verified && dbUser.role === 'USER_REGISTERED') {
        dataToUpdate.role = 'USER_EMAIL_VERIFIED'
      }

      dbUser = await prisma.user.update({
        where: { id: dbUser.id },
        data: dataToUpdate,
      })
    } else {
      // Użytkownik nie istnieje, utwórz nowy rekord
      // To jest scenariusz awaryjny, np. po logowaniu przez OAuth, gdzie nie ma procesu rejestracji
      logError(`User with firebaseUid ${uid} not found in DB. Creating a new record.`, email)
      Sentry.captureMessage(`User auto-created during sync: ${email}`, 'info')

      dbUser = await prisma.user.create({
        data: {
          firebaseUid: uid,
          email,
          firstName: body.firstName || firebaseUser.name?.split(' ')[0] || null,
          lastName: body.lastName || firebaseUser.name?.split(' ')[1] || null,
          role: email_verified ? 'USER_EMAIL_VERIFIED' : 'USER_REGISTERED',
          isActive: !!email_verified,
          emailVerified: emailVerifiedDate,
          isPhoneVerified: false,
          isProfileVerified: false,
        },
      })
    }

    // Sprawdź, czy należy podnieść rolę do USER_FULL_VERIFIED
    if (
      dbUser.role !== 'ADMIN' &&
      dbUser.role !== 'USER_FULL_VERIFIED' &&
      dbUser.isPhoneVerified &&
      dbUser.isProfileVerified &&
      dbUser.isActive
    ) {
      dbUser = await prisma.user.update({
        where: { id: dbUser.id },
        data: { role: 'USER_FULL_VERIFIED' },
      })
      Sentry.captureMessage(`User ${dbUser.email} was promoted to USER_FULL_VERIFIED during sync.`, 'info')
    }

    return NextResponse.json({ success: true, user: dbUser })

  } catch (error) {
    return handleApiError(error, req, { endpoint: 'auth/sync' })
  }
}

