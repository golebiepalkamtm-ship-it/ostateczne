'use client';

import { auth } from '@/lib/firebase.client';
import { onAuthStateChanged, signOut as firebaseSignOut, User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
  useRef,
} from 'react';
import { debug, info, error, isDev } from '@/lib/logger';

// Definicja typu dla użytkownika z bazy danych
interface DbUser {
  id: string;
  firebaseUid: string;
  email: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  postalCode: string;
  phoneNumber: string;
  role: 'USER_REGISTERED' | 'USER_EMAIL_VERIFIED' | 'USER_FULL_VERIFIED' | 'ADMIN';
  isActive: boolean;
  isPhoneVerified: boolean;
  isProfileVerified: boolean;
  emailVerified: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface AuthContextType {
  user: User | null;
  dbUser: DbUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refetchDbUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  dbUser: null,
  loading: true,
  signOut: async () => {},
  refetchDbUser: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const syncInProgressRef = useRef<string | null>(null);

  const fetchAndSyncUser = useCallback(async (firebaseUser: User) => {
    // Zabezpieczenie przed wielokrotnym wywołaniem dla tego samego użytkownika
    if (syncInProgressRef.current === firebaseUser.uid) {
      if (isDev) debug('AuthContext: Sync already in progress for user:', firebaseUser.uid);
      return;
    }

    syncInProgressRef.current = firebaseUser.uid;
    if (isDev) debug('AuthContext: Syncing user with database:', firebaseUser.email);

    try {
      // Pobierz token (Firebase user jest już aktualny z onAuthStateChanged)
      const token = await firebaseUser.getIdToken(true);

      const response = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDbUser(data.user);
        if (isDev) debug('AuthContext: User synced successfully', data.user);

        // Zapisz token w cookie dla middleware
        document.cookie = `firebase-auth-token=${token}; path=/; max-age=3600; SameSite=Lax`;
      } else {
        error('AuthContext: Sync failed:', response.status, response.statusText);
        setDbUser(null);
      }
    } catch (err) {
      error('AuthContext: Sync error:', err instanceof Error ? err.message : err);
      setDbUser(null);
    } finally {
      // Reset po zakończeniu (z małym opóźnieniem, aby uniknąć race conditions)
      setTimeout(() => {
        if (syncInProgressRef.current === firebaseUser.uid) {
          syncInProgressRef.current = null;
        }
      }, 500);
    }
  }, []);

  const refetchDbUser = useCallback(async () => {
    if (user) {
      setLoading(true);
      await fetchAndSyncUser(user);
      setLoading(false);
    }
  }, [user, fetchAndSyncUser]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async firebaseUser => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await fetchAndSyncUser(firebaseUser);

        // Ustaw token w cookie również przy zmianie stanu użytkownika
        try {
          const token = await firebaseUser.getIdToken();
          document.cookie = `firebase-auth-token=${token}; path=/; max-age=3600; SameSite=Lax`;
        } catch (err) {
          error(
            'AuthContext: Error getting token for cookie:',
            err instanceof Error ? err.message : err
          );
        }
      } else {
        setDbUser(null);
        syncInProgressRef.current = null;
        // Usuń cookie przy wylogowaniu
        document.cookie = 'firebase-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      }
      setLoading(false);
    });

    // Nasłuchuj na zmiany w localStorage (komunikacja między kartami)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'email-verified' && user) {
        info('AuthContext: Email verified event detected from another tab - refreshing user');
        // Odśwież użytkownika po weryfikacji w innej karcie
        refetchDbUser();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [fetchAndSyncUser, user, refetchDbUser]);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setDbUser(null);
      // Usuń cookie przy wylogowaniu
      document.cookie = 'firebase-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      router.push('/');
    } catch (err) {
      error('Error signing out:', err instanceof Error ? err.message : err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, dbUser, loading, signOut, refetchDbUser }}>
      {children}
    </AuthContext.Provider>
  );
}
