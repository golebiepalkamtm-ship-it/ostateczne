/**
 * Endpoint weryfikacji SMS - przekierowanie na /api/auth/verify-sms-code
 * Ten endpoint jest zachowany dla kompatybilności wstecznej
 */
import { handleApiError } from '@/lib/error-handling'
import { requireFirebaseAuth } from '@/lib/firebase-auth'
import { prisma } from '@/lib/prisma'
import { verifySmsCodeSchema } from '@/lib/validators'
import { info, error as logError } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireFirebaseAuth(req)
    if (authResult instanceof NextResponse) return authResult
    const { decodedToken } = authResult

    const body = await req.json().catch(() => ({}))
    const validation = verifySmsCodeSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Nieprawidłowy kod weryfikacyjny', details: validation.error.issues },
        { status: 400 },
      )
    }

    const { code } = validation.data
    info(`📱 Verify SMS: uid=${decodedToken.uid}`)

    const user = await prisma.user.findUnique({
      where: { firebaseUid: decodedToken.uid },
      select: {
        id: true,
        phoneVerificationCode: true,
        phoneVerificationExpires: true,
        isProfileVerified: true,
        isActive: true,
        role: true,
      },
    })

    if (!user) {
      logError(`Użytkownik nie znaleziony: firebaseUid=${decodedToken.uid}`)
      return NextResponse.json({ error: 'Użytkownik nie znaleziony' }, { status: 404 })
    }

    if (!user.phoneVerificationCode || !user.phoneVerificationExpires) {
      return NextResponse.json({ error: 'Brak aktywnego kodu weryfikacyjnego' }, { status: 400 })
    }

    if (new Date(user.phoneVerificationExpires).getTime() < Date.now()) {
      return NextResponse.json({ error: 'Kod wygasł' }, { status: 400 })
    }

    if (user.phoneVerificationCode !== code) {
      return NextResponse.json({ error: 'Nieprawidłowy kod' }, { status: 400 })
    }

    // Przygotuj dane do aktualizacji
    const dataToUpdate: Record<string, unknown> = {
      isPhoneVerified: true,
      phoneVerificationCode: null,
      phoneVerificationExpires: null,
    }

    // Podniesienie roli do USER_FULL_VERIFIED
    if (
      user.isProfileVerified &&
      user.isActive &&
      user.role !== 'USER_FULL_VERIFIED' &&
      user.role !== 'ADMIN'
    ) {
      dataToUpdate.role = 'USER_FULL_VERIFIED'
    }

    await prisma.user.update({
      where: { id: user.id },
      data: dataToUpdate,
    })

    info(`✅ Telefon zweryfikowany dla użytkownika: ${user.id}`)

    const res = NextResponse.json({ success: true })
    
    // Cookie UX: poziom 3 odblokowany
    if (dataToUpdate.role === 'USER_FULL_VERIFIED') {
      res.cookies.set('level3-ok', '1', { path: '/', maxAge: 60 * 60 * 24, sameSite: 'lax' })
    }
    
    return res
  } catch (error) {
    return handleApiError(error, req, { endpoint: 'auth/verify-sms' })
  }
}
