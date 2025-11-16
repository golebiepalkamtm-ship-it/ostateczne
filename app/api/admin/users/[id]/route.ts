import { handleApiError } from '@/lib/error-handling';
import { requireAdminAuth } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdminAuth(request);
  if (authResult instanceof Response) {
    return authResult;
  }

  const params = await context.params;
  const id = params?.id as string;
  try {
    const body = await request.json();
    const data: {
      firstName?: string;
      lastName?: string;
      isActive?: boolean;
      role?: 'USER_REGISTERED' | 'USER_EMAIL_VERIFIED' | 'USER_FULL_VERIFIED' | 'ADMIN';
    } = {};
    if (typeof body.firstName === 'string') data.firstName = body.firstName;
    if (typeof body.lastName === 'string') data.lastName = body.lastName;
    if (typeof body.isActive === 'boolean') data.isActive = body.isActive;
    if (
      typeof body.role === 'string' &&
      ['USER_REGISTERED', 'USER_EMAIL_VERIFIED', 'USER_FULL_VERIFIED', 'ADMIN'].includes(body.role)
    )
      data.role = body.role as
        | 'USER_REGISTERED'
        | 'USER_EMAIL_VERIFIED'
        | 'USER_FULL_VERIFIED'
        | 'ADMIN';

    const updated = await prisma.user.update({ where: { id }, data });
    return NextResponse.json({ success: true, user: { id: updated.id } });
  } catch (e) {
    return handleApiError(e, request, { endpoint: 'admin/users/[id]', method: 'PATCH' });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const authResult = await requireAdminAuth(request);
  if (authResult instanceof Response) {
    return authResult;
  }

  const { decodedToken } = authResult;
  const params = await context.params;
  const id = params?.id as string;

  if (id === decodedToken.uid) {
    return NextResponse.json({ error: 'Nie można usunąć własnego konta' }, { status: 400 });
  }

  try {
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return handleApiError(e, request, { endpoint: 'admin/users/[id]', method: 'DELETE' });
  }
}
