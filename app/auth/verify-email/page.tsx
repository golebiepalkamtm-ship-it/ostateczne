'use client';

import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
import ClientProviders from '@/components/providers/ClientProviders';
import { auth } from '@/lib/firebase.client';
import { applyActionCode, signInWithCustomToken, checkActionCode } from 'firebase/auth';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense, useRef } from 'react';

// 🔒 GLOBALNA FLAGA - przetrwa re-renderingi i React Strict Mode
let globalVerificationExecuted = false;

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const verificationStartedRef = useRef(false);

  useEffect(() => {
    const oobCode = searchParams.get('oobCode');

    console.log('🔍 DEBUG: oobCode z URL:', oobCode);
    console.log('🔍 DEBUG: Wszystkie search params:', Object.fromEntries(searchParams.entries()));

    if (!oobCode) {
      setStatus('error');
      setMessage('Brak kodu weryfikacyjnego w linku');
      console.error('❌ Brak parametru oobCode w URL');
      return;
    }

    // 🔒 KRYTYCZNE: Sprawdź globalną flagę PRZED lokalną
    if (globalVerificationExecuted) {
      console.log('⚠️ Weryfikacja już została wykonana globalnie - pomijam');
      return;
    }

    // Lokalny ref jako dodatkowa ochrona
    if (verificationStartedRef.current) {
      console.log('⚠️ Weryfikacja już wystartowała w tym komponencie - pomijam');
      return;
    }

    verificationStartedRef.current = true;
    globalVerificationExecuted = true;

    const verifyEmail = async () => {
      try {
        if (!auth) {
          throw new Error('Firebase nie jest zainicjalizowany');
        }

        console.log('🔍 Rozpoczynam weryfikację z kodem:', oobCode);
        console.log('🔍 Długość kodu:', oobCode.length);

        // Najpierw sprawdź kod weryfikacyjny aby wyciągnąć email
        console.log('🔍 Wywołuję checkActionCode...');
        const actionCodeInfo = await checkActionCode(auth, oobCode);
        console.log('✅ checkActionCode sukces:', actionCodeInfo);
        const email = actionCodeInfo.data.email;

        if (!email) {
          throw new Error('Nie można wyciągnąć email z kodu weryfikacyjnego');
        }

        console.log('📧 Email z kodu:', email);

        // Zweryfikuj email w Firebase
        console.log('🔍 Wywołuję applyActionCode...');
        await applyActionCode(auth, oobCode);
        console.log('✅ applyActionCode zakończone pomyślnie');

        // Wywołaj API endpoint który stworzy custom token dla użytkownika z tym emailem
        console.log('🔐 Wysyłam request do /api/auth/verify-email-auto-login');
        const verifyResponse = await fetch('/api/auth/verify-email-auto-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        });

        if (!verifyResponse.ok) {
          const errorData = await verifyResponse.json();
          console.error('❌ Błąd API verify-email-auto-login:', errorData);
          throw new Error(errorData.error || 'Błąd automatycznego logowania');
        }

        const { customToken } = await verifyResponse.json();
        console.log('🎟️ Otrzymano custom token, logowanie...');

        // Zaloguj użytkownika używając custom token
        const userCredential = await signInWithCustomToken(auth, customToken);
        const user = userCredential.user;
        console.log('👤 Użytkownik zalogowany:', user.email);

        // Pobierz token (Firebase automatycznie ma już zaktualizowane claims po signInWithCustomToken)
        const token = await user.getIdToken();
        console.log('✅ Token uzyskany, emailVerified:', user.emailVerified);

        // Zsynchronizuj użytkownika z bazą danych
        console.log('🔄 Synchronizacja z bazą danych...');
        const syncResponse = await fetch('/api/auth/sync', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!syncResponse.ok) {
          const syncError = await syncResponse.json();
          console.error('❌ Błąd synchronizacji po weryfikacji:', syncError);
          // Nie przerywaj - kontynuuj nawet jeśli sync się nie powiódł
        } else {
          const syncData = await syncResponse.json();
          console.log('✅ Synchronizacja zakończona:', syncData);
        }

        // Zapisz token w cookie
        document.cookie = `firebase-auth-token=${token}; path=/; max-age=3600; SameSite=Lax`;
        document.cookie = `level2-ok=1; path=/; max-age=86400; SameSite=Lax`;

        // Wyślij event do innych kart przez localStorage
        localStorage.setItem('email-verified', Date.now().toString());

        // ✅✅✅ KRYTYCZNE: TYLKO TUTAJ ustawiamy sukces - na samym końcu!
        console.log('✅✅✅ USTAWIAM STATUS SUCCESS');
        setStatus('success');
        setMessage(
          '✅ Email zweryfikowany! Zostałeś automatycznie zalogowany. Uzupełnij dane i zweryfikuj telefon.'
        );

        // Komunikat zostaje widoczny bez automatycznego przekierowania
      } catch (error: unknown) {
        const err = error as { code?: string; message?: string };
        console.error('❌ Verification error:', error);
        console.error('❌ Error code:', err.code);
        console.error('❌ Error message:', err.message);
        console.error('❌ Full error object:', JSON.stringify(error, null, 2));
        console.log('❌❌❌ USTAWIAM STATUS ERROR');

        // Sprawdź czy to błąd związany z kodem weryfikacyjnym
        if (err.code === 'auth/invalid-action-code') {
          setStatus('error');
          setMessage(`❌ Link weryfikacyjny został już użyty lub jest nieprawidłowy. 
          
🔍 DEBUG INFO:
- Kod z URL: ${searchParams.get('oobCode')?.substring(0, 20)}...
- Długość: ${searchParams.get('oobCode')?.length}
- Error: ${err.message}

Jeśli to pierwszy raz gdy klikasz link, sprawdź czy Twój klient email nie modyfikuje linków. W przeciwnym razie zaloguj się do konta.`);
        } else if (err.code === 'auth/expired-action-code') {
          setStatus('error');
          setMessage(
            '❌ Link weryfikacyjny wygasł. Zaloguj się do swojego konta i wyślij nowy link weryfikacyjny.'
          );
        } else {
          // Inny błąd
          setStatus('error');
          setMessage(`❌ Wystąpił błąd podczas weryfikacji: ${err.message || 'Nieznany błąd'}. 
          
Error code: ${err.code || 'brak'}

Spróbuj zalogować się do konta.`);
        }

        // Komunikat zostaje widoczny bez automatycznego przekierowania
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20"
      >
        <div className="text-center">
          {status === 'loading' && (
            <>
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-6"></div>
              <h2 className="text-2xl font-bold text-white mb-2">Weryfikacja emaila...</h2>
              <p className="text-white/70">Proszę czekać, trwa weryfikacja Twojego adresu email</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">🎉 Email zweryfikowany!</h2>
              <p className="text-white/90 mb-6 text-lg">{message}</p>
              <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-6 mb-6">
                <p className="text-green-300 text-base mb-3">
                  ✅ Twoje konto zostało częściowo aktywowane!
                </p>
                <p className="text-green-200 text-sm mb-2">
                  Możesz teraz przejść do panelu użytkownika. Aby uzyskać pełny dostęp do platformy,
                  musisz:
                </p>
                <ul className="text-green-200 text-sm list-disc list-inside mt-2 space-y-1">
                  <li>Uzupełnić swój profil hodowcy (imię, nazwisko, adres)</li>
                  <li>Zweryfikować numer telefonu</li>
                </ul>
                <p className="text-green-100 text-sm mt-3 font-semibold">
                  💡 Dopiero po weryfikacji telefonu będziesz mógł tworzyć aukcje, licytować i
                  dodawać treści.
                </p>
              </div>

              <button
                onClick={() => router.push('/dashboard')}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold px-6 py-4 rounded-xl transition-all text-lg"
              >
                Przejdź do panelu teraz →
              </button>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-10 h-10 text-red-400" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">Problem z weryfikacją</h2>
              <p className="text-white/70 mb-4">{message}</p>

              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4 mb-6">
                <p className="text-yellow-300 text-sm mb-2">
                  💡 <strong>Co możesz zrobić?</strong>
                </p>
                <ol className="text-yellow-300 text-sm list-decimal list-inside space-y-1">
                  <li>Zaloguj się do swojego konta</li>
                  <li>Przejdź do panelu użytkownika</li>
                  <li>Jeśli potrzebujesz, wyślij ponownie email weryfikacyjny</li>
                </ol>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => router.push('/auth/register')}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold px-6 py-3 rounded-xl transition-all"
                >
                  Przejdź do logowania
                </button>

                <button
                  onClick={() => router.push('/dashboard')}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold px-6 py-3 rounded-xl transition-all"
                >
                  Przejdź do panelu użytkownika
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <UnifiedLayout>
      <ClientProviders>
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center p-4">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-white/70">Ładowanie...</p>
              </div>
            </div>
          }
        >
          <VerifyEmailContent />
        </Suspense>
      </ClientProviders>
    </UnifiedLayout>
  );
}
