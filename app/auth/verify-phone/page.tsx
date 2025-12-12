'use client';

import { UnifiedLayout } from '@/components/layout/UnifiedLayout';
import ClientProviders from '@/components/providers/ClientProviders';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase.client';

import { motion } from 'framer-motion';
import { ArrowLeft, Phone, Shield } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { 
  signInWithPhoneNumber, 
  RecaptchaVerifier, 
  PhoneAuthProvider,
  ConfirmationResult,
  updateProfile,
} from 'firebase/auth';

function VerifyPhoneContent() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);
  const createdVerifierRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/register');
    }
  }, [user, loading, router]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  // Initialize Recaptcha once on mount. We use a ref to store the created
  // verifier so cleanup can run reliably without causing effect re-runs.
  useEffect(() => {
    if (typeof window === 'undefined' || !recaptchaContainerRef.current || !auth) return;

    if (!createdVerifierRef.current) {
      const verifier = new RecaptchaVerifier(auth, recaptchaContainerRef.current, {
        size: 'invisible',
        callback: (response: any) => {
          console.log('reCAPTCHA verified');
        },
        'expired-callback': () => {
          setError('reCAPTCHA wygasł. Spróbuj ponownie.');
        },
      });

      createdVerifierRef.current = verifier;
      setRecaptchaVerifier(verifier);
    }

    return () => {
      try {
        createdVerifierRef.current?.clear();
      } catch (e) {
        // ignore cleanup errors
      }
      createdVerifierRef.current = null;
    };
  }, []);

  const normalizePhoneNumber = (phone: string): string => {
    // Remove all non-digits
    let cleaned = phone.replace(/\D/g, '');
    
    // If doesn't start with country code, add Poland's
    if (!cleaned.startsWith('48') && cleaned.length === 9) {
      cleaned = '48' + cleaned;
    }
    
    // Add + prefix for Firebase
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    
    return cleaned;
  };

  const sendVerificationCode = async () => {
    if (!user || !auth) return;

    setIsLoading(true);
    setError('');

    try {
      const normalizedPhone = normalizePhoneNumber(phoneNumber);

      // Send SMS via Firebase
      const result = await signInWithPhoneNumber(auth, normalizedPhone, recaptchaVerifier!);
      
      setConfirmationResult(result);
      setIsCodeSent(true);
      setCountdown(60);
      setSuccess('Kod weryfikacyjny został wysłany SMS na Twój numer telefonu');

    } catch (error: any) {
      console.error('Firebase Phone Auth error:', error);
      
      let errorMessage = 'Nie udało się wysłać kodu';
      if (error.code === 'auth/invalid-phone-number') {
        errorMessage = 'Nieprawidłowy format numeru telefonu';
      } else if (error.code === 'auth/quota-exceeded') {
        errorMessage = 'Przekroczono limit wysyłania SMS. Spróbuj później.';
      } else if (error.code === 'auth/app-not-authorized') {
        errorMessage = 'Aplikacja nie jest autoryzowana do wysyłania SMS';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!confirmationResult || !verificationCode.trim() || verificationCode.length !== 6) {
      setError('Wprowadź 6-cyfrowy kod weryfikacyjny');
      return;
    }

    if (!user) return;

    setIsLoading(true);
    setError('');

    try {
      // Verify the code with Firebase
      const result = await confirmationResult.confirm(verificationCode);
      
      // If Firebase verification succeeded, update our database
      const token = await result.user.getIdToken();

      const response = await fetch('/api/phone/check-verification', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          code: verificationCode,
          verificationId: confirmationResult.verificationId, 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Nieprawidłowy kod weryfikacyjny');
      }

      setSuccess('Numer telefonu został zweryfikowany pomyślnie!');

      // Przekieruj do dashboard po krótkiej chwili
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
      
    } catch (error: any) {
      console.error('Błąd weryfikacji kodu:', error);
      
      let errorMessage = 'Wystąpił błąd podczas weryfikacji kodu';
      if (error.code === 'auth/invalid-verification-code') {
        errorMessage = 'Nieprawidłowy kod weryfikacyjny';
      } else if (error.code === 'auth/invalid-verification-id') {
        errorMessage = 'Sesja weryfikacji wygasła. Wyślij kod ponownie.';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const resendCode = async () => {
    if (countdown > 0) return;
    setIsCodeSent(false);
    setVerificationCode('');
    setConfirmationResult(null);
    await sendVerificationCode();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/70">Ładowanie...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-start justify-center p-4 pt-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-lg"
      >
        <div className="card p-6">
          <div className="flex items-center mb-6">
            <Link
              href="/dashboard"
              className="mr-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white/70" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Weryfikacja numeru telefonu</h1>
              <p className="text-white/70 text-sm">
                Zweryfikuj swój numer telefonu, aby uzyskać pełny dostęp do platformy
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
              <p className="text-green-300 text-sm">{success}</p>
            </div>
          )}

          {!isCodeSent ? (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8 text-blue-400" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">Wyślij kod weryfikacyjny</h2>
                <p className="text-white/70 text-sm">
                  Firebase wyśle SMS z kodem weryfikacyjnym na Twój numer telefonu
                </p>
              </div>

              <input
                type="tel"
                value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value)}
                placeholder="Wprowadź numer telefonu (np. 123456789)"
                className="w-full text-center text-lg py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />

              <motion.button
                onClick={sendVerificationCode}
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Wysyłanie...' : 'Wyślij kod weryfikacyjny'}
              </motion.button>
              
              {/* Invisible reCAPTCHA container */}
              <div ref={recaptchaContainerRef}></div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-green-400" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">
                  Wprowadź kod weryfikacyjny
                </h2>
                <p className="text-white/70 text-sm">
                  Wprowadź 6-cyfrowy kod, który otrzymałeś w SMS
                </p>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={e => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setVerificationCode(value);
                      setError('');
                    }}
                    placeholder="000000"
                    className="w-full text-center text-2xl font-mono py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    maxLength={6}
                  />
                </div>

                <motion.button
                  onClick={verifyCode}
                  disabled={isLoading || verificationCode.length !== 6}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Weryfikacja...' : 'Zweryfikuj kod'}
                </motion.button>

                <div className="text-center">
                  <button
                    onClick={resendCode}
                    disabled={countdown > 0}
                    className="text-blue-400 hover:text-blue-300 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {countdown > 0 ? `Wyślij ponownie za ${countdown}s` : 'Wyślij kod ponownie'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-white/20">
            <div className="text-center">
              <p className="text-white/50 text-xs mb-2">Dlaczego weryfikacja jest wymagana?</p>
              <div className="text-white/40 text-xs space-y-1">
                <p>• Bezpieczne transakcje i licytacje</p>
                <p>• Ochrona przed oszustwami</p>
                <p>• Pełny dostęp do wszystkich funkcji</p>
                <p>• Autentyczne SMS przez Firebase (nie testowe)</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function VerifyPhonePage() {
  return (
    <UnifiedLayout>
      <ClientProviders>
        <VerifyPhoneContent />
      </ClientProviders>
    </UnifiedLayout>
  );
}
