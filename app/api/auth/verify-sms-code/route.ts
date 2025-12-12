import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireFirebaseAuth } from '@/lib/firebase-auth';
import { handleApiError } from '@/lib/error-handling';
import { verifySmsCodeSchema } from '@/lib/validators';
import { debug as _debug, info, error as logError } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireFirebaseAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    const { decodedToken } = authResult;

    const body = await request.json().catch(() => ({}));
    const validation = verifySmsCodeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Nieprawidłowe dane wejściowe', details: validation.error.issues },
        { status: 400 },
      );
    }

    const { code } = validation.data;
    info(`📱 Verify SMS: code=${code}, uid=${decodedToken.uid}`);

  // ✅ POPRAWNIE - używaj ZAWSZE firebaseUid (findUnique dla unikalnego pola)
  const user = await prisma.user.findUnique({
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
    `✅ User found: id=${user.id}, hasCode=${!!user.phoneVerificationCode}, expires=${user.phoneVerificationExpires}`,
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

  // Pobierz pełne dane użytkownika, aby sprawdzić warunki podniesienia roli
  const fullUser = await prisma.user.findUnique({
    where: { firebaseUid: decodedToken.uid },
    select: { id: true, isProfileVerified: true, isActive: true, role: true },
  });

  if (!fullUser) {
    return NextResponse.json({ error: 'Użytkownik nie znaleziony' }, { status: 404 });
  }

  const dataToUpdate: any = {
    isPhoneVerified: true,
    phoneVerificationCode: null,
    phoneVerificationExpires: null,
  };

  // Podnieś rolę do USER_FULL_VERIFIED tylko jeśli:
  // - profil jest zweryfikowany
  // - użytkownik jest aktywny
  // - nie jest już USER_FULL_VERIFIED ani ADMIN
  if (
    fullUser.isProfileVerified &&
    fullUser.isActive &&
    fullUser.role !== 'USER_FULL_VERIFIED' &&
    fullUser.role !== 'ADMIN'
  ) {
    dataToUpdate.role = 'USER_FULL_VERIFIED';
  }

  await prisma.user.update({
    where: { id: fullUser.id },
    data: dataToUpdate,
  });

  info(`✅ Telefon zweryfikowany dla użytkownika: ${fullUser.id}`);

  const res = NextResponse.json({ success: true });
  // UX cookie: poziom 3 odblokowany tylko jeśli rzeczywiście podniesiono rolę
  if (dataToUpdate.role === 'USER_FULL_VERIFIED') {
    res.cookies.set('level3-ok', '1', { path: '/', maxAge: 60 * 60 * 24, sameSite: 'lax' });
  }
  return res;
  } catch (error) {
    return handleApiError(error, request, { endpoint: 'auth/verify-sms-code' });
  }
}
