import { handleApiError } from '@/lib/error-handling'
import { requireFirebaseAuth } from '@/lib/firebase-auth'
import { prisma } from '@/lib/prisma'
import { apiRateLimit } from '@/lib/rate-limit'
import { completeProfileSchema } from '@/lib/validators'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = apiRateLimit(request)
    if (rateLimitResponse) return rateLimitResponse

    const authResult = await requireFirebaseAuth(request)
    if (authResult instanceof Response) return authResult
    const { decodedToken } = authResult

    const body = await request.json()
    const validation = completeProfileSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Nieprawidłowe dane', details: validation.error.issues },
        { status: 400 },
      )
    }

    const { firstName, lastName, address, city, postalCode, phoneNumber } = validation.data

    // Pobierz użytkownika - jedno zapytanie z wszystkimi potrzebnymi polami
    const currentUser = await prisma.user.findUnique({
      where: { firebaseUid: decodedToken.uid },
      select: { id: true, isPhoneVerified: true, isActive: true, role: true },
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'Użytkownik nie został znaleziony' }, { status: 404 })
    }

    // Przygotuj dane do aktualizacji
    const dataToUpdate: Record<string, unknown> = {
      firstName,
      lastName,
      address,
      city: city || null,
      postalCode: postalCode || null,
      phoneNumber: phoneNumber || null,
      isProfileVerified: true,
    }

    // Podniesienie roli: telefon zweryfikowany + aktywny + nie ma już pełnej weryfikacji
    if (
      currentUser.isPhoneVerified &&
      currentUser.isActive &&
      currentUser.role !== 'USER_FULL_VERIFIED' &&
      currentUser.role !== 'ADMIN'
    ) {
      dataToUpdate.role = 'USER_FULL_VERIFIED'
    }

    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: dataToUpdate,
    })

    const res = NextResponse.json({
      message: 'Profil został uzupełniony pomyślnie',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        address: updatedUser.address,
        city: updatedUser.city,
        postalCode: updatedUser.postalCode,
        phoneNumber: updatedUser.phoneNumber,
        isProfileVerified: updatedUser.isProfileVerified,
        isPhoneVerified: updatedUser.isPhoneVerified,
        role: updatedUser.role,
      },
    })

    // Ustaw cookie UX dla poziomu 3 jeśli podniesiono rolę
    if (dataToUpdate.role === 'USER_FULL_VERIFIED') {
      res.cookies.set('level3-ok', '1', { path: '/', maxAge: 60 * 60 * 24, sameSite: 'lax' })
    }

    return res
  } catch (error) {
    return handleApiError(error, request, { endpoint: 'auth/complete-profile' })
  }
}
