export const runtime = 'nodejs';
// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { getAdminAuth } from '@/lib/firebase-admin';
import { handleApiError } from '@/lib/error-handling';
import { prisma } from '@/lib/prisma';
import { apiRateLimit } from '@/lib/rate-limit';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email('Nieprawidłowy format email'),
  password: z.string().min(8, 'Hasło musi mieć minimum 8 znaków'),
  firstName: z
    .union([z.string().min(2, 'Imię musi mieć minimum 2 znaki'), z.literal('')])
    .optional(),
  lastName: z
    .union([z.string().min(2, 'Nazwisko musi mieć minimum 2 znaki'), z.literal('')])
    .optional(),
  phoneNumber: z
    .union([
      z.string().regex(/^\+48\d{9}$/, 'Nieprawidłowy format numeru telefonu (+48XXXXXXXXX)'),
      z.string().regex(/^\+48\d{8}$/, 'Nieprawidłowy format numeru telefonu (+48XXXXXXXX)'),
      z.literal(''),
    ])
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting dla rejestracji
    const rateLimitResponse = apiRateLimit(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Parse request body with error handling
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('❌ [REGISTER] Błąd parsowania request body:', parseError);
      return NextResponse.json(
        { error: 'Nieprawidłowy format danych. Wymagany jest JSON.' },
        { status: 400 }
      );
    }

    // Validate data
    let validatedData;
    try {
      validatedData = registerSchema.parse(body);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        console.error('❌ [REGISTER] Zod validation error:', validationError.issues);
        return NextResponse.json({ error: validationError.issues[0].message }, { status: 400 });
      }
      throw validationError;
    }

    console.log('🔍 [REGISTER] Próba rejestracji dla:', validatedData.email);
    console.log('🔍 [REGISTER] Dane walidacji:', {
      email: validatedData.email,
      hasPassword: !!validatedData.password,
      firstName: validatedData.firstName || 'brak',
      lastName: validatedData.lastName || 'brak',
      phoneNumber: validatedData.phoneNumber || 'brak',
    });

    // Najpierw próbuj utworzyć użytkownika w Firebase - to jest źródło prawdy
    const adminAuth = getAdminAuth();
    if (!adminAuth) {
      console.error('❌ [REGISTER] Firebase Admin Auth nie jest zainicjalizowany');
      return NextResponse.json(
        { error: 'Serwis tymczasowo niedostępny. Spróbuj ponownie później.' },
        { status: 503 }
      );
    }
    let firebaseUser;

    try {
      console.log('🔥 [REGISTER] Próba utworzenia użytkownika w Firebase...');
      firebaseUser = await adminAuth.createUser({
        email: validatedData.email,
        password: validatedData.password,
        emailVerified: false,
        disabled: false,
      });
      console.log('✅ [REGISTER] Utworzono nowego użytkownika w Firebase:', firebaseUser.uid);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (firebaseError: any) {
      console.log('⚠️ [REGISTER] Firebase error:', firebaseError?.code);
      // Jeśli użytkownik już istnieje w Firebase, to nie można się zarejestrować
      if (
        firebaseError?.code === 'auth/email-already-exists' ||
        firebaseError?.code === 'auth/email-already-in-use'
      ) {
        return NextResponse.json(
          {
            error: 'Użytkownik z tym emailem już istnieje. Zaloguj się zamiast rejestrować.',
          },
          { status: 400 }
        );
      }
      // Inny błąd Firebase - rzucamy dalej
      throw firebaseError;
    }

    // Email weryfikacyjny zostanie wysłany przez client-side po zalogowaniu użytkownika
    // (Firebase Admin SDK nie ma metody do automatycznego wysyłania email weryfikacyjnego)

    // Sprawdź czy użytkownik już istnieje w bazie
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    let user;
    if (existingUser) {
      // Jeśli istnieje rekord bez firebaseUid - zaktualizuj go
      if (!existingUser.firebaseUid) {
        console.log('🔄 [REGISTER] Aktualizowanie istniejącego rekordu bez firebaseUid');
        user = await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            firebaseUid: firebaseUser.uid,
            firstName:
              validatedData.firstName && validatedData.firstName.trim() !== ''
                ? validatedData.firstName
                : existingUser.firstName,
            lastName:
              validatedData.lastName && validatedData.lastName.trim() !== ''
                ? validatedData.lastName
                : existingUser.lastName,
            phoneNumber:
              validatedData.phoneNumber && validatedData.phoneNumber.trim() !== ''
                ? validatedData.phoneNumber
                : existingUser.phoneNumber,
            isActive: false,
            emailVerified: null,
          },
        });
        console.log('✅ [REGISTER] Zaktualizowano rekord w bazie');
      } else if (existingUser.firebaseUid === firebaseUser.uid) {
        // Rekord istnieje z tym samym firebaseUid - to nie powinno się zdarzyć bo Firebase zwróciłby błąd
        // Ale dla bezpieczeństwa sprawdzamy
        console.log(
          '⚠️ [REGISTER] Rekord już istnieje z tym samym firebaseUid - to nie powinno się zdarzyć'
        );
        // Nie usuwamy użytkownika z Firebase - może być używany
        return NextResponse.json(
          {
            error: 'Użytkownik z tym emailem już istnieje. Zaloguj się zamiast rejestrować.',
          },
          { status: 400 }
        );
      } else {
        // Rekord istnieje z INNYM firebaseUid - sprawdź czy stary użytkownik istnieje w Firebase
        console.log(
          '🔍 [REGISTER] Rekord z tym emailem ma inny firebaseUid:',
          existingUser.firebaseUid
        );
        console.log('🔍 [REGISTER] Sprawdzam czy stary użytkownik istnieje w Firebase...');

        let oldFirebaseUserExists = false;
        try {
          await adminAuth.getUser(existingUser.firebaseUid);
          oldFirebaseUserExists = true;
          console.log('⚠️ [REGISTER] Stary użytkownik istnieje w Firebase - konflikt');
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (getUserError: any) {
          if (getUserError?.code === 'auth/user-not-found') {
            oldFirebaseUserExists = false;
            console.log(
              '✅ [REGISTER] Stary użytkownik nie istnieje w Firebase - bezpieczna aktualizacja'
            );
          } else {
            console.error('❌ [REGISTER] Błąd sprawdzania starego użytkownika:', getUserError);
            // W przypadku błędu, lepiej nie podejmować działania - usuń nowego użytkownika
            try {
              await adminAuth.deleteUser(firebaseUser.uid);
            } catch (deleteError) {
              console.error('Błąd usuwania użytkownika z Firebase:', deleteError);
            }
            return NextResponse.json(
              {
                error: 'Wystąpił błąd podczas sprawdzania danych. Spróbuj ponownie.',
              },
              { status: 500 }
            );
          }
        }

        if (oldFirebaseUserExists) {
          // Stary użytkownik istnieje - rzeczywiście konflikt
          console.log(
            '❌ [REGISTER] Konflikt: rekord z tym emailem ma inny firebaseUid i stary użytkownik istnieje w Firebase'
          );
          // Usuń nowo utworzonego użytkownika z Firebase
          try {
            await adminAuth.deleteUser(firebaseUser.uid);
          } catch (deleteError) {
            console.error('Błąd usuwania użytkownika z Firebase:', deleteError);
          }
          return NextResponse.json(
            {
              error:
                'Użytkownik z tym emailem już istnieje z innym kontem. Skontaktuj się z administratorem.',
            },
            { status: 400 }
          );
        } else {
          // Stary użytkownik nie istnieje - bezpieczna aktualizacja
          console.log(
            '🔄 [REGISTER] Aktualizowanie rekordu z nowym firebaseUid (stary użytkownik nie istnieje)'
          );
          user = await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              firebaseUid: firebaseUser.uid,
              firstName:
                validatedData.firstName && validatedData.firstName.trim() !== ''
                  ? validatedData.firstName
                  : existingUser.firstName,
              lastName:
                validatedData.lastName && validatedData.lastName.trim() !== ''
                  ? validatedData.lastName
                  : existingUser.lastName,
              phoneNumber:
                validatedData.phoneNumber && validatedData.phoneNumber.trim() !== ''
                  ? validatedData.phoneNumber
                  : existingUser.phoneNumber,
              isActive: false,
              emailVerified: null,
            },
          });
          console.log('✅ [REGISTER] Zaktualizowano rekord w bazie z nowym firebaseUid');
        }
      }
    } else {
      // Sprawdź czy numer telefonu już istnieje (tylko jeśli podany)
      if (validatedData.phoneNumber && validatedData.phoneNumber.trim() !== '') {
        const existingPhone = await prisma.user.findFirst({
          where: { phoneNumber: validatedData.phoneNumber },
        });

        if (existingPhone && existingPhone.firebaseUid) {
          console.log('❌ [REGISTER] Numer telefonu już istnieje:', validatedData.phoneNumber);
          // Usuń użytkownika z Firebase bo nie można go zapisać w bazie
          try {
            await adminAuth.deleteUser(firebaseUser.uid);
          } catch (deleteError) {
            console.error('Błąd usuwania użytkownika z Firebase:', deleteError);
          }
          return NextResponse.json(
            { error: 'Użytkownik z tym numerem telefonu już istnieje' },
            { status: 400 }
          );
        }
      }

      // Utwórz nowego użytkownika w bazie danych
      console.log('➕ [REGISTER] Tworzenie nowego rekordu w bazie');
      user = await prisma.user.create({
        data: {
          firebaseUid: firebaseUser.uid,
          email: validatedData.email,
          firstName:
            validatedData.firstName && validatedData.firstName.trim() !== ''
              ? validatedData.firstName
              : null,
          lastName:
            validatedData.lastName && validatedData.lastName.trim() !== ''
              ? validatedData.lastName
              : null,
          phoneNumber:
            validatedData.phoneNumber && validatedData.phoneNumber.trim() !== ''
              ? validatedData.phoneNumber
              : null,
          isActive: false,
          role: 'USER_REGISTERED', // Poziom 1 - tylko logowanie
          emailVerified: null,
          isPhoneVerified: false,
          isProfileVerified: false,
        },
      });
      console.log('✅ [REGISTER] Utworzono nowy rekord w bazie');
    }

    // Sprawdź czy user został utworzony
    if (!user) {
      console.error('❌ [REGISTER] User nie został utworzony - to nie powinno się zdarzyć');
      return NextResponse.json(
        { error: 'Wystąpił błąd podczas tworzenia konta użytkownika' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Rejestracja zakończona pomyślnie. Sprawdź email w celu weryfikacji.',
        userId: user.id,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error, request, { endpoint: 'register' });
  }
}
