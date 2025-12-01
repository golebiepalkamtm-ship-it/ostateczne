export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from 'firebase-admin/auth'
import { getAdminApp } from '@/lib/firebase-admin'
import { handleApiError } from '@/lib/error-handling'
import { error as logError } from '@/lib/logger'
import * as Sentry from '@sentry/nextjs'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Brak tokenu weryfikacyjnego.' }, { status: 400 })
    }

    const adminApp = getAdminApp()
    if (!adminApp) {
      logError('Firebase Admin App is not initialized for email verification.')
      Sentry.captureMessage('CRITICAL: Firebase Admin App not initialized in verify-email.', 'fatal')
      return NextResponse.json({ error: 'Serwis jest tymczasowo niedostępny.' }, { status: 503 })
    }

    const adminAuth = getAuth(adminApp)
    
    // Ten endpoint nie jest już potrzebny, ponieważ weryfikacja odbywa się po stronie klienta
    // za pomocą applyActionCode, a następnie stan jest synchronizowany przez /api/auth/sync.
    // Zostawiamy go na razie jako pusty, aby nie powodować błędów 404, ale logujemy ostrzeżenie.
    
    logError('Endpoint /api/auth/verify-email is deprecated and should not be called directly.')
    Sentry.captureMessage('Deprecated endpoint /api/auth/verify-email was called.', 'warning')

    // Zwracamy sukces, aby nie blokować przepływu po stronie klienta,
    // ale informujemy, że operacja jest przestarzała.
    return NextResponse.json({
      message: 'This endpoint is deprecated. Email verification is handled by the client and the /api/auth/sync endpoint.',
      status: 'success_deprecated',
    })

  } catch (error) {
    // Chociaż endpoint jest przestarzały, nadal obsługujemy błędy na wypadek, gdyby był wywoływany
    return handleApiError(error, request, { endpoint: 'auth/verify-email' })
  }
}

