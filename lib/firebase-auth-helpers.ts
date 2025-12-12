import { DecodedIdToken } from 'firebase-admin/auth';
import { NextRequest, NextResponse } from 'next/server';
import { requireFirebaseAuth } from './firebase-auth';
import { prisma } from './prisma';

/**
 * Typ zwracany przez getAuthUser - zawiera zarówno Firebase UID jak i Prisma user
 */
export interface AuthUserResult {
  decodedToken: DecodedIdToken;
  firebaseUid: string;
  userId: string; // Prisma CUID
  user: {
    id: string;
    email: string;
    role: string;
    isActive: boolean;
    firstName: string | null;
    lastName: string | null;
    firebaseUid: string | null;
  };
}

/**
 * Helper do pobrania zautoryzowanego użytkownika z Firebase Auth
 * Automatycznie pobiera także dane z bazy danych Prisma
 *
 * @param request NextRequest object
 * @returns AuthUserResult lub NextResponse z błędem autoryzacji
 */
export async function getAuthUser(request: NextRequest): Promise<AuthUserResult | NextResponse> {
  // Sprawdź autoryzację Firebase
  const authResult = await requireFirebaseAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { decodedToken } = authResult;
  const firebaseUid = decodedToken.uid;

  // Pobierz użytkownika z bazy danych
  const user = await prisma.user.findUnique({
    where: { firebaseUid },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      firstName: true,
      lastName: true,
      firebaseUid: true,
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: 'Użytkownik nie został znaleziony w bazie danych' },
      { status: 404 },
    );
  }

  if (!user.isActive) {
    return NextResponse.json({ error: 'Konto jest nieaktywne' }, { status: 403 });
  }

  return {
    decodedToken,
    firebaseUid,
    userId: user.id, // Prisma CUID
    user,
  };
}

/**
 * Helper do sprawdzenia czy użytkownik ma uprawnienia administratora
 *
 * @param request NextRequest object
 * @returns AuthUserResult z rolą ADMIN lub NextResponse z błędem
 */
export async function getAdminUser(request: NextRequest): Promise<AuthUserResult | NextResponse> {
  const authResult = await getAuthUser(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  if (authResult.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Brak uprawnień administratora' }, { status: 403 });
  }

  return authResult;
}

/**
 * Helper do sprawdzenia czy użytkownik jest aktywny
 *
 * @param request NextRequest object
 * @returns AuthUserResult z aktywnym użytkownikiem lub NextResponse z błędem
 */
export async function getActiveUser(request: NextRequest): Promise<AuthUserResult | NextResponse> {
  const authResult = await getAuthUser(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  if (!authResult.user.isActive) {
    return NextResponse.json({ error: 'Konto jest nieaktywne' }, { status: 403 });
  }

  return authResult;
}
