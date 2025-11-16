export const runtime = 'nodejs';
import { handleApiError } from '@/lib/error-handling';
import { requireFirebaseAuth } from '@/lib/firebase-auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Endpoint aktualizuje status weryfikacji telefonu po pomyślnej weryfikacji przez Firebase Phone Auth.
 * Weryfikacja kodu została wykonana po stronie klienta przez PhoneAuthProvider.credential().
 * Tutaj tylko zapisujemy status weryfikacji w bazie danych.
 */
export async function POST(request: NextRequest) {
  try {
    // Sprawdź autoryzację Firebase
    const authResult = await requireFirebaseAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { decodedToken } = authResult;

    const body = await request.json();
    const { code, verificationId } = body;

    if (!code || !verificationId) {
      return NextResponse.json(
        { error: 'Brak kodu lub identyfikatora weryfikacji.' },
        { status: 400 }
      );
    }

    // Zaktualizuj status weryfikacji w bazie danych
    // (Kod został już zweryfikowany po stronie klienta przez PhoneAuthProvider.credential())
    const dbUser = await prisma.user.findFirst({
      where: { firebaseUid: decodedToken.uid },
      select: { id: true, phoneNumber: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'Użytkownik nie został znaleziony' }, { status: 404 });
    }

    if (!dbUser.phoneNumber) {
      return NextResponse.json(
        { error: 'Brak numeru telefonu w profilu. Najpierw dodaj numer telefonu.' },
        { status: 400 }
      );
    }

    // Zaktualizuj status weryfikacji
    await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        isPhoneVerified: true,
        phoneVerificationCode: null,
        phoneVerificationExpires: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Numer telefonu został pomyślnie zweryfikowany.',
    });
  } catch (error) {
    return handleApiError(error, request, { endpoint: 'phone/check-verification' });
  }
}
