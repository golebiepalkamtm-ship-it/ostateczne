export const runtime = 'nodejs';
// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminAuth } from '@/lib/firebase-admin'
import { handleApiError } from '@/lib/error-handling'
import { prisma } from '@/lib/prisma'
import { apiRateLimit } from '@/lib/rate-limit'
import { captureException, captureMessage } from '@/lib/sentry-helpers'
import { error as logError } from '@/lib/logger'

const registerSchema = z.object({
  email: z.string().email('Nieprawidłowy format email.'),
  password: z.string().min(8, 'Hasło musi mieć co najmniej 8 znaków.'),
  firstName: z.string().min(2, 'Imię musi mieć co najmniej 2 znaki.').optional(),
  lastName: z.string().min(2, 'Nazwisko musi mieć co najmniej 2 znaki.').optional(),
})

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await apiRateLimit(request)
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    const body = await request.json()
    const validation = registerSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Nieprawidłowe dane wejściowe.',
          details: validation.error.issues,
        },
        { status: 400 },
      )
    }

    const { email, password, firstName, lastName } = validation.data

    const adminAuth = getAdminAuth()
    if (!adminAuth) {
      logError('Firebase Admin Auth is not initialized.')
      captureMessage('CRITICAL: Firebase Admin Auth not initialized during registration.', 'fatal')
      return NextResponse.json(
        { error: 'Serwis jest tymczasowo niedostępny.' },
        { status: 503 },
      )
    }

    // Sprawdź, czy użytkownik z tym adresem e-mail już istnieje w lokalnej bazie danych
    const existingDbUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingDbUser) {
      return NextResponse.json(
        { error: 'Użytkownik o tym adresie e-mail już istnieje. Proszę się zalogować.' },
        { status: 409 }, // 409 Conflict
      )
    }

    let firebaseUser
    try {
      firebaseUser = await adminAuth.createUser({
        email,
        password,
        emailVerified: false,
        disabled: false,
        displayName: `${firstName || ''} ${lastName || ''}`.trim(),
      })
    } catch (error: any) {
      if (error.code === 'auth/email-already-exists') {
        return NextResponse.json(
          { error: 'Użytkownik o tym adresie e-mail już istnieje w systemie uwierzytelniania. Proszę się zalogować.' },
          { status: 409 },
        )
      }
      if (error.code === 'auth/weak-password') {
        return NextResponse.json(
          { error: 'Podane hasło jest za słabe. Musi mieć co najmniej 8 znaków.' },
          { status: 400 },
        )
      }
      // Przekaż inne błędy Firebase do ogólnej obsługi
      throw error
    }

    // Transakcja: utwórz użytkownika w lokalnej bazie danych.
    // Jeśli to się nie uda, usuń użytkownika z Firebase, aby uniknąć niespójności.
    try {
      const newUser = await prisma.user.create({
        data: {
          firebaseUid: firebaseUser.uid,
          email,
          firstName: firstName || null,
          lastName: lastName || null,
          role: 'USER_REGISTERED', // Poziom 1 - Zarejestrowany
          isActive: false, // Aktywny dopiero po weryfikacji email
          emailVerified: null,
          isPhoneVerified: false,
          isProfileVerified: false,
        },
      })

      return NextResponse.json(
        {
          message: 'Rejestracja zakończona pomyślnie. Na Twój adres e-mail wysłano link weryfikacyjny.',
          userId: newUser.id,
          firebaseUid: firebaseUser.uid,
        },
        { status: 201 },
      )
    } catch (dbError) {
      // Jeśli zapis do bazy danych się nie powiedzie, cofnij utworzenie użytkownika w Firebase
      logError('Failed to create user in local DB, rolling back Firebase user.', email, firebaseUser.uid, dbError)
      captureException(dbError, { firebaseUid: firebaseUser.uid, reason: 'Rollback after DB user creation failure.' })
      
      await adminAuth.deleteUser(firebaseUser.uid)
      
      // Zwróć generyczny błąd serwera
      return NextResponse.json(
        { error: 'Wystąpił błąd podczas tworzenia konta. Spróbuj ponownie.' },
        { status: 500 },
      )
    }

  } catch (error) {
    return handleApiError(error, request, { endpoint: 'register' })
  }
}

