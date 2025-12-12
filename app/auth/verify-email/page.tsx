'use client';

import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
import ClientProviders from '@/components/providers/ClientProviders';
import { auth } from '@/lib/firebase.client';
import { applyActionCode, signInWithCustomToken, checkActionCode } from 'firebase/auth';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense, useRef } from 'react';
import '@/components/auth/AuthFlipCard.css';

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

    if (!oobCode) {
      setStatus('error');
      setMessage('Brak kodu weryfikacyjnego w linku');
      return;
    }

    if (globalVerificationExecuted || verificationStartedRef.current) {
      return;
    }

    verificationStartedRef.current = true;
    globalVerificationExecuted = true;

    const verifyEmail = async () => {
      try {
        if (!auth) throw new Error('Firebase nie jest zainicjalizowany');

        const actionCodeInfo = await checkActionCode(auth, oobCode);
        const email = actionCodeInfo.data.email;
        if (!email) throw new Error('Nie można wyciągnąć email z kodu');

        await applyActionCode(auth, oobCode);

        const verifyResponse = await fetch('/api/auth/verify-email-auto-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });

        if (!verifyResponse.ok) {
          const errorData = await verifyResponse.json();
          throw new Error(errorData.error || 'Błąd automatycznego logowania');
        }

        const { customToken } = await verifyResponse.json();
        const userCredential = await signInWithCustomToken(auth, customToken);
        const user = userCredential.user;
        const token = await user.getIdToken();

        await fetch('/api/auth/sync', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });

        document.cookie = `firebase-auth-token=${token}; path=/; max-age=3600; SameSite=Lax`;
        document.cookie = `level2-ok=1; path=/; max-age=86400; SameSite=Lax`;
        localStorage.setItem('email-verified', Date.now().toString());
        window.dispatchEvent(new Event('email-verified-complete'));

        setStatus('success');
        setMessage('Zostałeś automatycznie zalogowany');
      } catch (error: unknown) {
        const err = error as { code?: string; message?: string };
        
        if (err.code === 'auth/invalid-action-code') {
          setStatus('error');
          setMessage('Link już użyty lub nieprawidłowy. Zaloguj się do konta.');
        } else if (err.code === 'auth/expired-action-code') {
          setStatus('error');
          setMessage('Link wygasł. Zaloguj się i wyślij nowy.');
        } else {
          setStatus('error');
          setMessage(err.message || 'Wystąpił błąd weryfikacji');
        }
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  // Stacked layers for 3D effect
  const renderStackedLayers = () => {
    return [...Array(11)].map((_, i) => {
      const layer = 11 - i;
      const offset = layer * 1.5;
      const opacity = Math.max(0.2, 0.7 - layer * 0.05);
      return (
        <div
          key={i}
          className="auth-cube-layer"
          style={{
            borderColor: `rgba(0, 0, 0, ${opacity})`,
            backgroundColor: `rgba(0, 0, 0, ${opacity * 0.8})`,
            transform: `translateX(${offset}px) translateY(${offset / 2}px) translateZ(-${offset}px)`,
            zIndex: i + 1,
          }}
          aria-hidden="true"
        />
      );
    });
  };

  // Zawartość kostki w zależności od statusu
  const renderContent = () => {
    if (status === 'loading') {
      return (
        <div className="auth-3d-form-content">
          <div className="text-center py-6">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500 mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-white mb-2">Weryfikacja emaila...</h2>
            <p className="text-white/60 text-sm">Proszę czekać</p>
          </div>
        </div>
      );
    }

    if (status === 'success') {
      return (
        <div className="auth-3d-form-content">
          <div className="text-center">
            <div className="w-14 h-14 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-7 h-7 text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-1">Email zweryfikowany!</h2>
            <p className="text-xs text-white/70 mb-4">{message}</p>
            
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 mb-4 text-left">
              <p className="text-green-300 text-xs mb-2">✅ Konto częściowo aktywowane</p>
              <p className="text-white/70 text-xs mb-1">Aby uzyskać pełny dostęp:</p>
              <ul className="text-white/60 text-xs list-disc list-inside space-y-0.5">
                <li>Uzupełnij profil (imię, adres)</li>
                <li>Zweryfikuj telefon</li>
              </ul>
            </div>

            <motion.button
              onClick={() => router.push('/')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-semibold px-5 py-2.5 rounded-xl transition-all text-sm shadow-lg"
            >
              Przejdź na stronę główną →
            </motion.button>
          </div>
        </div>
      );
    }

    return (
      <div className="auth-3d-form-content">
        <div className="text-center">
          <div className="w-14 h-14 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <XCircle className="w-7 h-7 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Problem z weryfikacją</h2>
          <p className="text-white/60 text-xs mb-3">{message}</p>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-2.5 mb-3">
            <p className="text-yellow-300 text-xs">💡 Zaloguj się i wyślij ponownie link</p>
          </div>

          <div className="space-y-2">
            <motion.button
              onClick={() => router.push('/auth/register')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-semibold px-5 py-2.5 rounded-xl transition-all text-sm"
            >
              Zaloguj się
            </motion.button>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full bg-white/10 hover:bg-white/20 text-white font-medium px-5 py-2 rounded-xl transition-all text-xs border border-white/10"
            >
              Panel użytkownika
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="auth-cube-container">
      {/* Dekoracyjne tło */}
      <div className="auth-flip-background">
        <div className="geometric-grid"></div>
      </div>

      {/* Scene 3D */}
      <div
        className="auth-cube-scene relative z-10"
        style={{
          '--cube-width': '400px',
          '--cube-height': '480px',
          '--cube-depth': '200px',
        } as React.CSSProperties}
      >
        <div className="auth-cube">
          {/* Jedna ściana - front z weryfikacją */}
          <div className="auth-cube-face-wrapper auth-cube-front-wrapper">
            {renderStackedLayers()}
            <div className="auth-cube-face auth-cube-front">
              <div className="glow" aria-hidden="true"></div>
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
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
