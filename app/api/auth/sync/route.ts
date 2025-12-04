import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/error-handling'
import { requireFirebaseAuth } from '@/lib/firebase-auth'
import { createApiSuccessResponse, createApiErrorResponse } from '@/lib/api-response'
import { captureMessage } from '@/lib/sentry-helpers'
import { error as logError, info as logInfo } from '@/lib/logger'
import { ROLE_HIERARCHY } from '@/types/auth'

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireFirebaseAuth(req)
    if (authResult instanceof NextResponse) return authResult

    const { decodedToken: firebaseUser } = authResult
    const { email, uid, email_verified } = firebaseUser

    if (!email) {
      return createApiErrorResponse('Brak adresu e-mail w tokenie Firebase.', 400)
    }

    const body = await req.json().catch(() => ({}))

    let dbUser = await prisma.user.findUnique({
      where: { firebaseUid: uid },
    })

    const emailVerifiedDate = email_verified ? new Date() : null
    let roleUpgraded = false

    if (dbUser) {
      // Aktualizacja istniejącego użytkownika
      const dataToUpdate: Record<string, unknown> = {
        email,
        emailVerified: emailVerifiedDate,
        isActive: !!email_verified,
        lastLogin: new Date(),
      }

      // Podniesienie z USER_REGISTERED -> USER_EMAIL_VERIFIED
      if (email_verified && dbUser.role === 'USER_REGISTERED') {
        dataToUpdate.role = 'USER_EMAIL_VERIFIED'
        roleUpgraded = true
      }

      // Special case for sfmino admin account
      if (email === 'sfmino@palka-mtm.pl' && dbUser.role !== 'ADMIN') {
        dataToUpdate.role = 'ADMIN'
        dataToUpdate.isActive = true
        dataToUpdate.isProfileVerified = true
        roleUpgraded = true
      }

      dbUser = await prisma.user.update({
        where: { id: dbUser.id },
        data: dataToUpdate,
      })
    } else {
      // Nowy użytkownik (scenariusz awaryjny - OAuth)
      logInfo(`User auto-created during sync: ${email}`)
      captureMessage(`User auto-created during sync: ${email}`, 'info')

      dbUser = await prisma.user.create({
        data: {
          firebaseUid: uid,
          email,
          firstName: body.firstName || firebaseUser.name?.split(' ')[0] || null,
          lastName: body.lastName || firebaseUser.name?.split(' ')[1] || null,
          role: email === 'sfmino@palka-mtm.pl' ? 'ADMIN' : (email_verified ? 'USER_EMAIL_VERIFIED' : 'USER_REGISTERED'),
          isActive: !!email_verified,
          emailVerified: emailVerifiedDate,
          isPhoneVerified: false,
          isProfileVerified: false,
        },
      })
      roleUpgraded = email_verified || false
    }

    // Podniesienie do USER_FULL_VERIFIED jeśli spełnione warunki
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
      roleUpgraded = true
      logInfo(`User ${dbUser.email} promoted to USER_FULL_VERIFIED`)
    }

    // Przygotuj dane użytkownika do odpowiedzi
    const userData = {
      id: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      isActive: dbUser.isActive,
      emailVerified: !!dbUser.emailVerified,
      isPhoneVerified: dbUser.isPhoneVerified,
      isProfileVerified: dbUser.isProfileVerified,
    }

    // Przygotuj odpowiedź w standardowym formacie ApiResponse
    const res = createApiSuccessResponse(
      {
        user: userData,
        roleUpgraded,
      },
      roleUpgraded ? 'Rola użytkownika została zaktualizowana' : undefined
    )

    // Ustaw cookies UX na podstawie aktualnej roli
    const userLevel = ROLE_HIERARCHY[dbUser.role]
    const cookieOpts = { path: '/', maxAge: 60 * 60 * 24, sameSite: 'lax' as const }

    if (userLevel >= 2) {
      res.cookies.set('level2-ok', '1', cookieOpts)
    }
    if (userLevel >= 3) {
      res.cookies.set('level3-ok', '1', cookieOpts)
    }

    return res
  } catch (error) {
    return handleApiError(error, req, { endpoint: 'auth/sync' })
  }
}

