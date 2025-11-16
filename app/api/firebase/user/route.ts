import { handleApiError } from '@/lib/error-handling';
import { requireAdminAuth } from '@/lib/admin-auth';
import { getAdminAuth } from '@/lib/firebase-admin';
import { requireFirebaseAuth } from '@/lib/firebase-auth';
import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Wymaga uprawnień administratora
    const adminResult = await requireAdminAuth(request);
    if (adminResult instanceof NextResponse) {
      return adminResult;
    }

    const { uid, customClaims } = await request.json();

    if (!uid) {
      return NextResponse.json({ error: 'UID jest wymagany' }, { status: 400 });
    }

    // Ustaw custom claims dla użytkownika
    const adminAuth = getAdminAuth();
    if (!adminAuth) {
      return NextResponse.json(
        { error: 'Serwis tymczasowo niedostępny. Spróbuj ponownie później.' },
        { status: 503 }
      );
    }
    await adminAuth.setCustomUserClaims(uid, customClaims || {});

    return NextResponse.json({ success: true, message: 'Custom claims zostały ustawione' });
  } catch (error) {
    return handleApiError(error, request, { endpoint: 'firebase/user', method: 'POST' });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Wymaga autoryzacji Firebase
    const authResult = await requireFirebaseAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid') || authResult.decodedToken.uid;

    if (!uid) {
      return NextResponse.json({ error: 'UID jest wymagany' }, { status: 400 });
    }

    // Sprawdź czy użytkownik może pobrać te dane (własne lub admin)
    const isAdmin = authResult.decodedToken.role === 'ADMIN';
    const isOwnProfile = uid === authResult.decodedToken.uid;

    if (!isAdmin && !isOwnProfile) {
      return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 });
    }

    // Pobierz dane użytkownika z Firebase Admin SDK
    const adminAuth = getAdminAuth();
    if (!adminAuth) {
      return NextResponse.json(
        { error: 'Serwis tymczasowo niedostępny. Spróbuj ponownie później.' },
        { status: 503 }
      );
    }
    const userRecord = await adminAuth.getUser(uid);

    return NextResponse.json({
      uid: userRecord.uid,
      email: userRecord.email,
      emailVerified: userRecord.emailVerified,
      customClaims: userRecord.customClaims || {},
      disabled: userRecord.disabled,
      displayName: userRecord.displayName,
      photoURL: userRecord.photoURL,
    });
  } catch (error) {
    return handleApiError(error, request, { endpoint: 'firebase/user', method: 'GET' });
  }
}
