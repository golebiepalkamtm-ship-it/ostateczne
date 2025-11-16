import { handleApiError } from '@/lib/error-handling';
import { getAdminAuth } from '@/lib/firebase-admin';
import { requireFirebaseAuth } from '@/lib/firebase-auth';
import { prisma } from '@/lib/prisma';
import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';

// Cache dla zapobieżenia race condition - przechowujemy DANE, nie Response
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const syncInProgress = new Map<string, Promise<any>>();

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireFirebaseAuth(req);

    // Sprawdź czy autoryzacja się powiodła
    if (authResult instanceof NextResponse) {
      return authResult; // Zwróć błąd autoryzacji
    }

    const user = authResult.decodedToken;
    const body = await req.json().catch(() => ({}));
    const emailVerifiedDate = user.email_verified ? new Date() : null;

    // Sprawdź czy sync już trwa dla tego użytkownika
    const existingSync = syncInProgress.get(user.uid);
    if (existingSync) {
      console.log('⏳ Sync already in progress, waiting...');
      try {
        const cachedData = await existingSync;
        return NextResponse.json(cachedData);
      } catch {
        // Jeśli poprzedni sync się nie powiódł, pozwól na nowy
        syncInProgress.delete(user.uid);
      }
    }

    // Utwórz promise dla tego syncu
    const syncPromise = (async () => {
      try {
        // Znajdź użytkownika po firebaseUid lub email
        let dbUser = await prisma.user.findFirst({
          where: {
            OR: [{ firebaseUid: user.uid }, { email: user.email! }],
          },
        });

        // Update lub create user
        if (dbUser) {
          // NIE nadpisuj roli ADMIN - zachowaj istniejącą rolę admina
          const shouldUpdateRole = 
            emailVerifiedDate && 
            dbUser.role !== 'ADMIN' && 
            dbUser.role !== 'USER_FULL_VERIFIED';
          
          dbUser = await prisma.user.update({
            where: { id: dbUser.id },
            data: {
              firebaseUid: user.uid, // Zawsze zaktualizuj firebaseUid jeśli się zmienił
              email: user.email!,
              emailVerified: emailVerifiedDate,
              isActive: emailVerifiedDate ? true : dbUser.isActive || false,
              ...(shouldUpdateRole ? { role: 'USER_EMAIL_VERIFIED' } : {}),
              ...(body.firstName && { firstName: body.firstName }),
              ...(body.lastName && { lastName: body.lastName }),
              ...(body.address && { address: body.address }),
              ...(body.city && { city: body.city }),
              ...(body.postalCode && { postalCode: body.postalCode }),
              ...(body.phoneNumber && { phoneNumber: body.phoneNumber }),
              updatedAt: new Date(),
            },
          });
        } else {
          dbUser = await prisma.user.create({
            data: {
              firebaseUid: user.uid,
              email: user.email!,
              firstName: body.firstName || '',
              lastName: body.lastName || '',
              address: body.address || '',
              city: body.city || '',
              postalCode: body.postalCode || '',
              phoneNumber: body.phoneNumber || '',
              role: emailVerifiedDate ? 'USER_EMAIL_VERIFIED' : 'USER_REGISTERED',
              isActive: emailVerifiedDate ? true : false,
              isPhoneVerified: false,
              isProfileVerified: false,
              emailVerified: emailVerifiedDate,
            },
          });
        }
        // Email verification logic (OAuth)
        if (!emailVerifiedDate && user.email) {
          const adminAuth = getAdminAuth();
          if (adminAuth) {
            try {
              const actionCodeSettings = {
                url: `${req.nextUrl.origin}/auth/verify-email`,
                handleCodeInApp: false,
              };
              const link = await adminAuth.generateEmailVerificationLink(
                user.email,
                actionCodeSettings
              );
              await fetch(`${req.nextUrl.origin}/api/email/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  to: user.email,
                  subject: '✅ Zweryfikuj swój email - Pałka MTM',
                  type: 'verification',
                  verificationLink: link,
                  userName: body.firstName || user.displayName || undefined,
                }),
              });
            } catch (emailSendError) {
              Sentry.captureException(emailSendError);
            }
          }
        }

        // --- KLUCZOWA LOGIKA: Podnoszenie roli ---
        // Pobierz świeżego usera z bazy (po update)
        let freshUser = await prisma.user.findFirst({
          where: { firebaseUid: user.uid },
        });

        // Jeśli spełnione warunki, podnieś rolę do USER_FULL_VERIFIED
        if (
          freshUser &&
          freshUser.isActive === true &&
          freshUser.isPhoneVerified === true &&
          freshUser.isProfileVerified === true &&
          freshUser.role !== 'ADMIN' &&
          freshUser.role !== 'USER_FULL_VERIFIED'
        ) {
          freshUser = await prisma.user.update({
            where: { id: freshUser.id },
            data: {
              role: 'USER_FULL_VERIFIED',
              updatedAt: new Date(),
            },
          });
          Sentry.captureMessage(`User ${freshUser.email} elevated to USER_FULL_VERIFIED`);
        }
        // Zwróć aktualnego usera
        return { success: true, user: freshUser };
      } catch (error) {
        console.error('❌ Sync error:', error);
        Sentry.captureException(error);
        throw error;
      }
    })();

    syncInProgress.set(user.uid, syncPromise);

    try {
      const data = await syncPromise;
      // Zwróć NOWY Response z danymi
      return NextResponse.json(data);
    } finally {
      // Usuń z cache po 2 sekundach
      setTimeout(() => syncInProgress.delete(user.uid), 2000);
    }
  } catch (error) {
    return handleApiError(error, req, { endpoint: 'auth/sync' });
  }
}
