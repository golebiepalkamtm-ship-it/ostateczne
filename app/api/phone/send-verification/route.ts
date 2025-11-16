import { handleApiError } from '@/lib/error-handling';
import { requireFirebaseAuth } from '@/lib/firebase-auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Endpoint aktualizuje numer telefonu w profilu użytkownika.
 * Rzeczywiste wysyłanie SMS odbywa się przez Firebase Phone Auth SDK po stronie klienta.
 */
export async function POST(request: NextRequest) {
  try {
    // Sprawdź autoryzację Firebase
    const authResult = await requireFirebaseAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { decodedToken } = authResult;

    const body = await request.json().catch(() => ({}));
    const phoneNumberFromBody = body.phoneNumber as string | undefined;

    if (!phoneNumberFromBody) {
      return NextResponse.json(
        {
          error: 'Brak numeru telefonu w żądaniu.',
        },
        { status: 400 }
      );
    }

    // Zaktualizuj numer telefonu w profilu użytkownika
    const dbUser = await prisma.user.findFirst({
      where: { firebaseUid: decodedToken.uid },
      select: { id: true, phoneNumber: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'Użytkownik nie został znaleziony' }, { status: 404 });
    }

    // Jeśli numer się zmienił, resetuj weryfikację
    const phoneChanged = phoneNumberFromBody !== dbUser.phoneNumber;

    await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        phoneNumber: phoneNumberFromBody,
        // Reset weryfikacji jeśli numer się zmienił
        ...(phoneChanged && {
          isPhoneVerified: false,
          phoneVerificationCode: null,
          phoneVerificationExpires: null,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Numer telefonu został zaktualizowany.',
    });
  } catch (error) {
    return handleApiError(error, request, { endpoint: 'phone/send-verification' });
  }
}
