import { handleApiError } from '@/lib/error-handling';
import { getAdminUser } from '@/lib/firebase-auth-helpers';
import { prisma } from '@/lib/prisma';
import { apiRateLimit } from '@/lib/rate-limit';
import { NextRequest, NextResponse } from 'next/server';

// PATCH - Zatwierdź/odrzuć spotkanie z hodowcą
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Rate limiting
    const rateLimitResponse = apiRateLimit(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Sprawdź autoryzację - tylko admin
    const authResult = await getAdminUser(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id } = await params;
    const { isApproved } = await request.json();

    if (typeof isApproved !== 'boolean') {
      return NextResponse.json({ error: 'Pole isApproved musi być typu boolean' }, { status: 400 });
    }

    // Sprawdź czy spotkanie istnieje
    const existingMeeting = await prisma.breederMeeting.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!existingMeeting) {
      return NextResponse.json({ error: 'Spotkanie nie zostało znalezione' }, { status: 404 });
    }

    // Zaktualizuj status zatwierdzenia
    const updatedMeeting = await prisma.breederMeeting.update({
      where: { id },
      data: { isApproved },
      select: {
        id: true,
        title: true,
        isApproved: true,
        updatedAt: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: `Spotkanie zostało ${isApproved ? 'zatwierdzone' : 'odrzucone'}`,
      meeting: updatedMeeting,
    });
  } catch (error) {
    return handleApiError(error, request, { endpoint: 'admin/breeder-meetings/[id]', method: 'PATCH' });
  }
}

// DELETE - Usuń spotkanie z hodowcą
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limiting
    const rateLimitResponse = apiRateLimit(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Sprawdź autoryzację - tylko admin
    const authResult = await getAdminUser(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id } = await params;

    // Sprawdź czy spotkanie istnieje
    const existingMeeting = await prisma.breederMeeting.findUnique({
      where: { id },
    });

    if (!existingMeeting) {
      return NextResponse.json({ error: 'Spotkanie nie zostało znalezione' }, { status: 404 });
    }

    // Usuń spotkanie
    await prisma.breederMeeting.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Spotkanie zostało usunięte',
    });
  } catch (error) {
    return handleApiError(error, request, { endpoint: 'admin/breeder-meetings/[id]', method: 'DELETE' });
  }
}
