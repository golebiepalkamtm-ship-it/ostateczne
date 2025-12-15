import { NextRequest, NextResponse } from 'next/server';
import { requireFirebaseAuth } from '@/lib/firebase-auth';
import { handleApiError } from '@/lib/error-handling';

/**
 * Endpoint diagnostyczny - zwraca szczegółowy status użytkownika
 */
export async function GET(request: NextRequest) {
  try {
    // Sprawdź czy użytkownik jest zalogowany
    const authResult = await requireFirebaseAuth(request);
    if (authResult instanceof NextResponse) {
      return NextResponse.json(
        {
          authenticated: false,
          error: 'Użytkownik nie jest zalogowany',
          reason: 'Brak ważnego tokena Firebase',
        },
        { status: 401 },
      );
    }

    const { decodedToken } = authResult;

    // Pobierz dane użytkownika z bazy
    const { prisma, isDatabaseConfigured } = await import('@/lib/prisma');
    if (!isDatabaseConfigured() || !prisma) {
      return NextResponse.json(
        {
          authenticated: true,
          firebaseUid: decodedToken.uid,
          email: decodedToken.email,
          inDatabase: false,
          error: 'Baza danych nie jest skonfigurowana',
        },
        { status: 503 },
      );
    }

    const user = await prisma.user.findFirst({
      where: { firebaseUid: decodedToken.uid },
      select: {
        id: true,
        email: true,
        firebaseUid: true,
        role: true,
        isActive: true,
        isPhoneVerified: true,
        isProfileVerified: true,
        emailVerified: true,
        phoneNumber: true,
        firstName: true,
        lastName: true,
        address: true,
        city: true,
        postalCode: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          authenticated: true,
          firebaseUid: decodedToken.uid,
          email: decodedToken.email,
          inDatabase: false,
          error: 'Użytkownik nie znaleziony w bazie danych',
          reason: 'Konto Firebase istnieje, ale nie ma odpowiadającego rekordu w Prisma',
          suggestion: 'Spróbuj się wylogować i zalogować ponownie',
        },
        { status: 404 },
      );
    }

    // Sprawdź co blokuje upload
    const blockers: string[] = [];
    const requirements: {
      emailVerified: boolean;
      phoneVerified: boolean;
      profileComplete: boolean;
      accountActive: boolean;
    } = {
      emailVerified: !!user.emailVerified,
      phoneVerified: user.isPhoneVerified,
      profileComplete: user.isProfileVerified,
      accountActive: user.isActive,
    };

    if (!user.emailVerified) {
      blockers.push('❌ Email nie jest zweryfikowany - sprawdź skrzynkę odbiorczą');
    }

    if (!user.isPhoneVerified) {
      blockers.push(
        '❌ Telefon nie jest zweryfikowany - przejdź do panelu użytkownika i zweryfikuj telefon',
      );
    }

    if (!user.isProfileVerified) {
      blockers.push(
        '⚠️ Profil nie jest kompletny - uzupełnij imię, nazwisko, adres w panelu użytkownika',
      );
    }

    if (!user.isActive) {
      blockers.push('❌ Konto jest nieaktywne - skontaktuj się z administratorem');
    }

    // Określ co użytkownik może robić
    const permissions = {
      canLogin: user.isActive,
      canAccessDashboard: user.isActive && !!user.emailVerified,
      canUploadFiles: user.isActive && !!user.emailVerified && user.isPhoneVerified,
      canCreateAuctions:
        user.isActive &&
        !!user.emailVerified &&
        user.isPhoneVerified &&
        user.isProfileVerified,
      canBid:
        user.isActive &&
        !!user.emailVerified &&
        user.isPhoneVerified &&
        user.isProfileVerified,
    };

    return NextResponse.json({
      authenticated: true,
      inDatabase: true,
      user: {
        id: user.id,
        firebaseUid: user.firebaseUid,
        email: user.email,
        role: user.role,
        phoneNumber: user.phoneNumber,
        firstName: user.firstName,
        lastName: user.lastName,
        address: user.address,
        city: user.city,
        postalCode: user.postalCode,
        createdAt: user.createdAt,
      },
      requirements,
      permissions,
      blockers,
      status:
        blockers.length === 0
          ? '✅ Konto w pełni aktywne i zweryfikowane'
          : `⚠️ ${blockers.length} ${blockers.length === 1 ? 'blokada' : 'blokad(y)'}`,
      nextSteps:
        blockers.length > 0
          ? blockers
          : ['✅ Możesz korzystać ze wszystkich funkcji platformy'],
    });
  } catch (error) {
    return handleApiError(error, request, { endpoint: 'user/status' });
  }
}


