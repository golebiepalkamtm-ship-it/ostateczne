import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorizeApiRequest } from '@/app/api/guards/auth-guard';

export async function POST(request: Request) {
  // Guard: require level2 to perform verification update
  const auth = await authorizeApiRequest('level2-ok');
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error, code: 'AUTHZ_GUARD' }, { status: auth.status });
  }

  try {
    const userId = auth.user.id;

    // Persist verification (idempotent)
    await prisma.user.update({ where: { id: userId }, data: { isPhoneVerified: true } });

    // Force session revalidation on client by setting a short-lived cookie
    const res = NextResponse.json({ status: 200, message: 'Verification successful. Session needs revalidation.' });
    // Cookie flags: Secure, HttpOnly, SameSite=Lax, short Max-Age
    res.headers.append('Set-Cookie', `pzk_status_refreshed=1; Path=/; Max-Age=5; HttpOnly; Secure; SameSite=Lax`);

    return res;
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message, code: 'VERIFY_FAIL' }, { status: 500 });
  }
}
