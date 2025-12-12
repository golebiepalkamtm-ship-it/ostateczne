export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { handleApiError } from '@/lib/error-handling';
import { createApiRoute } from '@/lib/api-middleware';
import { getAdminAuth } from '@/lib/firebase-admin';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

async function handler(request: NextRequest) {
  try {
    const adminAuth = getAdminAuth();
    if (!adminAuth) {
      return NextResponse.json(
        { error: 'Serwis tymczasowo niedostępny. Spróbuj ponownie później.' },
        { status: 503 },
      );
    }

    const authHeader = request.headers.get('authorization') || '';
    if (!authHeader.toLowerCase().startsWith('bearer ')) {
      return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
    }

    const idToken = authHeader.substring(7);
    const decoded = await adminAuth.verifyIdToken(idToken);

    const requireAdmin = request.nextUrl.searchParams.get('requireAdmin') === '1';
    if (requireAdmin) {
      const user = await prisma.user.findUnique({
        where: { id: decoded.uid },
        select: { role: true, isActive: true },
      });
      if (!user) {
        return NextResponse.json({ error: 'Użytkownik nie został znaleziony' }, { status: 404 });
      }
      if (!user.isActive) {
        return NextResponse.json({ error: 'Konto jest nieaktywne' }, { status: 403 });
      }
      if (user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Brak uprawnień administratora' }, { status: 403 });
      }
    }

    return NextResponse.json({ ok: true, uid: decoded.uid });
  } catch (error) {
    return handleApiError(error, request, { endpoint: 'auth/verify' });
  }
}

export const POST = createApiRoute(handler, 'public');
