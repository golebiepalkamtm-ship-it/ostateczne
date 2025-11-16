import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireFirebaseAuth } from '@/lib/firebase-auth';
import { debug as _debug, info, error as logError } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const authResult = await requireFirebaseAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  const { decodedToken } = authResult;

  const body = await request.json().catch(() => ({}));
  const code: string | undefined = body.code;

  info(`📱 Verify SMS: code=${code}, uid=${decodedToken.uid}`);

  if (!code) {
    logError('❌ Brak kodu w request body');
    return NextResponse.json({ error: 'Brak kodu' }, { status: 400 });
  }

  // ✅ POPRAWNIE - używaj ZAWSZE firebaseUid
  const user = await prisma.user.findFirst({
    where: { firebaseUid: decodedToken.uid },
    select: {
      id: true,
      phoneVerificationCode: true,
      phoneVerificationExpires: true,
      role: true,
    },
  });

  if (!user) {
    logError(`❌ Użytkownik nie znaleziony: firebaseUid=${decodedToken.uid}`);
    return NextResponse.json({ error: 'Użytkownik nie znaleziony' }, { status: 404 });
  }

  info(
    `✅ User found: id=${user.id}, hasCode=${!!user.phoneVerificationCode}, expires=${user.phoneVerificationExpires}`
  );

  if (!user.phoneVerificationCode || !user.phoneVerificationExpires) {
    logError('❌ Brak aktywnego kodu weryfikacyjnego');
    return NextResponse.json({ error: 'Brak aktywnego kodu' }, { status: 400 });
  }

  if (new Date(user.phoneVerificationExpires).getTime() < Date.now()) {
    logError('❌ Kod wygasł');
    return NextResponse.json({ error: 'Kod wygasł' }, { status: 400 });
  }

  if (user.phoneVerificationCode !== code) {
    logError(`❌ Nieprawidłowy kod: expected=${user.phoneVerificationCode}, got=${code}`);
    return NextResponse.json({ error: 'Nieprawidłowy kod' }, { status: 400 });
  }

  // ✅ Używaj user.id (UUID z bazy), nie decodedToken.uid (Firebase UID)
  await prisma.user.update({
    where: { id: user.id },
    data: {
      isPhoneVerified: true,
      isProfileVerified: true,
      role: 'USER_FULL_VERIFIED',
      phoneVerificationCode: null,
      phoneVerificationExpires: null,
    },
  });

  info(`✅ Telefon zweryfikowany dla użytkownika: ${user.id}`);

  const res = NextResponse.json({ success: true });
  // UX cookie: poziom 3 odblokowany
  res.cookies.set('level3-ok', '1', { path: '/', maxAge: 60 * 60 * 24, sameSite: 'lax' });
  return res;
}
