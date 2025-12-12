import type { User } from '@prisma/client';
import type { UserRecord } from 'firebase-admin/auth';

interface UserUpdateData {
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: string | null;
}

/**
 * Przygotowuje dane do aktualizacji użytkownika, zachowując istniejące wartości jeśli nowe są puste
 */
export function prepareUserUpdateData(
  validatedData: UserUpdateData,
  existingUser: Pick<User, 'firstName' | 'lastName' | 'phoneNumber'>,
) {
  return {
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
  };
}

/**
 * Sprawdza czy użytkownik istnieje w Firebase po emailu lub UID
 */
export async function checkFirebaseUserExists(
  adminAuth: ReturnType<typeof import('@/lib/firebase-admin').getAdminAuth>,
  email?: string,
  uid?: string,
): Promise<{ exists: boolean; user: UserRecord | null }> {
  if (!adminAuth) {
    return { exists: false, user: null };
  }

  try {
    if (uid) {
      const user = await adminAuth.getUser(uid);
      return { exists: true, user };
    }
    if (email) {
      const user = await adminAuth.getUserByEmail(email);
      return { exists: true, user };
    }
  } catch (error: unknown) {
    const firebaseError = error as { code?: string };
    if (firebaseError?.code === 'auth/user-not-found') {
      return { exists: false, user: null };
    }
    throw error;
  }

  return { exists: false, user: null };
}
