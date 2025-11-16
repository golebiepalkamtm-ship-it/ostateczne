import { handleApiError } from '@/lib/error-handling';
import { requireFirebaseAuth } from '@/lib/firebase-auth';
import { prisma } from '@/lib/prisma';
import { apiRateLimit } from '@/lib/rate-limit';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResponse = apiRateLimit(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Sprawdź autoryzację Firebase
    const authResult = await requireFirebaseAuth(request);
    if (authResult instanceof Response) {
      return authResult;
    }
    const { decodedToken } = authResult;

    // Pobierz dane z body
    const body = await request.json();
    const { firstName, lastName, address, city, postalCode, phoneNumber } = body;

    // Walidacja wymaganych pól
    if (!firstName?.trim() || !lastName?.trim() || !address?.trim()) {
      return NextResponse.json({ error: 'Imię, nazwisko i adres są wymagane' }, { status: 400 });
    }

    // Pobierz użytkownika
    const dbUser = await prisma.user.findFirst({
      where: { firebaseUid: decodedToken.uid },
      select: { id: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'Użytkownik nie został znaleziony' }, { status: 404 });
    }

    // Aktualizuj profil użytkownika
    const updatedUser = await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        address: address.trim(),
        city: city?.trim() || null,
        postalCode: postalCode?.trim() || null,
        phoneNumber: phoneNumber?.trim() || null,
        isProfileVerified: true, // Oznacz profil jako zweryfikowany po uzupełnieniu
      },
    });

    return NextResponse.json({
      message: 'Profil został uzupełniony pomyślnie',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        address: updatedUser.address,
        city: updatedUser.city,
        postalCode: updatedUser.postalCode,
        phoneNumber: updatedUser.phoneNumber,
        isProfileVerified: updatedUser.isProfileVerified,
        isPhoneVerified: updatedUser.isPhoneVerified,
      },
    });
  } catch (error) {
    return handleApiError(error, request, { endpoint: 'auth/complete-profile' });
  }
}
