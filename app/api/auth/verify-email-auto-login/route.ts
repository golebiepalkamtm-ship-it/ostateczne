export const runtime = 'nodejs';
import { handleApiError } from '@/lib/error-handling';
import { getAdminAuth } from '@/lib/firebase-admin';
import { prisma } from '@/lib/prisma';
import { apiRateLimit } from '@/lib/rate-limit';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResponse = apiRateLimit(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Brak email' }, { status: 400 });
    }

    const adminAuth = getAdminAuth();
    if (!adminAuth) {
      return NextResponse.json(
        { error: 'Serwis tymczasowo niedostępny. Spróbuj ponownie później.' },
        { status: 503 }
      );
    }

    // Znajdź użytkownika w bazie po email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.firebaseUid) {
      return NextResponse.json(
        {
          error: 'Użytkownik nie został znaleziony',
        },
        { status: 404 }
      );
    }

    // Sprawdź czy użytkownik istnieje w Firebase
    let firebaseUser;
    try {
      firebaseUser = await adminAuth.getUser(user.firebaseUid);
    } catch {
      return NextResponse.json(
        {
          error: 'Użytkownik nie został znaleziony w Firebase',
        },
        { status: 404 }
      );
    }

    // Sprawdź czy email jest zweryfikowany w Firebase
    if (!firebaseUser.emailVerified) {
      return NextResponse.json(
        {
          error: 'Email nie został zweryfikowany w Firebase',
        },
        { status: 400 }
      );
    }

    // Utwórz custom token dla tego użytkownika
    const customToken = await adminAuth.createCustomToken(user.firebaseUid);

    // Zaktualizuj użytkownika w bazie - ustaw emailVerified, isActive i rolę Poziom 2
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        isActive: true,
        role: 'USER_EMAIL_VERIFIED',
      },
    });

    return NextResponse.json({
      customToken,
      email: user.email,
    });
  } catch (error) {
    return handleApiError(error, request, { endpoint: 'auth/verify-email-auto-login' });
  }
}
