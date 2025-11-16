import { handleApiError } from '@/lib/error-handling';
import { requireFirebaseAuth } from '@/lib/firebase-auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { Twilio } from 'twilio';

// Inicjalizacja klienta Twilio
const twilioClient = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

export async function POST(request: NextRequest) {
  const authResult = await requireFirebaseAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  const { decodedToken } = authResult;

  const user = await prisma.user.findUnique({
    where: { id: decodedToken.uid },
    select: { phoneNumber: true },
  });

  if (!user || !user.phoneNumber) {
    return NextResponse.json({ error: 'Brak numeru telefonu w profilu' }, { status: 400 });
  }

  // Generowanie 6-cyfrowego kodu
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(Date.now() + 10 * 60 * 1000); // Ważny 10 minut

  try {
    // Wysłanie SMS przez Twilio
    await twilioClient.messages.create({
      body: `Twój kod weryfikacyjny to: ${verificationCode}`,
      from: twilioPhoneNumber,
      to: user.phoneNumber,
    });

    // Zapisanie kodu i daty wygaśnięcia w bazie danych
    await prisma.user.update({
      where: { id: decodedToken.uid },
      data: {
        phoneVerificationCode: verificationCode,
        phoneVerificationExpires: expires,
      },
    });

    return NextResponse.json({ success: true, message: 'Kod weryfikacyjny został wysłany.' });
  } catch (error) {
    return handleApiError(error, request, { endpoint: 'auth/send-verification-sms' });
  }
}
