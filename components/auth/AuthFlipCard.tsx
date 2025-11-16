'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useSearchParams } from 'next/navigation';
import FirebaseAuthForm from './FirebaseAuthForm';
import './AuthFlipCard.css';

type AuthMode = 'login' | 'register';

interface AuthFlipCardProps {
  initialMode?: AuthMode;
}

export function AuthFlipCard({ initialMode }: AuthFlipCardProps) {
  const searchParams = useSearchParams();

  // Ustal domyślny tryb na podstawie props, query params lub pathname
  const getInitialMode = (): AuthMode => {
    // 1. Props ma najwyższy priorytet
    if (initialMode) return initialMode;

    // 2. Query param ?mode=register
    const modeParam = searchParams.get('mode');
    if (modeParam === 'register') return 'register';

    // 3. Domyślnie register (użytkownik klika "Zarejestruj się")
    return 'register';
  };

  const [mode, setMode] = useState<AuthMode>(getInitialMode());

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
  };

  // Nasłuchuj na weryfikację emaila w innej karcie
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'email-verified') {
        toast.success('🎉 Email został zweryfikowany! Twoje konto jest aktywne.', {
          duration: 5000,
          position: 'top-center',
        });
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Wyłącz drugi toast - został już pokazany przez storage event
  // useEffect(() => {
  //   if (dbUser?.emailVerified && user?.emailVerified) {
  //     const hasShownToast = sessionStorage.getItem('email-verified-toast-shown')
  //     if (!hasShownToast) {
  //       toast.success('✅ Twój email jest zweryfikowany! Możesz teraz korzystać z pełnych funkcji.', {
  //         duration: 6000,
  //         position: 'top-center',
  //       })
  //       sessionStorage.setItem('email-verified-toast-shown', 'true')
  //     }
  //   }
  // }, [dbUser?.emailVerified, user?.emailVerified])

  return (
    <div className="auth-flip-container">
      {/* Main flip card content */}
      {/* ✨ Dekoracyjne tło geometryczne */}
      <div className="auth-flip-background">
        <div className="geometric-grid"></div>
        <div className="floating-elements">
          <div className="float-1"></div>
          <div className="float-2"></div>
          <div className="float-3"></div>
        </div>
      </div>

      {/* 🔄 Główna karta flipująca 3D */}
      <div className={`auth-flip-card ${mode === 'register' ? 'flipped' : ''}`}>
        {/* STRONA 1: Logowanie */}
        <div className="auth-flip-face auth-flip-front">
          <div className="auth-flip-content">
            <h2 className="auth-flip-title">Zaloguj się</h2>
            <p className="auth-flip-subtitle">Witaj z powrotem w świecie gołębi</p>
            <div className="auth-flip-form-wrapper">
              <FirebaseAuthForm initialMode="signin" hideAuthModeToggle={true} minimal={true} />
            </div>
            <div className="auth-flip-footer">
              <p className="auth-flip-toggle-label">Nie masz konta?</p>
              <button className="auth-flip-toggle-btn" onClick={toggleMode} type="button">
                Zarejestruj się →
              </button>
            </div>
          </div>
        </div>

        {/* STRONA 2: Rejestracja */}
        <div className="auth-flip-face auth-flip-back">
          <div className="auth-flip-content">
            <h2 className="auth-flip-title">Utwórz konto</h2>
            <p className="auth-flip-subtitle">Dołącz do naszej społeczności</p>
            <div className="auth-flip-form-wrapper">
              <FirebaseAuthForm initialMode="signup" hideAuthModeToggle={true} minimal={true} />
            </div>
            <div className="auth-flip-footer">
              <p className="auth-flip-toggle-label">Masz już konto?</p>
              <button className="auth-flip-toggle-btn" onClick={toggleMode} type="button">
                ← Zaloguj się
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 📍 Wskaźnik stanu (którą stronę widzisz) */}
      <div className="auth-flip-indicator">
        <span className={`indicator-dot ${mode === 'login' ? 'active' : ''}`}></span>
        <span className={`indicator-dot ${mode === 'register' ? 'active' : ''}`}></span>
      </div>
    </div>
  );
}

export default AuthFlipCard;
