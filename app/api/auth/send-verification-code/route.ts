/**
 * Endpoint do wysyłania kodu weryfikacyjnego SMS
 *
 * Alias dla /api/auth/send-verification-sms
 * Używa Firebase Authentication + Prisma ORM + Twilio SMS
 *
 * @route POST /api/auth/send-verification-code
 * @access Wymaga Firebase token w Authorization header
 * @returns { success: boolean, message: string }
 */

import { handleApiError } from '@/lib/error-handling';
import { requireFirebaseAuth } from '@/lib/firebase-auth';
import { debug, info } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

// Konfiguracja Twilio (opcjonalna - jeśli zmienne środowiskowe są ustawione)
const TWILIO_ENABLED = !!(
  process.env.TWILIO_ACCOUNT_SID &&
  process.env.TWILIO_AUTH_TOKEN &&
  process.env.TWILIO_PHONE_NUMBER
);

export async function POST(request: NextRequest) {
  try {
    // Weryfikacja Firebase token
    const authResult = await requireFirebaseAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    const { decodedToken } = authResult;

    // Pobierz użytkownika z bazy
    const dbUser = await prisma.user.findFirst({
      where: { firebaseUid: decodedToken.uid },
      select: {
        id: true,
        phoneNumber: true,
        isPhoneVerified: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'Użytkownik nie znaleziony' }, { status: 404 });
    }

    // Parsuj body (może zawierać numer telefonu do aktualizacji)
    let phoneNumber = dbUser.phoneNumber;
    try {
      const body = await request.json();
      if (body.phoneNumber) {
        phoneNumber = body.phoneNumber;

        // Aktualizuj numer telefonu w bazie jeśli się zmienił
        if (phoneNumber !== dbUser.phoneNumber) {
          await prisma.user.update({
            where: { id: dbUser.id },
            data: {
              phoneNumber,
              isPhoneVerified: false, // Reset weryfikacji przy zmianie numeru
            },
          });
          info(`Zaktualizowano numer telefonu dla użytkownika ${decodedToken.uid}`);
        }
      }
    } catch {
      // Body jest opcjonalny - użyj numeru z bazy
      debug('Brak body lub błąd parsowania - używam numeru z bazy');
    }

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Brak numeru telefonu. Uzupełnij numer telefonu w profilu.' },
        { status: 400 }
      );
    }

    // Walidacja formatu numeru telefonu (podstawowa)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/; // E.164 format
    if (!phoneRegex.test(phoneNumber.replace(/\s/g, ''))) {
      return NextResponse.json(
        { error: 'Nieprawidłowy format numeru telefonu. Użyj formatu: +48 123 456 789' },
        { status: 400 }
      );
    }

    // Generowanie 6-cyfrowego kodu weryfikacyjnego
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // Ważny 10 minut

    info(
      `📱 Generowanie kodu SMS dla użytkownika: ${dbUser.firstName} ${dbUser.lastName} (${phoneNumber})`
    );

    // Zapisz kod w bazie danych (zawsze, niezależnie od Twilio)
    await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        phoneVerificationCode: verificationCode,
        phoneVerificationExpires: expires,
      },
    });

    // Wyślij SMS przez Twilio (jeśli skonfigurowany)
    if (TWILIO_ENABLED) {
      try {
        const { Twilio } = await import('twilio');
        const twilioClient = new Twilio(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN
        );
        const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

        const message = await twilioClient.messages.create({
          body: `Pałka MTM - Twój kod weryfikacyjny to: ${verificationCode}\n\nKod ważny przez 10 minut.`,
          from: twilioPhoneNumber,
          to: phoneNumber,
        });

        info(`✅ SMS wysłany przez Twilio: SID ${message.sid}`);

        return NextResponse.json({
          success: true,
          message: 'Kod weryfikacyjny został wysłany na Twój telefon.',
          // W development - pokaż kod w odpowiedzi
          ...(process.env.NODE_ENV === 'development' && { code: verificationCode }),
        });
      } catch (twilioError) {
        logError('❌ Błąd wysyłania SMS przez Twilio:', twilioError);

        // W development - zwróć sukces z kodem (mimo błędu Twilio)
        if (process.env.NODE_ENV === 'development') {
          return NextResponse.json({
            success: true,
            message: `[DEV] Kod zapisany w bazie. Użyj kodu: ${verificationCode}`,
            code: verificationCode,
            warning: 'Twilio nie jest skonfigurowane lub wystąpił błąd',
          });
        }

        return NextResponse.json(
          { error: 'Nie udało się wysłać SMS. Spróbuj ponownie później.' },
          { status: 500 }
        );
      }
    } else {
      // Twilio nie skonfigurowane - tryb development
      info('⚠️ Twilio nie skonfigurowane - zwracam kod w odpowiedzi (tylko DEV)');

      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json({
          success: true,
          message: `[DEV] Kod weryfikacyjny: ${verificationCode}`,
          code: verificationCode,
          warning: 'Twilio nie jest skonfigurowane - użyj kodu powyżej do weryfikacji',
        });
      }

      return NextResponse.json(
        {
          error: 'Usługa SMS nie jest skonfigurowana. Skontaktuj się z administratorem.',
          code: 'SMS_NOT_CONFIGURED',
        },
        { status: 503 }
      );
    }
  } catch (error) {
    return handleApiError(error, request, { endpoint: 'auth/send-verification-code' });
  }
}
