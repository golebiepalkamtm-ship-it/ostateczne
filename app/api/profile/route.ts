import { AppErrors, handleApiError } from '@/lib/error-handling';
import { requireFirebaseAuth } from '@/lib/firebase-auth';
import { prisma } from '@/lib/prisma';
import { apiRateLimit } from '@/lib/rate-limit';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const updateProfileSchema = z.object({
  firstName: z
    .string()
    .min(2, 'Imię musi mieć co najmniej 2 znaki')
    .max(50, 'Imię nie może być dłuższe niż 50 znaków'),
  lastName: z
    .string()
    .min(2, 'Nazwisko musi mieć co najmniej 2 znaki')
    .max(50, 'Nazwisko nie może być dłuższe niż 50 znaków'),
  address: z
    .string()
    .min(5, 'Adres musi mieć co najmniej 5 znaków')
    .max(100, 'Adres nie może być dłuższy niż 100 znaków'),
  city: z
    .string()
    .min(2, 'Miasto musi mieć co najmniej 2 znaki')
    .max(50, 'Miasto nie może być dłuższe niż 50 znaków'),
  postalCode: z.string().regex(/^\d{2}-\d{3}$/, 'Kod pocztowy musi być w formacie XX-XXX'),
  phoneNumber: z
    .string()
    .optional()
    .nullable()
    .refine(
      val => !val || val === '' || val === null || /^\+\d{1,4}\s?\d{3,}/.test(val),
      'Numer telefonu musi być w formacie międzynarodowym (np. +48 123 456 789)',
    ),
});

// GET - Pobierz dane profilu użytkownika
export async function GET(request: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔵 GET /api/profile - rozpoczęcie');
    }

    // Rate limiting
    const rateLimitResponse = apiRateLimit(request);
    if (rateLimitResponse) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔴 Rate limit exceeded');
      }
      return rateLimitResponse;
    }

    // Sprawdź autoryzację Firebase
    const authResult = await requireFirebaseAuth(request);
    if (authResult instanceof NextResponse) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔴 Auth failed');
      }
      return authResult;
    }
    const { decodedToken } = authResult;

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Auth successful, user:', decodedToken.uid);
    }

    // Pobierz dane użytkownika
    let user;
    try {
      user = await prisma.user.findFirst({
        where: { firebaseUid: decodedToken.uid },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          address: true,
          city: true,
          postalCode: true,
          phoneNumber: true,
          isPhoneVerified: true,
          isProfileVerified: true,
          isActive: true,
          role: true,
          createdAt: true,
        },
      });
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Prisma findFirst error:', error);
      }
      throw error;
    }

    if (!user) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔴 User not found');
      }
      return NextResponse.json({ error: 'Użytkownik nie został znaleziony' }, { status: 404 });
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ User found, returning data');
    }

    return NextResponse.json({
      user: {
        ...user,
        createdAt: user.createdAt.toISOString(),
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ GET /api/profile error:', error);
      console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('Error message:', error instanceof Error ? error.message : String(error));
      if (error instanceof Error && error.stack) {
        console.error('Error stack:', error.stack);
      }
    }
    return handleApiError(error, request, { endpoint: 'profile', method: 'GET' });
  }
}

// PATCH - Aktualizuj dane profilu użytkownika
export async function PATCH(request: NextRequest) {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔵 PATCH /api/profile - rozpoczęcie');
    }

    // Rate limiting
    const rateLimitResponse = apiRateLimit(request);
    if (rateLimitResponse) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔴 Rate limit exceeded');
      }
      return rateLimitResponse;
    }

    // Sprawdź autoryzację Firebase
    const authResult = await requireFirebaseAuth(request);
    if (authResult instanceof NextResponse) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔴 Auth failed');
      }
      return authResult;
    }
    const { decodedToken } = authResult;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Auth successful, user:', decodedToken.uid);
    }

    // Parsuj i waliduj dane
    let body;
    try {
      body = await request.json();
    } catch {
      return handleApiError(AppErrors.validation('Nieprawidłowy format JSON'), request, { endpoint: 'profile', method: 'PATCH' });
    }

    let validatedData;
    try {
      validatedData = updateProfileSchema.parse(body);
    } catch (error) {
      // Loguj szczegóły błędu walidacji w development
      if (process.env.NODE_ENV === 'development') {
        console.error('Validation error:', error);
        console.error('Body received:', JSON.stringify(body, null, 2));
      }
      return handleApiError(error, request, { endpoint: 'profile', method: 'PATCH', body });
    }

    // Sprawdź czy użytkownik istnieje
    const existingUser = await prisma.user.findFirst({
      where: { firebaseUid: decodedToken.uid },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'Użytkownik nie został znaleziony' }, { status: 404 });
    }

    // Jeśli numer telefonu się zmienił, resetuj weryfikację
    const phoneChanged = existingUser.phoneNumber !== (validatedData.phoneNumber || null);

    // Sprawdź czy profil jest kompletny (wszystkie wymagane pola uzupełnione)
    const isProfileComplete =
      validatedData.firstName &&
      validatedData.lastName &&
      validatedData.address &&
      validatedData.city &&
      validatedData.postalCode &&
      validatedData.phoneNumber;

    const updateData: {
      firstName: string;
      lastName: string;
      address: string;
      city: string;
      postalCode: string;
      phoneNumber?: string | null;
      isPhoneVerified?: boolean;
      phoneVerificationCode?: null;
      phoneVerificationExpires?: null;
      isProfileVerified?: boolean;
    } = {
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      address: validatedData.address,
      city: validatedData.city,
      postalCode: validatedData.postalCode,
      ...(validatedData.phoneNumber && typeof validatedData.phoneNumber === 'string' && validatedData.phoneNumber.trim() !== '' 
        ? { phoneNumber: validatedData.phoneNumber.trim() } 
        : { phoneNumber: null }),
    };

    if (phoneChanged) {
      updateData.isPhoneVerified = false;
      updateData.phoneVerificationCode = null;
      updateData.phoneVerificationExpires = null;
    }

    // Administratorzy są automatycznie w pełni zweryfikowani
    if (existingUser.role === 'ADMIN') {
      updateData.isProfileVerified = true;
      updateData.isPhoneVerified = true;
    } else if (isProfileComplete) {
      updateData.isProfileVerified = true;
    }

    // Aktualizuj profil użytkownika
    let updatedUser;
    try {
      updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: updateData,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          address: true,
          city: true,
          postalCode: true,
          phoneNumber: true,
          isPhoneVerified: true,
          isProfileVerified: true,
          isActive: true,
          role: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      // Loguj szczegóły błędu Prisma w development
      if (process.env.NODE_ENV === 'development') {
        console.error('Prisma update error:', error);
        console.error('Update data:', JSON.stringify(updateData, null, 2));
      }
      throw error; // Rzuć dalej, aby został obsłużony przez handleApiError
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Profile updated successfully');
    }

    return NextResponse.json({
      message: 'Profil został zaktualizowany pomyślnie',
      user: {
        ...updatedUser,
        updatedAt: updatedUser.updatedAt.toISOString(),
      },
      phoneVerificationReset: phoneChanged,
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ PATCH /api/profile error:', error);
      console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('Error message:', error instanceof Error ? error.message : String(error));
      if (error instanceof Error && error.stack) {
        console.error('Error stack:', error.stack);
      }
    }
    return handleApiError(error, request, { endpoint: 'profile', method: 'PATCH' });
  }
}
