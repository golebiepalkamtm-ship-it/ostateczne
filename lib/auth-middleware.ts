import { requireFirebaseAuth } from '@/lib/firebase-auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware sprawdzające czy użytkownik ma zweryfikowany telefon
 * Wymagane dla funkcji takich jak: tworzenie aukcji, licytowanie, dodawanie spotkań
 */
export async function requirePhoneVerification(request: NextRequest) {
  const authResult = await requireFirebaseAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  const { decodedToken } = authResult;

  try {
    const user = await prisma.user.findUnique({
      where: { id: decodedToken.uid },
      select: {
        isPhoneVerified: true,
        phoneNumber: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Użytkownik nie został znaleziony' }, { status: 404 });
    }

    if (!user.isPhoneVerified) {
      return NextResponse.json(
        {
          error: 'Weryfikacja numeru telefonu jest wymagana',
          requiresPhoneVerification: true,
          phoneNumber: user.phoneNumber,
          userProfile: {
            firstName: user.firstName,
            lastName: user.lastName,
          },
        },
        { status: 403 }
      );
    }

    return null; // Brak błędu - użytkownik jest zweryfikowany
  } catch (error) {
    console.error('Błąd sprawdzania weryfikacji telefonu:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas sprawdzania weryfikacji' },
      { status: 500 }
    );
  }
}

/**
 * Middleware sprawdzające czy użytkownik ma kompletny profil
 * Wymagane dla wszystkich funkcji platformy
 */
export async function requireCompleteProfile(request: NextRequest) {
  const authResult = await requireFirebaseAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  const { decodedToken } = authResult;

  try {
    const user = await prisma.user.findUnique({
      where: { id: decodedToken.uid },
      select: {
        firstName: true,
        lastName: true,
        address: true,
        city: true,
        postalCode: true,
        phoneNumber: true,
        isProfileVerified: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Użytkownik nie został znaleziony' }, { status: 404 });
    }

    // Sprawdź czy profil jest kompletny
    const isProfileComplete = !!(
      user.firstName &&
      user.lastName &&
      user.address &&
      user.city &&
      user.postalCode &&
      user.phoneNumber
    );

    if (!isProfileComplete) {
      return NextResponse.json(
        {
          error: 'Profil użytkownika jest niekompletny',
          requiresProfileCompletion: true,
          missingFields: {
            firstName: !user.firstName,
            lastName: !user.lastName,
            address: !user.address,
            city: !user.city,
            postalCode: !user.postalCode,
            phoneNumber: !user.phoneNumber,
          },
        },
        { status: 403 }
      );
    }

    return null; // Brak błędu - profil jest kompletny
  } catch (error) {
    console.error('Błąd sprawdzania kompletności profilu:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas sprawdzania profilu' },
      { status: 500 }
    );
  }
}

/**
 * Middleware sprawdzające czy użytkownik ma dostęp do Panelu Użytkownika (Poziom 2)
 * Wymagane dla wejścia do /profile
 */
export async function requireEmailVerification(request: NextRequest) {
  const authResult = await requireFirebaseAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  const { decodedToken } = authResult;

  try {
    const user = await prisma.user.findUnique({
      where: { id: decodedToken.uid },
      select: {
        emailVerified: true,
        isActive: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Użytkownik nie został znaleziony' }, { status: 404 });
    }

    // Poziom 2: USER_EMAIL_VERIFIED lub wyższy
    const hasLevel2Access =
      user.role === 'USER_EMAIL_VERIFIED' ||
      user.role === 'USER_FULL_VERIFIED' ||
      user.role === 'ADMIN';

    if (!hasLevel2Access) {
      return NextResponse.json(
        {
          error: 'Zweryfikuj email aby uzyskać dostęp do Panelu Użytkownika.',
          requiresEmailVerification: true,
          emailVerified: !!user.emailVerified,
          isActive: user.isActive,
          role: user.role,
        },
        { status: 403 }
      );
    }

    return null; // Brak błędu - użytkownik ma Poziom 2
  } catch (error) {
    console.error('Błąd sprawdzania dostępu do Panelu Użytkownika:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas sprawdzania dostępu' },
      { status: 500 }
    );
  }
}

/**
 * Middleware sprawdzające pełną weryfikację użytkownika (Poziom 3)
 * Wymagane dla aukcji, dodawania treści, referencji itp.
 */
export async function requireFullVerification(request: NextRequest) {
  const authResult = await requireFirebaseAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  const { decodedToken } = authResult;

  try {
    const user = await prisma.user.findUnique({
      where: { id: decodedToken.uid },
      select: {
        role: true,
        isPhoneVerified: true,
        isProfileVerified: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Użytkownik nie został znaleziony' }, { status: 404 });
    }

    // Poziom 3: USER_FULL_VERIFIED lub ADMIN
    const hasLevel3Access = user.role === 'USER_FULL_VERIFIED' || user.role === 'ADMIN';

    if (!hasLevel3Access) {
      return NextResponse.json(
        {
          error:
            'Uzupełnij profil i zweryfikuj telefon, aby brać udział w aukcjach i dodawać treści.',
          requiresFullVerification: true,
          role: user.role,
          isPhoneVerified: user.isPhoneVerified,
          isProfileVerified: user.isProfileVerified,
          profileComplete: !!(user.firstName && user.lastName && user.phoneNumber),
        },
        { status: 403 }
      );
    }

    return null; // Brak błędu - użytkownik ma Poziom 3
  } catch (error) {
    console.error('Błąd sprawdzania pełnej weryfikacji:', error);
    return NextResponse.json(
      { error: 'Wystąpił błąd podczas sprawdzania pełnej weryfikacji' },
      { status: 500 }
    );
  }
}

/**
 * Factory function do tworzenia middleware z różnymi poziomami weryfikacji
 */
export function createVerificationMiddleware(level: 'email' | 'profile' | 'phone' | 'full') {
  switch (level) {
    case 'email':
      return requireEmailVerification;
    case 'profile':
      return requireCompleteProfile;
    case 'phone':
      return requirePhoneVerification;
    case 'full':
      return requireFullVerification;
    default:
      return requireFirebaseAuth;
  }
}
