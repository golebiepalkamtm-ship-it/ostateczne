import { handleApiError } from '@/lib/error-handling';
import { getAdminAuth } from '@/lib/firebase-admin';
import { requireFirebaseAuth } from '@/lib/firebase-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Wymagaj autoryzacji Firebase
    const authResult = await requireFirebaseAuth(req);
    if (authResult instanceof Response) {
      return authResult;
    }

    const user = authResult.decodedToken;

    // Sprawdź czy email nie jest już zweryfikowany
    if (user.email_verified) {
      return NextResponse.json({ error: 'Email jest już zweryfikowany' }, { status: 400 });
    }

    const adminAuth = getAdminAuth();
    if (!adminAuth) {
      return NextResponse.json({ error: 'Serwis tymczasowo niedostępny' }, { status: 503 });
    }

    const body = await req.json().catch(() => ({}));
    const userName = body.userName;

    try {
      const actionCodeSettings = {
        url: `${req.nextUrl.origin}/auth/verify-email`,
        handleCodeInApp: false,
      };

      // Wygeneruj link weryfikacyjny
      const verificationLink = await adminAuth.generateEmailVerificationLink(
        user.email!,
        actionCodeSettings,
      );

      console.log(`✉️ Wysyłanie emaila weryfikacyjnego do ${user.email}`);

      // Wyślij email z profesjonalnym szablonem
      const emailResponse = await fetch(`${req.nextUrl.origin}/api/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: user.email,
          subject: '✅ Zweryfikuj swój email - Pałka MTM',
          type: 'verification',
          verificationLink,
          userName,
        }),
      });

      if (!emailResponse.ok) {
        throw new Error('Nie udało się wysłać emaila');
      }

      console.log(`✅ Email weryfikacyjny wysłany do ${user.email}`);

      return NextResponse.json({
        success: true,
        message:
          'Email weryfikacyjny został wysłany. Sprawdź swoją skrzynkę odbiorczą (także SPAM).',
      });
    } catch (error) {
      return handleApiError(error, req, { endpoint: 'auth/send-verification-email', inner: true });
    }
  } catch (error) {
    return handleApiError(error, req, { endpoint: 'auth/send-verification-email' });
  }
}
