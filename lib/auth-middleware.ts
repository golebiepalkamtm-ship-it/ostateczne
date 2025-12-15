import { requireFirebaseAuth } from '@/lib/firebase-auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { error as logError } from '@/lib/logger'
import * as Sentry from '@sentry/nextjs'
import { ROLE_HIERARCHY, Role } from '@/types/auth'
import { captureException } from '@/lib/sentry-helpers'

/**
 * Uniwersalna funkcja sprawdzająca czy użytkownik spełnia wymagania roli
 * @param request - NextRequest object
 * @param requiredRole - Minimalna wymagana rola
 * @returns null jeśli użytkownik ma dostęp, NextResponse z błędem jeśli nie
 */
async function requireRole(request: NextRequest, requiredRole: Role): Promise<NextResponse | null> {
  const authResult = await requireFirebaseAuth(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  const { decodedToken } = authResult

  try {
    const user = await prisma.user.findUnique({
      where: { firebaseUid: decodedToken.uid },
      select: {
        role: true,
        isActive: true,
        emailVerified: true,
        isPhoneVerified: true,
        isProfileVerified: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        address: true,
        city: true,
        postalCode: true,
      },
    })

    if (!user) {
      logError(`User with firebaseUid ${decodedToken.uid} not found in database`)
      return NextResponse.json({ error: 'Użytkownik nie został znaleziony.' }, { status: 404 })
    }

    // Administratorzy mają zawsze dostęp
    if (user.role === 'ADMIN') {
      return null
    }

    const userLevel = ROLE_HIERARCHY[user.role]
    const requiredLevel = ROLE_HIERARCHY[requiredRole]

    if (userLevel < requiredLevel) {
      // Zwróć odpowiedni komunikat w zależności od brakującego poziomu
      if (requiredRole === 'USER_EMAIL_VERIFIED') {
        return NextResponse.json(
          {
            error: 'Zweryfikuj adres e-mail, aby uzyskać dostęp.',
            requiresEmailVerification: true,
            currentRole: user.role,
            requiredRole,
          },
          { status: 403 },
        )
      }

      if (requiredRole === 'USER_FULL_VERIFIED') {
        const missingVerifications = []
        if (!user.isPhoneVerified) missingVerifications.push('telefon')
        if (!user.isProfileVerified) missingVerifications.push('profil')

        return NextResponse.json(
          {
            error: `Aby uzyskać pełny dostęp, zweryfikuj: ${missingVerifications.join(', ')}.`,
            requiresFullVerification: true,
            currentRole: user.role,
            requiredRole,
            isPhoneVerified: user.isPhoneVerified,
            isProfileVerified: user.isProfileVerified,
          },
          { status: 403 },
        )
      }

      return NextResponse.json(
        {
          error: 'Nie masz wystarczających uprawnień.',
          currentRole: user.role,
          requiredRole,
        },
        { status: 403 },
      )
    }

    return null
  } catch (error) {
    logError('Error checking user role', error, decodedToken.uid)
    captureException(error as Error, { firebaseUid: decodedToken.uid, requiredRole })
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas sprawdzania uprawnień.' },
      { status: 500 },
    )
  }
}

/**
 * Middleware sprawdzające czy użytkownik ma dostęp do Panelu Użytkownika (Poziom 2)
 * Wymagane dla wejścia do /profile
 */
export async function requireEmailVerification(request: NextRequest) {
  return requireRole(request, 'USER_EMAIL_VERIFIED')
}

/**
 * Middleware sprawdzające pełną weryfikację użytkownika (Poziom 3)
 * Wymagane dla aukcji, dodawania treści, referencji itp.
 */
export async function requireFullVerification(request: NextRequest) {
  return requireRole(request, 'USER_FULL_VERIFIED')
}

/**
 * Middleware sprawdzające czy użytkownik ma zweryfikowany telefon
 * Wymagane dla funkcji takich jak: tworzenie aukcji, licytowanie, dodawanie spotkań
 */
export async function requirePhoneVerification(request: NextRequest) {
  const authResult = await requireFirebaseAuth(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  const { decodedToken } = authResult

  try {
    const user = await prisma.user.findUnique({
      where: { firebaseUid: decodedToken.uid },
      select: { isPhoneVerified: true, role: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Użytkownik nie został znaleziony.' }, { status: 404 })
    }

    if (user.role === 'ADMIN' || user.isPhoneVerified) {
      return null
    }

    return NextResponse.json(
      {
        error: 'Weryfikacja numeru telefonu jest wymagana.',
        requiresPhoneVerification: true,
      },
      { status: 403 },
    )
  } catch (error) {
    logError('Error checking phone verification', error, decodedToken.uid)
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas sprawdzania weryfikacji telefonu.' },
      { status: 500 },
    )
  }
}

/**
 * Middleware sprawdzające czy użytkownik ma kompletny profil
 */
export async function requireCompleteProfile(request: NextRequest) {
  const authResult = await requireFirebaseAuth(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  const { decodedToken } = authResult

  try {
    const user = await prisma.user.findUnique({
      where: { firebaseUid: decodedToken.uid },
      select: {
        firstName: true,
        lastName: true,
        address: true,
        city: true,
        postalCode: true,
        phoneNumber: true,
        role: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Użytkownik nie został znaleziony.' }, { status: 404 })
    }

    if (user.role === 'ADMIN') {
      return null
    }

    const isProfileComplete = !!(
      user.firstName &&
      user.lastName &&
      user.address &&
      user.city &&
      user.postalCode &&
      user.phoneNumber
    )

    if (!isProfileComplete) {
      return NextResponse.json(
        {
          error: 'Profil użytkownika jest niekompletny.',
          requiresProfileCompletion: true,
        },
        { status: 403 },
      )
    }

    return null
  } catch (error) {
    logError('Error checking profile completion', error, decodedToken.uid)
    captureException(error as Error, { firebaseUid: decodedToken.uid })
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas sprawdzania profilu.' },
      { status: 500 },
    )
  }
}
